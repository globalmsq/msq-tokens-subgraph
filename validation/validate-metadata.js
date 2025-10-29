#!/usr/bin/env node

import { Web3 } from 'web3';
import { request, gql } from 'graphql-request';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const SUBGRAPH_URL = process.env.SUBGRAPH_URL;
const TOKEN_ADDRESS = process.env.SUT_TOKEN_ADDRESS.toLowerCase();
const RPC_URL = process.env.POLYGON_RPC_URL;

const web3 = new Web3(RPC_URL);

const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  }
];

const TOKEN_QUERY = gql`
  query GetToken($tokenAddress: ID!) {
    token(id: $tokenAddress) {
      id
      address
      symbol
      name
      decimals
      isProxy
      isMintable
      isPausable
      implementationAddress
      totalSupply
      transferCount
      holderCount
      totalVolumeTransferred
      mintCount
      burnCount
      deployBlock
      firstTransferTimestamp
      lastTransferTimestamp
    }
  }
`;

async function fetchTokenFromSubgraph() {
  try {
    console.log(chalk.blue('📡 Fetching token data from Subgraph...'));

    const variables = {
      tokenAddress: TOKEN_ADDRESS
    };

    const data = await request(SUBGRAPH_URL, TOKEN_QUERY, variables);
    const token = data.token;

    if (!token) {
      throw new Error('Token not found in subgraph');
    }

    console.log(chalk.green('✅ Token data fetched from Subgraph'));

    return token;
  } catch (error) {
    console.error(chalk.red('❌ Error fetching token:'), error.message);
    throw error;
  }
}

async function fetchTokenFromContract() {
  try {
    console.log(chalk.blue('📡 Fetching token data from contract...'));

    const contract = new web3.eth.Contract(ERC20_ABI, TOKEN_ADDRESS);

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.methods.name().call(),
      contract.methods.symbol().call(),
      contract.methods.decimals().call(),
      contract.methods.totalSupply().call()
    ]);

    console.log(chalk.green('✅ Token data fetched from contract'));

    return {
      name,
      symbol,
      decimals: parseInt(decimals.toString()),
      totalSupply: totalSupply.toString()
    };
  } catch (error) {
    console.error(chalk.red('❌ Error fetching from contract:'), error.message);
    throw error;
  }
}

function validateMetadata(subgraphToken, contractToken) {
  console.log(chalk.blue('\n🔍 Validating token metadata...\n'));

  const expectedMetadata = {
    symbol: 'SUT',
    name: 'SUPER TRUST',
    decimals: 18,
    isProxy: false,
    isMintable: false,
    isPausable: true
  };

  const mismatches = [];

  // Validate static metadata
  if (subgraphToken.symbol !== expectedMetadata.symbol) {
    mismatches.push({
      field: 'symbol',
      expected: expectedMetadata.symbol,
      actual: subgraphToken.symbol
    });
  }

  if (subgraphToken.name !== expectedMetadata.name) {
    mismatches.push({
      field: 'name',
      expected: expectedMetadata.name,
      actual: subgraphToken.name
    });
  }

  if (parseInt(subgraphToken.decimals) !== expectedMetadata.decimals) {
    mismatches.push({
      field: 'decimals',
      expected: expectedMetadata.decimals,
      actual: subgraphToken.decimals
    });
  }

  if (subgraphToken.isProxy !== expectedMetadata.isProxy) {
    mismatches.push({
      field: 'isProxy',
      expected: expectedMetadata.isProxy,
      actual: subgraphToken.isProxy
    });
  }

  if (subgraphToken.isMintable !== expectedMetadata.isMintable) {
    mismatches.push({
      field: 'isMintable',
      expected: expectedMetadata.isMintable,
      actual: subgraphToken.isMintable
    });
  }

  if (subgraphToken.isPausable !== expectedMetadata.isPausable) {
    mismatches.push({
      field: 'isPausable',
      expected: expectedMetadata.isPausable,
      actual: subgraphToken.isPausable
    });
  }

  // Validate contract data
  if (contractToken.symbol !== expectedMetadata.symbol) {
    console.log(chalk.yellow(`⚠️  Contract symbol differs from expected: ${contractToken.symbol}`));
  }

  if (contractToken.name !== expectedMetadata.name) {
    console.log(chalk.yellow(`⚠️  Contract name differs from expected: ${contractToken.name}`));
  }

  // Compare subgraph with contract
  if (subgraphToken.symbol !== contractToken.symbol) {
    mismatches.push({
      field: 'symbol (contract)',
      expected: contractToken.symbol,
      actual: subgraphToken.symbol
    });
  }

  if (subgraphToken.name !== contractToken.name) {
    mismatches.push({
      field: 'name (contract)',
      expected: contractToken.name,
      actual: subgraphToken.name
    });
  }

  if (parseInt(subgraphToken.decimals) !== contractToken.decimals) {
    mismatches.push({
      field: 'decimals (contract)',
      expected: contractToken.decimals,
      actual: subgraphToken.decimals
    });
  }

  // Validate totalSupply (may differ during sync)
  const totalSupplyMatch = subgraphToken.totalSupply === contractToken.totalSupply;

  if (mismatches.length > 0) {
    console.log(chalk.red('❌ Metadata mismatches found:'));
    mismatches.forEach(m => {
      console.log(`   ${m.field}: expected ${m.expected}, got ${m.actual}`);
    });
  } else {
    console.log(chalk.green('✅ All metadata fields match'));
  }

  console.log(chalk.blue('\n📊 Current State:'));
  console.log(`   Symbol: ${chalk.yellow(subgraphToken.symbol)} (contract: ${contractToken.symbol})`);
  console.log(`   Name: ${chalk.yellow(subgraphToken.name)} (contract: ${contractToken.name})`);
  console.log(`   Decimals: ${chalk.yellow(subgraphToken.decimals)} (contract: ${contractToken.decimals})`);
  console.log(`   Total Supply: ${chalk.yellow(subgraphToken.totalSupply)} (contract: ${contractToken.totalSupply})`);
  console.log(`   Total Supply Match: ${totalSupplyMatch ? chalk.green('YES') : chalk.yellow('NO (sync in progress)')}`);
  console.log(`   Transfer Count: ${chalk.yellow(subgraphToken.transferCount)}`);
  console.log(`   Holder Count: ${chalk.yellow(subgraphToken.holderCount)}`);
  console.log(`   Total Volume: ${chalk.yellow(subgraphToken.totalVolumeTransferred)}`);

  return { mismatches, totalSupplyMatch };
}

function printResults(results) {
  console.log(chalk.bold('\n📊 Metadata Validation Results:\n'));

  const staticMetadataCorrect = results.mismatches.length === 0;
  const totalSupplyMatches = results.totalSupplyMatch;

  console.log(`Static Metadata Correct: ${staticMetadataCorrect ? chalk.green('YES') : chalk.red('NO')}`);
  console.log(`Total Supply Matches: ${totalSupplyMatches ? chalk.green('YES') : chalk.yellow('NO (expected during sync)')}`);
  console.log(`Mismatched Fields: ${results.mismatches.length === 0 ? chalk.green(0) : chalk.red(results.mismatches.length)}`);

  const passed = staticMetadataCorrect;
  console.log(chalk.bold(`\n${passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL')}: Metadata validation ${passed ? 'passed' : 'failed'}\n`));

  return passed;
}

async function validateTokenMetadata() {
  try {
    console.log(chalk.bold.blue('🔄 Starting Metadata Validation\n'));

    // Fetch data from both sources
    const [subgraphToken, contractToken] = await Promise.all([
      fetchTokenFromSubgraph(),
      fetchTokenFromContract()
    ]);

    // Validate metadata
    const results = validateMetadata(subgraphToken, contractToken);

    // Print results
    const passed = printResults(results);

    return {
      passed,
      staticMetadataCorrect: results.mismatches.length === 0,
      totalSupplyMatches: results.totalSupplyMatch,
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
  validateTokenMetadata()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { validateTokenMetadata };
