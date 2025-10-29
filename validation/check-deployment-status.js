import { GraphQLClient, gql } from 'graphql-request';
import chalk from 'chalk';

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/1704765/msq-tokens-subgraph/v0.0.2';

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

const TOKEN_QUERY = gql`
  query CheckToken {
    token(id: "0x98965474ecbec2f532f1f780ee37b0b05f77ca55") {
      id
      symbol
      name
      holderCount
      transferCount
      totalSupply
    }
  }
`;

const SNAPSHOT_QUERY = gql`
  query CheckSnapshots {
    dailySnapshots(
      first: 5
      orderBy: date
      orderDirection: desc
    ) {
      id
      date
      transferCount
      uniqueSenders
      uniqueReceivers
      uniqueAddresses
      holderCount
    }
  }
`;

async function checkStatus() {
  const client = new GraphQLClient(SUBGRAPH_URL);

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('    MSQ Tokens Subgraph - v0.0.2 Deployment Status'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  try {
    // Get sync status
    const syncData = await client.request(SYNC_STATUS_QUERY);
    const currentBlock = syncData._meta.block.number;
    const timestamp = new Date(syncData._meta.block.timestamp * 1000);
    const deployment = syncData._meta.deployment;
    const hasErrors = syncData._meta.hasIndexingErrors;

    // Calculate progress
    const GENESIS_BLOCK = 50_000_000;
    const ESTIMATED_CURRENT_POLYGON = 62_000_000; // Approximate
    const blocksIndexed = currentBlock - GENESIS_BLOCK;
    const totalBlocks = ESTIMATED_CURRENT_POLYGON - GENESIS_BLOCK;
    const progressPercent = ((blocksIndexed / totalBlocks) * 100).toFixed(2);

    console.log(chalk.yellow.bold('📊 Sync Status:'));
    console.log(`   Current Block: ${chalk.white(currentBlock.toLocaleString())}`);
    console.log(`   Block Time: ${chalk.white(timestamp.toISOString())}`);
    console.log(`   Deployment: ${chalk.white(deployment)}`);
    console.log(`   Indexing Errors: ${hasErrors ? chalk.red('YES ⚠️') : chalk.green('NO ✅')}`);
    console.log(`   Progress: ${chalk.cyan(progressPercent + '%')} (${blocksIndexed.toLocaleString()} / ${totalBlocks.toLocaleString()} blocks)\n`);

    // Determine milestone
    let milestone = '';
    if (progressPercent < 10) milestone = '⏳ Early Stage (0-10%)';
    else if (progressPercent < 75) milestone = '🔄 Syncing (10-75%)';
    else if (progressPercent < 95) milestone = '⚡ Almost There (75-95%)';
    else if (progressPercent < 100) milestone = '🎯 Nearly Complete (95-100%)';
    else milestone = '✅ Fully Synced';

    console.log(chalk.yellow.bold('🎯 Current Milestone:'));
    console.log(`   ${milestone}\n`);

    // Check token data
    console.log(chalk.yellow.bold('📈 Token Statistics:'));
    try {
      const tokenData = await client.request(TOKEN_QUERY);
      if (tokenData.token) {
        console.log(`   Symbol: ${chalk.white(tokenData.token.symbol)}`);
        console.log(`   Name: ${chalk.white(tokenData.token.name)}`);
        console.log(`   Total Supply: ${chalk.white(tokenData.token.totalSupply)}`);
        console.log(`   Transfer Count: ${chalk.white(tokenData.token.transferCount)}`);
        console.log(`   Holder Count: ${chalk.white(tokenData.token.holderCount)}`);

        // Bug fix verification
        const holderCount = parseInt(tokenData.token.holderCount);
        if (holderCount > 0) {
          console.log(chalk.green('   ✅ Bug Fix #2: holderCount tracking is working!'));
        } else if (parseInt(tokenData.token.transferCount) > 0) {
          console.log(chalk.yellow('   ⚠️  Bug Fix #2: holderCount still 0 (needs investigation)'));
        }
      } else {
        console.log(chalk.gray('   No token data yet (still syncing early blocks)'));
      }
    } catch (error) {
      console.log(chalk.gray('   No token data yet (still syncing early blocks)'));
    }
    console.log();

    // Check snapshots
    console.log(chalk.yellow.bold('📅 Recent DailySnapshots:'));
    try {
      const snapshotData = await client.request(SNAPSHOT_QUERY);
      if (snapshotData.dailySnapshots.length > 0) {
        let hasNonZeroUnique = false;
        snapshotData.dailySnapshots.slice(0, 3).forEach((snapshot, idx) => {
          const date = new Date(parseInt(snapshot.date) * 1000).toISOString().split('T')[0];
          console.log(`   ${idx + 1}. ${date}:`);
          console.log(`      Transfers: ${snapshot.transferCount}, Unique Addresses: ${snapshot.uniqueAddresses}`);

          if (parseInt(snapshot.uniqueAddresses) > 0) {
            hasNonZeroUnique = true;
          }
        });

        if (hasNonZeroUnique) {
          console.log(chalk.green('   ✅ Bug Fix #1: Unique address tracking is working!'));
        } else {
          console.log(chalk.yellow('   ⚠️  Bug Fix #1: All unique counts still 0 (may need more progress)'));
        }
      } else {
        console.log(chalk.gray('   No snapshots yet (still syncing early blocks)'));
      }
    } catch (error) {
      console.log(chalk.gray('   No snapshots yet (still syncing early blocks)'));
    }
    console.log();

    // Next steps
    console.log(chalk.yellow.bold('🎯 Next Steps:'));
    if (progressPercent < 10) {
      console.log(chalk.gray('   ⏳ Wait for 10% sync to see first data'));
      console.log(chalk.gray('   ⏳ Estimated time: ~30 minutes'));
    } else if (progressPercent < 75) {
      console.log(chalk.gray('   🔄 Continue monitoring sync progress'));
      console.log(chalk.gray('   ⏳ Run validation at 75% milestone'));
    } else if (progressPercent < 95) {
      console.log(chalk.cyan('   ▶  Run partial validation: npm run validate:snapshots'));
      console.log(chalk.cyan('   ▶  Run metadata validation: npm run validate:metadata'));
    } else {
      console.log(chalk.green('   ▶  Run full validation: npm run validate:all'));
    }

    console.log();
    console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  } catch (error) {
    console.log(chalk.red('❌ Error checking deployment status:'));
    console.log(`   ${error.message}\n`);
  }
}

checkStatus();
