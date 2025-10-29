import { GraphQLClient, gql } from 'graphql-request';

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/1704765/msq-tokens-subgraph/v0.0.2';

const INTROSPECTION_QUERY = gql`
  query IntrospectionQuery {
    __type(name: "DailySnapshot") {
      name
      fields {
        name
        type {
          name
          kind
        }
      }
    }
  }
`;

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

async function checkDeployment() {
  const client = new GraphQLClient(SUBGRAPH_URL);

  console.log('🔍 Checking v0.0.2 deployment...\n');

  try {
    // Check sync status
    console.log('📊 Sync Status:');
    const syncData = await client.request(SYNC_STATUS_QUERY);
    console.log(`   Block: ${syncData._meta.block.number.toLocaleString()}`);
    console.log(`   Timestamp: ${new Date(syncData._meta.block.timestamp * 1000).toISOString()}`);
    console.log(`   Deployment: ${syncData._meta.deployment}`);
    console.log(`   Has Errors: ${syncData._meta.hasIndexingErrors ? 'YES ⚠️' : 'NO ✅'}\n`);

    // Check schema
    console.log('📋 DailySnapshot Schema Fields:');
    const schemaData = await client.request(INTROSPECTION_QUERY);
    const fields = schemaData.__type.fields.map(f => f.name).sort();

    // Check for new fields
    const hasNewFields = fields.includes('senderAddresses') && fields.includes('receiverAddresses');

    console.log(`   Total fields: ${fields.length}`);
    console.log(`   Has senderAddresses: ${fields.includes('senderAddresses') ? '✅' : '❌'}`);
    console.log(`   Has receiverAddresses: ${fields.includes('receiverAddresses') ? '✅' : '❌'}\n`);

    if (hasNewFields) {
      console.log('✅ v0.0.2 deployment is ACTIVE with new schema!');
    } else {
      console.log('⚠️  v0.0.2 endpoint exists but schema has not updated yet.');
      console.log('   This is normal - The Graph may take a few minutes to apply schema changes.');
    }

  } catch (error) {
    if (error.message && (error.message.includes('404') || error.message.includes('not found'))) {
      console.log('❌ v0.0.2 endpoint not found yet.');
      console.log('   Deployment may still be processing. This can take 5-15 minutes.\n');
    } else {
      console.log('❌ Error checking deployment:');
      console.log(`   ${error.message}\n`);
    }
  }
}

checkDeployment();
