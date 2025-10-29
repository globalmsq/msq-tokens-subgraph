import { GraphQLClient, gql } from 'graphql-request';
import chalk from 'chalk';

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/1704765/msq-tokens-subgraph/v0.0.3';

const META_QUERY = gql`
  query Meta {
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

const TOKENS_QUERY = gql`
  query AllTokens {
    tokens(orderBy: symbol) {
      id
      symbol
      name
      decimals
      totalSupply
      holderCount
      transferCount
      isProxy
      isMintable
      isPausable
      implementationAddress
    }
  }
`;

async function testDeployment() {
  const client = new GraphQLClient(SUBGRAPH_URL);

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('    v0.0.3 Deployment Test - Multi-Token Support'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  try {
    // Test 1: Meta info
    console.log(chalk.yellow.bold('📊 Test 1: Deployment Meta Info'));
    const metaData = await client.request(META_QUERY);
    console.log(`   Current Block: ${chalk.white(metaData._meta.block.number.toLocaleString())}`);
    console.log(`   Block Time: ${chalk.white(new Date(metaData._meta.block.timestamp * 1000).toISOString())}`);
    console.log(`   Deployment Hash: ${chalk.white(metaData._meta.deployment)}`);
    console.log(`   Has Errors: ${metaData._meta.hasIndexingErrors ? chalk.red('YES ⚠️') : chalk.green('NO ✅')}\n`);

    if (metaData._meta.deployment === 'QmPh8y5759PRd7sDK6MpPv1fRU9Pc2m89fy3zrZXbibeDB') {
      console.log(chalk.green('   ✅ Build Hash matches v0.0.3!\n'));
    } else {
      console.log(chalk.yellow('   ⚠️  Build Hash mismatch (may take a few moments to update)\n'));
    }

    // Test 2: All tokens
    console.log(chalk.yellow.bold('🪙 Test 2: All Tokens Status'));
    const tokensData = await client.request(TOKENS_QUERY);

    if (tokensData.tokens.length === 0) {
      console.log(chalk.yellow('   ⏳ No tokens yet (indexing just started)\n'));
    } else {
      console.log(`   Found ${chalk.cyan(tokensData.tokens.length)} token(s):\n`);

      tokensData.tokens.forEach((token, idx) => {
        console.log(`   ${idx + 1}. ${chalk.white.bold(token.symbol)} (${token.name})`);
        console.log(`      Address: ${token.id}`);
        console.log(`      Decimals: ${token.decimals}`);
        console.log(`      Total Supply: ${token.totalSupply}`);
        console.log(`      Holders: ${token.holderCount}`);
        console.log(`      Transfers: ${token.transferCount}`);

        if (token.isProxy) {
          console.log(chalk.blue(`      🔗 Proxy: ${token.implementationAddress}`));
        }
        if (token.isMintable) {
          console.log(chalk.green(`      🪙 Mintable`));
        }
        if (token.isPausable) {
          console.log(chalk.yellow(`      ⏸️  Pausable`));
        }
        console.log();
      });

      // Verify expected tokens
      const expectedTokens = ['MSQ', 'SUT', 'KWT', 'P2UC'];
      const foundSymbols = tokensData.tokens.map(t => t.symbol);
      const missingTokens = expectedTokens.filter(s => !foundSymbols.includes(s));

      if (missingTokens.length === 0) {
        console.log(chalk.green('   ✅ All 4 tokens found!\n'));
      } else {
        console.log(chalk.yellow(`   ⏳ Missing tokens (still indexing): ${missingTokens.join(', ')}\n`));
      }
    }

    console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  } catch (error) {
    console.log(chalk.red('❌ Error testing deployment:'));
    console.log(`   ${error.message}\n`);
  }
}

testDeployment();
