#!/usr/bin/env node

import axios from 'axios';
import { request, gql } from 'graphql-request';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { checkSyncStatus } from './check-sync-status.js';

dotenv.config();

const SUBGRAPH_URL = process.env.SUBGRAPH_URL;
const TOKEN_ADDRESS = process.env.SUT_TOKEN_ADDRESS.toLowerCase();
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || '';

const TRANSFERS_QUERY = gql`
  query GetTransfers($tokenAddress: String!, $startBlock: BigInt!) {
    transfers(
      first: 1000
      orderBy: blockNumber
      orderDirection: desc
      where: {
        token: $tokenAddress
        blockNumber_gte: $startBlock
      }
    ) {
      id
      from
      to
      amount
      transactionHash
      blockNumber
      blockTimestamp
      isMint
      isBurn
      logIndex
    }
  }
`;

async function fetchPolygonscanTransfers(startBlock, endBlock) {
  try {
    console.log(chalk.blue('📡 Fetching transfers from Polygonscan...'));

    const url = 'https://api.polygonscan.com/api';
    const params = {
      module: 'account',
      action: 'tokentx',
      contractaddress: TOKEN_ADDRESS,
      startblock: startBlock,
      endblock: endBlock,
      sort: 'desc',
      apikey: POLYGONSCAN_API_KEY
    };

    const response = await axios.get(url, { params });

    if (response.data.status !== '1') {
      throw new Error(`Polygonscan API error: ${response.data.message}`);
    }

    const transfers = response.data.result;
    console.log(chalk.green(`✅ Found ${transfers.length} transfers from Polygonscan`));

    return transfers;
  } catch (error) {
    console.error(chalk.red('❌ Error fetching from Polygonscan:'), error.message);
    throw error;
  }
}

async function fetchSubgraphTransfers(startBlock) {
  try {
    console.log(chalk.blue('📡 Fetching transfers from Subgraph...'));

    const variables = {
      tokenAddress: TOKEN_ADDRESS,
      startBlock: startBlock.toString()
    };

    const data = await request(SUBGRAPH_URL, TRANSFERS_QUERY, variables);
    const transfers = data.transfers;

    console.log(chalk.green(`✅ Found ${transfers.length} transfers from Subgraph`));

    return transfers;
  } catch (error) {
    console.error(chalk.red('❌ Error fetching from Subgraph:'), error.message);
    throw error;
  }
}

function compareTransfers(polygonscanTransfers, subgraphTransfers) {
  console.log(chalk.blue('\n🔍 Comparing transfers...\n'));

  const mismatches = [];
  const missing = [];
  const extra = [];

  // Create lookup maps
  const polygonscanMap = new Map();
  polygonscanTransfers.forEach(tx => {
    const key = `${tx.hash}-${tx.logIndex}`;
    polygonscanMap.set(key, tx);
  });

  const subgraphMap = new Map();
  subgraphTransfers.forEach(tx => {
    const key = `${tx.transactionHash}-${tx.logIndex}`;
    subgraphMap.set(key, tx);
  });

  // Check for missing and mismatched transfers
  for (const [key, psTx] of polygonscanMap.entries()) {
    const sgTx = subgraphMap.get(key);

    if (!sgTx) {
      missing.push({
        txHash: psTx.hash,
        block: psTx.blockNumber,
        from: psTx.from,
        to: psTx.to,
        value: psTx.value
      });
      continue;
    }

    // Validate fields
    const errors = [];

    if (sgTx.from.toLowerCase() !== psTx.from.toLowerCase()) {
      errors.push(`from: expected ${psTx.from}, got ${sgTx.from}`);
    }

    if (sgTx.to.toLowerCase() !== psTx.to.toLowerCase()) {
      errors.push(`to: expected ${psTx.to}, got ${sgTx.to}`);
    }

    if (sgTx.amount !== psTx.value) {
      errors.push(`amount: expected ${psTx.value}, got ${sgTx.amount}`);
    }

    if (sgTx.blockNumber !== psTx.blockNumber) {
      errors.push(`blockNumber: expected ${psTx.blockNumber}, got ${sgTx.blockNumber}`);
    }

    // Validate mint/burn flags
    const expectedMint = psTx.from === '0x0000000000000000000000000000000000000000';
    const expectedBurn = psTx.to === '0x0000000000000000000000000000000000000000';

    if (sgTx.isMint !== expectedMint) {
      errors.push(`isMint: expected ${expectedMint}, got ${sgTx.isMint}`);
    }

    if (sgTx.isBurn !== expectedBurn) {
      errors.push(`isBurn: expected ${expectedBurn}, got ${sgTx.isBurn}`);
    }

    if (errors.length > 0) {
      mismatches.push({
        txHash: psTx.hash,
        block: psTx.blockNumber,
        errors
      });
    }
  }

  // Check for extra transfers in subgraph
  for (const [key, sgTx] of subgraphMap.entries()) {
    if (!polygonscanMap.has(key)) {
      extra.push({
        txHash: sgTx.transactionHash,
        block: sgTx.blockNumber,
        from: sgTx.from,
        to: sgTx.to,
        amount: sgTx.amount
      });
    }
  }

  return { mismatches, missing, extra, total: polygonscanTransfers.length };
}

function printResults(results) {
  console.log(chalk.bold('\n📊 Validation Results:\n'));

  console.log(`Total Polygonscan Transfers: ${chalk.yellow(results.total)}`);
  console.log(`Missing in Subgraph: ${results.missing.length === 0 ? chalk.green(0) : chalk.red(results.missing.length)}`);
  console.log(`Extra in Subgraph: ${results.extra.length === 0 ? chalk.green(0) : chalk.yellow(results.extra.length)}`);
  console.log(`Mismatched Fields: ${results.mismatches.length === 0 ? chalk.green(0) : chalk.red(results.mismatches.length)}`);

  if (results.missing.length > 0) {
    console.log(chalk.red('\n❌ Missing Transfers:'));
    results.missing.slice(0, 5).forEach(tx => {
      console.log(`   ${chalk.yellow(tx.txHash)} (block ${tx.block})`);
      console.log(`      ${tx.from} → ${tx.to}: ${tx.value}`);
    });
    if (results.missing.length > 5) {
      console.log(`   ... and ${results.missing.length - 5} more`);
    }
  }

  if (results.extra.length > 0) {
    console.log(chalk.yellow('\n⚠️  Extra Transfers in Subgraph:'));
    results.extra.slice(0, 5).forEach(tx => {
      console.log(`   ${chalk.yellow(tx.txHash)} (block ${tx.block})`);
      console.log(`      ${tx.from} → ${tx.to}: ${tx.amount}`);
    });
    if (results.extra.length > 5) {
      console.log(`   ... and ${results.extra.length - 5} more`);
    }
  }

  if (results.mismatches.length > 0) {
    console.log(chalk.red('\n❌ Field Mismatches:'));
    results.mismatches.slice(0, 5).forEach(tx => {
      console.log(`   ${chalk.yellow(tx.txHash)} (block ${tx.block})`);
      tx.errors.forEach(err => console.log(`      • ${err}`));
    });
    if (results.mismatches.length > 5) {
      console.log(`   ... and ${results.mismatches.length - 5} more`);
    }
  }

  const passed = results.missing.length === 0 && results.mismatches.length === 0;
  console.log(chalk.bold(`\n${passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL')}: Transfer validation ${passed ? 'passed' : 'failed'}\n`));

  return passed;
}

async function validateTransfers() {
  try {
    console.log(chalk.bold.blue('🔄 Starting Transfer Validation\n'));

    // Get sync status and validation window
    const syncStatus = await checkSyncStatus();
    const { validationStartBlock, currentBlock } = syncStatus;

    console.log(); // Add spacing

    // Fetch data from both sources
    const [polygonscanTransfers, subgraphTransfers] = await Promise.all([
      fetchPolygonscanTransfers(validationStartBlock, currentBlock),
      fetchSubgraphTransfers(validationStartBlock)
    ]);

    // Compare transfers
    const results = compareTransfers(polygonscanTransfers, subgraphTransfers);

    // Print results
    const passed = printResults(results);

    return {
      passed,
      polygonscanTotal: results.total,
      subgraphTotal: subgraphTransfers.length,
      missing: results.missing.length,
      extra: results.extra.length,
      mismatches: results.mismatches.length,
      details: results
    };

  } catch (error) {
    console.error(chalk.red('❌ Validation failed:'), error.message);
    throw error;
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateTransfers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { validateTransfers };
