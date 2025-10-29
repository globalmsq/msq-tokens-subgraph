#!/usr/bin/env node

import { request, gql } from 'graphql-request';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const SUBGRAPH_URL = process.env.SUBGRAPH_URL;
const TOKEN_ADDRESS = process.env.SUT_TOKEN_ADDRESS.toLowerCase();
const SECONDS_PER_DAY = 86400;

const DAILY_SNAPSHOTS_QUERY = gql`
  query GetDailySnapshots($tokenAddress: String!, $days: Int!) {
    dailySnapshots(
      first: $days
      orderBy: date
      orderDirection: desc
      where: {
        token: $tokenAddress
      }
    ) {
      id
      date
      transferCount
      volumeTransferred
      uniqueSenders
      uniqueReceivers
      uniqueAddresses
      newHolders
      holderCount
      mintCount
      burnCount
      mintVolume
      burnVolume
    }
  }
`;

const DAY_TRANSFERS_QUERY = gql`
  query GetDayTransfers($tokenAddress: String!, $startTimestamp: BigInt!, $endTimestamp: BigInt!) {
    transfers(
      first: 1000
      where: {
        token: $tokenAddress
        blockTimestamp_gte: $startTimestamp
        blockTimestamp_lt: $endTimestamp
      }
    ) {
      from
      to
      amount
      isMint
      isBurn
    }
  }
`;

async function fetchDailySnapshots(days = 7) {
  try {
    console.log(chalk.blue(`📡 Fetching last ${days} daily snapshots...`));

    const variables = {
      tokenAddress: TOKEN_ADDRESS,
      days
    };

    const data = await request(SUBGRAPH_URL, DAILY_SNAPSHOTS_QUERY, variables);
    const snapshots = data.dailySnapshots;

    console.log(chalk.green(`✅ Found ${snapshots.length} daily snapshots`));

    return snapshots;
  } catch (error) {
    console.error(chalk.red('❌ Error fetching snapshots:'), error.message);
    throw error;
  }
}

async function fetchDayTransfers(dayTimestamp) {
  try {
    const startTimestamp = dayTimestamp;
    const endTimestamp = dayTimestamp + SECONDS_PER_DAY;

    const variables = {
      tokenAddress: TOKEN_ADDRESS,
      startTimestamp: startTimestamp.toString(),
      endTimestamp: endTimestamp.toString()
    };

    const data = await request(SUBGRAPH_URL, DAY_TRANSFERS_QUERY, variables);
    return data.transfers;
  } catch (error) {
    console.error(chalk.red(`❌ Error fetching transfers for day ${dayTimestamp}:`), error.message);
    throw error;
  }
}

function calculateDayAggregates(transfers) {
  const uniqueSenders = new Set();
  const uniqueReceivers = new Set();
  const uniqueAddresses = new Set();
  let totalVolume = BigInt(0);
  let mintCount = 0;
  let burnCount = 0;
  let mintVolume = BigInt(0);
  let burnVolume = BigInt(0);

  for (const tx of transfers) {
    // Track unique addresses
    if (!tx.isMint) {
      uniqueSenders.add(tx.from.toLowerCase());
      uniqueAddresses.add(tx.from.toLowerCase());
    }
    if (!tx.isBurn) {
      uniqueReceivers.add(tx.to.toLowerCase());
      uniqueAddresses.add(tx.to.toLowerCase());
    }

    // Track volume
    const amount = BigInt(tx.amount);
    totalVolume = totalVolume + amount;

    // Track mint/burn
    if (tx.isMint) {
      mintCount++;
      mintVolume = mintVolume + amount;
    }
    if (tx.isBurn) {
      burnCount++;
      burnVolume = burnVolume + amount;
    }
  }

  return {
    transferCount: transfers.length,
    volumeTransferred: totalVolume.toString(),
    uniqueSenders: uniqueSenders.size,
    uniqueReceivers: uniqueReceivers.size,
    uniqueAddresses: uniqueAddresses.size,
    mintCount,
    burnCount,
    mintVolume: mintVolume.toString(),
    burnVolume: burnVolume.toString()
  };
}

async function validateSnapshot(snapshot) {
  console.log(chalk.blue(`\n🔍 Validating snapshot for ${new Date(parseInt(snapshot.date) * 1000).toISOString().split('T')[0]}...`));

  try {
    // Fetch all transfers for this day
    const transfers = await fetchDayTransfers(parseInt(snapshot.date));

    if (transfers.length === 1000) {
      console.log(chalk.yellow(`⚠️  Warning: Fetched exactly 1000 transfers (may be more, pagination needed)`));
    }

    // Calculate expected aggregates
    const expected = calculateDayAggregates(transfers);

    // Compare with snapshot
    const mismatches = [];

    if (snapshot.transferCount.toString() !== expected.transferCount.toString()) {
      mismatches.push({
        field: 'transferCount',
        expected: expected.transferCount,
        actual: snapshot.transferCount
      });
    }

    if (snapshot.volumeTransferred !== expected.volumeTransferred) {
      mismatches.push({
        field: 'volumeTransferred',
        expected: expected.volumeTransferred,
        actual: snapshot.volumeTransferred
      });
    }

    if (snapshot.uniqueSenders.toString() !== expected.uniqueSenders.toString()) {
      mismatches.push({
        field: 'uniqueSenders',
        expected: expected.uniqueSenders,
        actual: snapshot.uniqueSenders
      });
    }

    if (snapshot.uniqueReceivers.toString() !== expected.uniqueReceivers.toString()) {
      mismatches.push({
        field: 'uniqueReceivers',
        expected: expected.uniqueReceivers,
        actual: snapshot.uniqueReceivers
      });
    }

    if (snapshot.uniqueAddresses.toString() !== expected.uniqueAddresses.toString()) {
      mismatches.push({
        field: 'uniqueAddresses',
        expected: expected.uniqueAddresses,
        actual: snapshot.uniqueAddresses
      });
    }

    if (snapshot.mintCount.toString() !== expected.mintCount.toString()) {
      mismatches.push({
        field: 'mintCount',
        expected: expected.mintCount,
        actual: snapshot.mintCount
      });
    }

    if (snapshot.burnCount.toString() !== expected.burnCount.toString()) {
      mismatches.push({
        field: 'burnCount',
        expected: expected.burnCount,
        actual: snapshot.burnCount
      });
    }

    if (mismatches.length > 0) {
      console.log(chalk.red('❌ Mismatches found:'));
      mismatches.forEach(m => {
        console.log(`   ${m.field}: expected ${m.expected}, got ${m.actual}`);
      });
    } else {
      console.log(chalk.green('✅ All fields match'));
    }

    return {
      date: snapshot.date,
      mismatches,
      transferCount: transfers.length
    };

  } catch (error) {
    console.error(chalk.red(`❌ Error validating snapshot:`), error.message);
    throw error;
  }
}

async function validateSnapshots(snapshots) {
  console.log(chalk.blue('\n🔍 Validating daily snapshots...\n'));

  const results = [];

  for (const snapshot of snapshots) {
    const result = await validateSnapshot(snapshot);
    results.push(result);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

function printResults(results) {
  console.log(chalk.bold('\n📊 Snapshot Validation Results:\n'));

  const totalSnapshots = results.length;
  const snapshotsWithMismatches = results.filter(r => r.mismatches.length > 0).length;
  const perfectSnapshots = totalSnapshots - snapshotsWithMismatches;

  console.log(`Total Snapshots Validated: ${chalk.yellow(totalSnapshots)}`);
  console.log(`Perfect Matches: ${chalk.green(perfectSnapshots)}`);
  console.log(`With Mismatches: ${snapshotsWithMismatches === 0 ? chalk.green(0) : chalk.red(snapshotsWithMismatches)}`);

  if (snapshotsWithMismatches > 0) {
    console.log(chalk.red('\n❌ Snapshots with mismatches:'));
    results.filter(r => r.mismatches.length > 0).forEach(result => {
      const dateStr = new Date(parseInt(result.date) * 1000).toISOString().split('T')[0];
      console.log(`   ${chalk.yellow(dateStr)}: ${result.mismatches.length} field(s) mismatched`);
    });
  }

  const passed = snapshotsWithMismatches === 0 && totalSnapshots > 0;
  console.log(chalk.bold(`\n${passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL')}: Snapshot validation ${passed ? 'passed' : 'failed'}\n`));

  return passed;
}

async function validateDailySnapshots() {
  try {
    console.log(chalk.bold.blue('🔄 Starting Snapshot Validation\n'));

    // Fetch recent snapshots
    const snapshots = await fetchDailySnapshots(7);

    if (snapshots.length === 0) {
      console.log(chalk.yellow('⚠️  No snapshots found to validate'));
      return {
        passed: true,
        totalSnapshots: 0,
        withMismatches: 0,
        details: []
      };
    }

    // Validate each snapshot
    const results = await validateSnapshots(snapshots);

    // Print results
    const passed = printResults(results);

    const withMismatches = results.filter(r => r.mismatches.length > 0).length;

    return {
      passed,
      totalSnapshots: results.length,
      withMismatches,
      details: results
    };

  } catch (error) {
    console.error(chalk.red('❌ Validation failed:'), error.message);
    throw error;
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateDailySnapshots()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { validateDailySnapshots };
