# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MSQ Tokens Subgraph** - A unified Graph Protocol subgraph for indexing multiple ERC-20 tokens on Polygon network.

**Supported Tokens:**
- **MSQ** (MSQUARE): 0x6A8Ec2d9BfBDD20A7F5A4E89D640F7E7cebA4499 - Standard ERC-20
- **SUT** (SUPER TRUST): 0x98965474EcBeC2F532F1f780ee37b0b05f77Ca55 - ERC-20 + Pausable
- **KWT** (Korean Won Token): 0x435001Af7fC65B621B0043df99810B2f30860c5d - ERC-1967 Proxy + Mintable
- **P2UC** (Point to You Coin): 0x8B3C6ff5911392dECB5B08611822280dEe0E4f64 - ERC-1967 Proxy

This subgraph tracks Transfer events, holder balances, transaction statistics, mint/burn operations, and provides a unified GraphQL API for efficient querying of multi-token data.

## Technology Stack

- **Platform**: The Graph Studio (Decentralized Network)
- **Network**: Polygon (Chain ID: 137)
- **Language**: AssemblyScript
- **Schema**: GraphQL
- **Token Standard**: ERC-20
- **Node.js**: v18+
- **Graph CLI**: v0.71.1+
- **Graph TypeScript**: v0.35.1+

## Development Commands

### Initial Setup
```bash
# Install Graph CLI globally
npm install -g @graphprotocol/graph-cli

# Install dependencies
npm install
```

### Development Workflow
```bash
# Generate types from schema
npm run codegen

# Build the subgraph
npm run build

# Authenticate with The Graph Studio (get deploy key from Studio dashboard)
graph auth <YOUR_DEPLOY_KEY>

# Deploy to The Graph Studio
graph deploy <SUBGRAPH_SLUG>
```

**For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Testing
```bash
# Note: matchstick-as doesn't support Darwin arm64 (Apple Silicon)
# Testing is done on real network after deployment
```

## Core Architecture

### Multi-Token Design

This subgraph uses a **unified architecture** that supports multiple tokens in a single deployment:

**Architecture Pattern**: Single subgraph with multiple `dataSources`
- One GraphQL endpoint for all tokens
- Shared event handler (`handleTransfer`) for all tokens
- Composite entity IDs to prevent conflicts: `{tokenAddress}-{accountAddress}`
- Cross-token analytics capabilities (portfolio views, multi-token holders)

**Supported Token Types:**
- Standard ERC-20 tokens (MSQ, SUT)
- Proxy contracts (KWT, P2UC) - uses proxy address, not implementation
- Mintable tokens (KWT) - detects mint via `from == 0x0`
- Pausable tokens (SUT, KWT) - no special handling needed

### Data Model (GraphQL Schema)

**Token Entity** - Per-token global metrics
- Symbol, name, decimals, token characteristics (isProxy, isMintable, isPausable)
- totalSupply (updates on mint/burn), transferCount, holderCount, totalVolumeTransferred
- mintCount, burnCount for mintable tokens
- Implementation address for proxy tokens
- Single instance keyed by contract address (lowercase)

**TokenAccount Entity** - Per-(token, account) balance tracking
- Composite ID: `{tokenAddress}-{accountAddress}`
- balance, transferCount, sentCount, receivedCount
- first/lastTransferBlock timestamps
- Bidirectional relationships with Transfer entities via @derivedFrom

**Transfer Entity** - Individual transaction records
- from/to accounts, amount, block metadata
- isMint, isBurn flags for mint/burn detection
- Composite ID: `{tokenAddress}-{txHash}-{logIndex}` for uniqueness
- Links to TokenAccount entities (null for mint/burn zero address)

**DailySnapshot Entity** - Time-series aggregations per token
- Daily statistics: transferCount, volumeTransferred, uniqueAddresses, newHolders
- mintCount, burnCount, mintVolume, burnVolume
- Composite ID: `{tokenAddress}-{dayTimestamp}` for efficient querying

**HourlySnapshot Entity** (Optional) - High-resolution analytics
- Hourly metrics for detailed time-series analysis
- Composite ID: `{tokenAddress}-{hourTimestamp}`

### Event Handlers

**handleTransfer(event: Transfer)**
- Updates sender and receiver Account balances
- Creates Transfer entity with transaction metadata
- Increments Token.transferCount and totalVolumeTransferred
- Updates Account first/lastTransferBlock timestamps
- Updates or creates DailySnapshot for the day

**Key Implementation Patterns:**
- Use `entity.load()` with null checks, create if doesn't exist
- Always call `entity.save()` after modifications
- Handle zero address (0x0000...0000) for mint/burn detection
- Use BigInt arithmetic for all token amounts
- Normalize amounts using token decimals when displaying

### Assembly Script Specifics

- **No nullable types**: Check for null after `.load()` operations
- **BigInt operations**: Use `.plus()`, `.minus()`, `.times()`, `.div()`
- **String conversions**: Use `.toHexString()` for addresses
- **Array operations**: Limited compared to TypeScript, use loops instead of high-order functions
- **No floating point**: All calculations must use BigInt

### AssemblyScript Gotchas (Critical)

**Non-null Assertion Operator (`!`)**
AssemblyScript doesn't narrow types after null checks like TypeScript does. Use `!` operator when you've verified a value isn't null:

```typescript
// ❌ Wrong - AssemblyScript won't narrow the type
if (config.implementationAddress) {
  token.implementationAddress = Bytes.fromHexString(config.implementationAddress);
  // Error: Type '~lib/string/String | null' is not assignable
}

// ✅ Correct - Use ! operator
if (config.implementationAddress) {
  token.implementationAddress = Bytes.fromHexString(config.implementationAddress!);
}
```

**Schema Immutable Requirement**
All `@entity` directives MUST include explicit `immutable` argument:

```graphql
# ❌ Wrong - Will fail deployment
type Token @entity {
  id: ID!
}

# ✅ Correct - Explicit immutable argument
type Token @entity(immutable: false) {  # For entities that update
  id: ID!
}

type Transfer @entity(immutable: true) {  # For historical records
  id: ID!
}
```

**When to use `immutable: true` vs `immutable: false`:**
- `immutable: true`: Historical records that never change (Transfer events)
- `immutable: false`: Entities that update over time (Token stats, balances, snapshots)

## Important Conventions

### Entity ID Patterns (Multi-Token Scoping)
- **Token**: Contract address (lowercase hex) - e.g., `0x98965474...`
- **TokenAccount**: Composite `{tokenAddress}-{accountAddress}` - e.g., `0x98965474...-0x1234abcd...`
- **Transfer**: Composite `{tokenAddress}-{txHash}-{logIndex}` - e.g., `0x98965474...-0xabcd1234...-5`
- **DailySnapshot**: Composite `{tokenAddress}-{dayTimestamp}` - e.g., `0x98965474...-1698537600`

**Why Composite IDs?**
- Prevents conflicts when same account holds multiple tokens
- Enables efficient filtering by token in queries
- Allows independent entity lifecycle per token

### Balance Updates
Always update both:
1. Account.balance (current balance)
2. Token.totalVolumeTransferred (cumulative volume)

Never subtract from totalVolumeTransferred - it's a cumulative metric.

### Zero Address Handling
- `from = 0x0000...0000`: Token mint, don't decrement sender balance
- `to = 0x0000...0000`: Token burn, don't increment receiver balance
- Still create Transfer entity for historical record

### Block Timestamp Usage
- Event timestamps are in seconds (not milliseconds)
- DailySnapshot uses day-level granularity: `timestamp - (timestamp % 86400)`

### Proxy Contract Handling

**How Proxy Patterns Work in The Graph:**
- Always use the **proxy address** in subgraph.yaml, NOT the implementation address
- Transfer events are emitted by the proxy contract
- Implementation upgrades don't affect subgraph (same event signature)
- No special handling needed in code - works like standard ERC-20

**Supported Proxy Types:**
- ERC-1967 Transparent Proxy (KWT, P2UC)
- UUPS Proxy
- Any proxy that emits standard ERC-20 Transfer events

**Token Configuration:**
- Store implementation address in Token entity (`implementationAddress` field)
- Set `isProxy: true` flag in Token entity metadata
- Useful for debugging and transparency, but doesn't affect event processing

### Mintable Token Handling

**Mint Detection:**
- Mint occurs when `from == 0x0000...0000` in Transfer event
- No separate Mint event handler needed
- Same Transfer event handler processes both regular transfers and mints

**Automatic Processing:**
- `isMint` flag set to true in Transfer entity
- Token.totalSupply increases by mint amount
- Token.mintCount incremented
- DailySnapshot.mintCount and mintVolume updated
- No TokenAccount created for zero address

**Burn Detection:**
- Burn occurs when `to == 0x0000...0000` in Transfer event
- `isBurn` flag set to true in Transfer entity
- Token.totalSupply decreases by burn amount
- Token.burnCount incremented

**Pausable Token Note:**
- Pausable functionality doesn't affect subgraph operation
- When paused, Transfer events simply stop being emitted
- Subgraph automatically resumes when unpaused

## Data Validation

**Critical Checks:**
- All amounts must be non-negative BigInt
- Account balance should never go negative (indicates logic error)
- Transfer.from and Transfer.to must reference valid Account entities
- Historical data must match Polygonscan exactly

**Cross-Verification Sources:**
- Polygonscan API: https://polygonscan.com/token/0x9D3103f1179870374FDeC7E8c6db481798299e4a
- Direct RPC calls to Polygon node
- Token contract ABI calls for totalSupply verification

## Performance Considerations

### Query Optimization
- Use indexed fields (id, blockNumber, blockTimestamp) in filters
- Limit result sets with `first` parameter (max 1000)
- Use `orderBy` with indexed fields for efficient sorting
- Avoid nested queries more than 2-3 levels deep

### Indexing Efficiency
- Minimize entity.load() calls - cache in variables when used multiple times
- Batch-friendly: Single event handler should complete in <100ms
- Avoid complex calculations - defer to query layer when possible

## Deployment Strategy

### The Graph Studio
- Studio dashboard: https://thegraph.com/studio/
- Free for development and testing
- Automatic IPFS pinning and indexing
- Query endpoint: `https://api.studio.thegraph.com/query/<ACCOUNT_ID>/<SUBGRAPH_SLUG>/<VERSION>`

### Deployment Process
1. Create subgraph in Studio dashboard (web UI)
2. Copy deploy key from Studio
3. Authenticate: `graph auth <DEPLOY_KEY>`
4. Deploy: `graph deploy <SUBGRAPH_SLUG>`
5. Enter version label (e.g., v0.0.1)

**For complete deployment guide with troubleshooting, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Health Monitoring
- Check sync status in Studio dashboard
- Monitor indexing status: "Syncing" → "Synced"
- Monitor health status: "Healthy" vs "Unhealthy" vs "Failed"
- Expected sync time: 2-4 hours for historical data (depends on start block)
- Expected indexing lag: <30 seconds behind chain head once synced

### Publishing to Decentralized Network
After Studio testing:
- Click "Publish" in Studio dashboard
- Requires GRT token for curation signal
- Permanently available on decentralized network
- Higher query fees but production-ready

## Common Pitfalls

❌ **Don't:**
- Assume entities exist - always null-check after .load()
- Use JavaScript number types - always BigInt
- Modify entities without calling .save()
- Create circular entity references without @derivedFrom
- Use external API calls (not supported in AssemblyScript handlers)

✅ **Do:**
- Validate event data before processing
- Handle reorgs gracefully (Graph handles this automatically)
- Test with historical data from mainnet
- Document decimal handling clearly
- Use descriptive entity IDs for debugging

## Testing Strategy

**Unit Tests (Matchstick):**
- Test individual event handlers with mock events
- Verify balance calculations
- Test edge cases (zero amounts, self-transfers, mint/burn)

**Integration Tests:**
- Compare subgraph data with Polygonscan
- Verify totalSupply matches contract
- Check holder count against unique addresses
- Validate historical snapshots

**Test Data Sources:**
- Use real transaction hashes from Polygonscan
- Test against known holder addresses
- Verify with contract deployment block

## Adding New Tokens

**Process (No Code Changes Needed):**

1. **Update Token Configuration** (`config/tokens.json`):
   ```json
   {
     "symbol": "NEW",
     "name": "New Token",
     "address": "0x...",
     "decimals": 18,
     "deployBlock": 12345678,
     "isProxy": false,
     "isMintable": false,
     "isPausable": false,
     "enabled": true
   }
   ```

2. **Update Token Config in Code** (`src/utils/constants.ts`):
   - Add new token case in `getTokenConfig()` function

3. **Add dataSource to subgraph.yaml**:
   ```yaml
   - kind: ethereum/contract
     name: NEW
     network: matic
     source:
       address: "0x..."  # Use proxy address for proxy contracts
       abi: ERC20
       startBlock: 12345678
     mapping:
       # Same mapping as existing tokens
       file: ./src/mappings/token.ts
   ```

4. **Rebuild and Deploy**:
   ```bash
   npm run codegen
   npm run build
   npm run deploy
   ```

**Important Notes:**
- Use proxy address (not implementation) for proxy contracts
- Historical sync starts from specified `startBlock`
- Existing token data remains intact
- All tokens share the same event handler code

## Reference Links

**Deployed Subgraph:**
- **Studio Dashboard**: https://thegraph.com/studio/subgraph/msq-tokens-subgraph
- **Query Endpoint (v0.0.1)**: https://api.studio.thegraph.com/query/1704765/msq-tokens-subgraph/v0.0.1
- **Deployment Date**: 2025-01-28
- **Current Version**: v0.0.1 (SUT token only)
- **Status**: ✅ Synced and operational

**Token Contracts:**
- **MSQ**: https://polygonscan.com/address/0x6A8Ec2d9BfBDD20A7F5A4E89D640F7E7cebA4499
- **SUT**: https://polygonscan.com/address/0x98965474EcBeC2F532F1f780ee37b0b05f77Ca55 ✅ Deployed
- **KWT**: https://polygonscan.com/address/0x435001Af7fC65B621B0043df99810B2f30860c5d
- **P2UC**: https://polygonscan.com/address/0x8B3C6ff5911392dECB5B08611822280dEe0E4f64

**Documentation:**
- **The Graph Docs**: https://thegraph.com/docs/
- **The Graph Studio**: https://thegraph.com/studio/
- **AssemblyScript Docs**: https://www.assemblyscript.org/
- **ERC-20 Standard**: https://eips.ethereum.org/EIPS/eip-20
- **ERC-1967 Proxy**: https://eips.ethereum.org/EIPS/eip-1967
- **Polygon RPC**: https://polygon-rpc.com/

## Project Requirements Reference

See `prd.md` for:
- Detailed feature requirements (P0/P1/P2 priorities)
- Success metrics (indexing lag <30s, query response <500ms)
- Implementation phases and timeline
- Risk mitigation strategies
- GraphQL query examples
