import Web3 from 'web3';

const POLYGON_RPC = 'https://polygon-rpc.com';
const web3 = new Web3(POLYGON_RPC);

async function checkPolygonHead() {
  try {
    const latestBlock = await web3.eth.getBlockNumber();
    const block = await web3.eth.getBlock(latestBlock);

    console.log('📊 Polygon Network Status:');
    console.log(`   Latest Block: ${latestBlock.toLocaleString()}`);
    console.log(`   Block Time: ${new Date(Number(block.timestamp) * 1000).toISOString()}`);

    // Calculate actual progress
    const GENESIS_BLOCK = 50_000_000;
    const CURRENT_SUBGRAPH = 50_265_110;

    const totalBlocks = Number(latestBlock) - GENESIS_BLOCK;
    const indexedBlocks = CURRENT_SUBGRAPH - GENESIS_BLOCK;
    const actualProgress = ((indexedBlocks / totalBlocks) * 100).toFixed(2);

    console.log('\n📈 Actual Sync Progress:');
    console.log(`   Subgraph Block: ${CURRENT_SUBGRAPH.toLocaleString()}`);
    console.log(`   Network Head: ${latestBlock.toLocaleString()}`);
    console.log(`   Blocks Remaining: ${(Number(latestBlock) - CURRENT_SUBGRAPH).toLocaleString()}`);
    console.log(`   Progress: ${actualProgress}%`);

    if (actualProgress > 60) {
      console.log('\n✅ Dashboard 64% is approximately correct!');
    } else {
      console.log(`\n⚠️  Dashboard shows 64%, but calculation shows ${actualProgress}%`);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkPolygonHead();
