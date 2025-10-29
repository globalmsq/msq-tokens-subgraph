#!/usr/bin/env node

import { request, gql } from 'graphql-request';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const SUBGRAPH_URL = process.env.SUBGRAPH_URL;

const SYNC_STATUS_QUERY = gql`
  query SyncStatus {
    _meta {
      block {
        number
        timestamp
        hash
      }
      deployment
      hasIndexingErrors
    }
  }
`;

async function checkSyncStatus() {
  try {
    console.log(chalk.blue('🔍 Checking subgraph sync status...\n'));

    const data = await request(SUBGRAPH_URL, SYNC_STATUS_QUERY);
    const meta = data._meta;

    const currentBlock = parseInt(meta.block.number);
    const currentTimestamp = parseInt(meta.block.timestamp);
    const currentDate = new Date(currentTimestamp * 1000);

    console.log(chalk.green('✅ Subgraph Status:'));
    console.log(`   Current Block: ${chalk.yellow(currentBlock.toLocaleString())}`);
    console.log(`   Block Timestamp: ${chalk.yellow(currentDate.toISOString())}`);
    console.log(`   Block Hash: ${chalk.gray(meta.block.hash)}`);
    console.log(`   Deployment: ${chalk.gray(meta.deployment)}`);
    console.log(`   Has Indexing Errors: ${meta.hasIndexingErrors ? chalk.red('YES') : chalk.green('NO')}`);

    // Calculate validation window
    const hoursBack = parseInt(process.env.VALIDATION_HOURS_BACK) || 24;
    const secondsBack = hoursBack * 3600;
    const validationStartTimestamp = currentTimestamp - secondsBack;

    // Polygon blocks are ~2 seconds apart
    const avgBlockTime = 2;
    const blocksBack = Math.floor(secondsBack / avgBlockTime);
    const validationStartBlock = currentBlock - blocksBack;

    console.log(chalk.blue(`\n📊 Validation Window (last ${hoursBack} hours):`));
    console.log(`   Start Block: ${chalk.yellow(validationStartBlock.toLocaleString())}`);
    console.log(`   End Block: ${chalk.yellow(currentBlock.toLocaleString())}`);
    console.log(`   Total Blocks: ${chalk.yellow(blocksBack.toLocaleString())}`);
    console.log(`   Start Time: ${chalk.yellow(new Date(validationStartTimestamp * 1000).toISOString())}`);
    console.log(`   End Time: ${chalk.yellow(currentDate.toISOString())}`);

    return {
      currentBlock,
      currentTimestamp,
      validationStartBlock,
      validationStartTimestamp,
      hasIndexingErrors: meta.hasIndexingErrors
    };

  } catch (error) {
    console.error(chalk.red('❌ Error checking sync status:'), error.message);
    throw error;
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkSyncStatus()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { checkSyncStatus };
