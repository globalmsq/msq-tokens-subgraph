import { GraphQLClient, gql } from 'graphql-request';
import chalk from 'chalk';

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/1704765/msq-tokens-subgraph/v0.0.2';

const SNAPSHOT_QUERY = gql`
  query CheckSnapshots {
    dailySnapshots(
      first: 10
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

async function verifyFixes() {
  const client = new GraphQLClient(SUBGRAPH_URL);

  console.log(chalk.cyan('🔍 Verifying Bug Fixes in v0.0.2\n'));

  try {
    // Check Token holderCount
    console.log(chalk.yellow('📊 Token Statistics:'));
    const tokenData = await client.request(TOKEN_QUERY);

    if (tokenData.token) {
      console.log(`   Symbol: ${tokenData.token.symbol}`);
      console.log(`   Transfer Count: ${tokenData.token.transferCount}`);
      console.log(`   Holder Count: ${tokenData.token.holderCount}`);

      if (parseInt(tokenData.token.holderCount) > 0) {
        console.log(chalk.green('   ✅ Bug Fix #2 WORKING: holderCount > 0\n'));
      } else {
        console.log(chalk.yellow('   ⏳ holderCount still 0 (may need more sync progress)\n'));
      }
    }

    // Check DailySnapshots
    console.log(chalk.yellow('📅 Recent DailySnapshots:'));
    const snapshotData = await client.request(SNAPSHOT_QUERY);

    if (snapshotData.dailySnapshots.length === 0) {
      console.log(chalk.yellow('   ⏳ No snapshots yet (re-indexing just started)\n'));
      return;
    }

    let allZeroUnique = true;
    snapshotData.dailySnapshots.forEach((snapshot, idx) => {
      const date = new Date(parseInt(snapshot.date) * 1000).toISOString().split('T')[0];
      console.log(`   ${idx + 1}. Date: ${date}`);
      console.log(`      Transfers: ${snapshot.transferCount}`);
      console.log(`      Unique Senders: ${snapshot.uniqueSenders}`);
      console.log(`      Unique Receivers: ${snapshot.uniqueReceivers}`);
      console.log(`      Unique Addresses: ${snapshot.uniqueAddresses}`);
      console.log(`      Holder Count: ${snapshot.holderCount}`);

      if (parseInt(snapshot.uniqueSenders) > 0 ||
          parseInt(snapshot.uniqueReceivers) > 0 ||
          parseInt(snapshot.uniqueAddresses) > 0) {
        allZeroUnique = false;
      }
    });

    console.log();
    if (!allZeroUnique) {
      console.log(chalk.green('✅ Bug Fix #1 WORKING: Unique address tracking is functional!'));
    } else {
      console.log(chalk.yellow('⏳ All unique counts still 0 (may need more sync progress)'));
    }

  } catch (error) {
    console.log(chalk.red('❌ Error verifying fixes:'));
    console.log(`   ${error.message}`);
  }
}

verifyFixes();
