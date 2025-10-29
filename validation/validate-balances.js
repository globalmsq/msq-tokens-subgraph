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
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  }
];

const ACTIVE_ACCOUNTS_QUERY = gql`
  query GetActiveAccounts($tokenAddress: String!, $limit: Int!) {
    tokenAccounts(
      first: $limit
      orderBy: lastTransferTimestamp
      orderDirection: desc
      where: {
        token: $tokenAddress
      }
    ) {
      id
      account
      balance
      transferCount
      lastTransferBlock
      lastTransferTimestamp
    }
  }
`;

async function fetchActiveAccounts(limit = 50) {
  try {
    console.log(chalk.blue(`📡 Fetching top ${limit} active accounts from Subgraph...`));

    const variables = {
      tokenAddress: TOKEN_ADDRESS,
      limit
    };

    const data = await request(SUBGRAPH_URL, ACTIVE_ACCOUNTS_QUERY, variables);
    const accounts = data.tokenAccounts;

    console.log(chalk.green(`✅ Found ${accounts.length} active accounts`));

    return accounts;
  } catch (error) {
    console.error(chalk.red('❌ Error fetching accounts:'), error.message);
    throw error;
  }
}

async function getContractBalance(accountAddress) {
  try {
    const contract = new web3.eth.Contract(ERC20_ABI, TOKEN_ADDRESS);
    const balance = await contract.methods.balanceOf(accountAddress).call();
    return balance.toString();
  } catch (error) {
    console.error(chalk.red(`❌ Error getting balance for ${accountAddress}:`), error.message);
    throw error;
  }
}

async function validateBalances(accounts) {
  console.log(chalk.blue('\n🔍 Validating balances against contract state...\n'));

  const mismatches = [];
  let validatedCount = 0;

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];

    try {
      // Get actual balance from contract
      const contractBalance = await getContractBalance(account.account);
      const subgraphBalance = account.balance;

      if (contractBalance !== subgraphBalance) {
        mismatches.push({
          address: account.account,
          contractBalance,
          subgraphBalance,
          difference: (BigInt(contractBalance) - BigInt(subgraphBalance)).toString()
        });
        console.log(chalk.red(`❌ Mismatch: ${account.account}`));
        console.log(`   Contract: ${contractBalance}`);
        console.log(`   Subgraph: ${subgraphBalance}`);
        console.log(`   Diff: ${(BigInt(contractBalance) - BigInt(subgraphBalance)).toString()}`);
      } else {
        validatedCount++;
        if (i < 5 || (i + 1) % 10 === 0) {
          console.log(chalk.green(`✅ ${account.account}: ${contractBalance}`));
        }
      }

      // Rate limiting - delay between RPC calls
      if (i < accounts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      console.error(chalk.yellow(`⚠️  Could not validate ${account.account}: ${error.message}`));
    }
  }

  return { mismatches, validatedCount, totalAccounts: accounts.length };
}

function printResults(results) {
  console.log(chalk.bold('\n📊 Balance Validation Results:\n'));

  console.log(`Total Accounts Checked: ${chalk.yellow(results.totalAccounts)}`);
  console.log(`Successfully Validated: ${chalk.green(results.validatedCount)}`);
  console.log(`Mismatched Balances: ${results.mismatches.length === 0 ? chalk.green(0) : chalk.red(results.mismatches.length)}`);

  if (results.mismatches.length > 0) {
    console.log(chalk.red('\n❌ Balance Mismatches:'));
    results.mismatches.forEach(mismatch => {
      console.log(`   ${chalk.yellow(mismatch.address)}`);
      console.log(`      Contract: ${mismatch.contractBalance}`);
      console.log(`      Subgraph: ${mismatch.subgraphBalance}`);
      console.log(`      Difference: ${mismatch.difference}`);
    });
  }

  const passed = results.mismatches.length === 0 && results.validatedCount > 0;
  console.log(chalk.bold(`\n${passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL')}: Balance validation ${passed ? 'passed' : 'failed'}\n`));

  return passed;
}

async function validateAccountBalances() {
  try {
    console.log(chalk.bold.blue('🔄 Starting Balance Validation\n'));

    // Fetch active accounts from subgraph
    const accounts = await fetchActiveAccounts(50);

    if (accounts.length === 0) {
      console.log(chalk.yellow('⚠️  No accounts found to validate'));
      return {
        passed: true,
        validatedCount: 0,
        mismatches: 0,
        details: { mismatches: [], validatedCount: 0, totalAccounts: 0 }
      };
    }

    // Validate balances
    const results = await validateBalances(accounts);

    // Print results
    const passed = printResults(results);

    return {
      passed,
      validatedCount: results.validatedCount,
      totalAccounts: results.totalAccounts,
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
  validateAccountBalances()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { validateAccountBalances };
