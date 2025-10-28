# Token Analysis

Detailed analysis of all MSQ ecosystem tokens tracked by this subgraph.

## Token Comparison Matrix

| Feature | MSQ | SUT | KWT | P2UC |
|---------|-----|-----|-----|------|
| **Type** | Standard ERC-20 | ERC-20 + Pausable | Proxy + Mintable | Proxy |
| **Proxy Pattern** | No | No | ERC-1967 | ERC-1967 |
| **Mintable** | No | No | Yes (owner) | No |
| **Burnable** | No | No | Yes (holder) | No |
| **Pausable** | No | Yes (owner) | Yes (owner) | No |
| **Upgradeable** | No | No | Yes (UUPS) | Yes (Transparent) |
| **Decimals** | 18 | 18 | 6 | 18 |
| **Address** | 0x6A8E...4499 | 0x9896...Ca55 | 0x4350...0c5d | 0x8B3C...4f64 |

## Detailed Token Analysis

### MSQ (MSQUARE)

**Contract**: `0x6A8Ec2d9BfBDD20A7F5A4E89D640F7E7cebA4499`

**Type**: Standard ERC-20

**Description**:
- Pure ERC-20 implementation without additional features
- Compiled with Solidity v0.5.2
- Inherits from OpenZeppelin's ERC20 and ERC20Detailed
- Fixed supply (no minting or burning)
- Total Supply: 25,916,431 MSQ
- Deployed ~3 years 255 days ago

**Special Considerations**:
- Simplest token in the ecosystem
- No proxy, no special features
- Straightforward tracking with standard Transfer events

**Subgraph Handling**:
- Uses standard Transfer event handler
- No special case handling needed
- Tracks all transfers from deployment block

---

### SUT (SUPER TRUST)

**Contract**: `0x98965474EcBeC2F532F1f780ee37b0b05F77Ca55`

**Type**: ERC-20 with Pausable functionality

**Description**:
- Inherits from OpenZeppelin's ERC20, ERC20Pausable, and Ownable
- Owner can pause/unpause all token transfers
- Initial supply: 238,403,732 SUT minted to deployer
- All tokens minted at deployment (no future minting)

**Key Features**:
- `pause()` - Owner can freeze all transfers
- `unpause()` - Owner can resume transfers
- Emergency stop mechanism for security

**Special Considerations**:
- When paused, Transfer events stop being emitted
- Subgraph automatically pauses indexing during pause period
- No special handling needed - just no events during pause

**Subgraph Handling**:
- Uses standard Transfer event handler
- Pause state doesn't require special logic
- Historical data includes pre-pause and post-pause periods

---

### KWT (Korean Won Token)

**Contract**: `0x435001Af7fC65B621B0043df99810B2f30860c5d` (Proxy)
**Implementation**: `0x59e17bf8eecbaab7db37e8fab1d68ecaeb39f3d1`

**Type**: ERC-1967 Transparent Proxy + Mintable + Burnable + Pausable

**Description**:
- Most complex token in the ecosystem
- Upgradeable via UUPS pattern
- Owner-controlled minting capability
- Token holder burning capability
- Pausable transfers
- 6 decimals (unlike others with 18)
- Initial supply: 100,000,000,000 KWT

**Key Features**:
- `mint(address to, uint256 amount)` - Owner only
- `burn(uint256 value)` - Any holder
- `pause()` / `unpause()` - Owner only
- Upgradeable implementation

**Special Considerations**:
- **Proxy address** must be used in subgraph.yaml, NOT implementation
- Mint events appear as Transfer(from=0x0)
- Burn events appear as Transfer(to=0x0)
- 6 decimals requires careful display formatting

**Subgraph Handling**:
- Tracks proxy address: `0x435001Af7fC65B621B0043df99810B2f30860c5d`
- Automatic mint/burn detection via zero address
- Implementation address stored in Token entity for reference
- `isMint` and `isBurn` flags in Transfer entity
- `mintCount`, `burnCount` tracked in Token entity

**Implementation History**:
- Previous implementation: `0x8ec17bf427556c3972540aac01adb6367e32d5d3`
- Current implementation: `0x59e17bf8eecbaab7db37e8fab1d68ecaeb39f3d1`
- Upgrades don't affect subgraph operation

---

### P2UC (Point to You Coin)

**Contract**: `0x8B3C6ff5911392dECB5B08611822280dEe0E4f64` (Proxy)
**Implementation**: `0xd66a87e1d13ddb2b05ec762932265cef3adb9b6c`

**Type**: ERC-1967 Transparent Proxy

**Description**:
- Upgradeable proxy pattern
- Standard ERC-20 functionality
- No minting or burning
- No pause functionality
- Deployed 111 days ago

**Key Features**:
- Transparent proxy pattern (OpenZeppelin)
- ProxyAdmin for upgrade management
- Future upgradability

**Special Considerations**:
- Use proxy address in subgraph.yaml
- Implementation may be upgraded in future
- Standard ERC-20 events from proxy

**Subgraph Handling**:
- Tracks proxy address: `0x8B3C6ff5911392dECB5B08611822280dEe0E4f64`
- Standard Transfer event handler
- Implementation address stored for reference
- No special mint/burn handling (not mintable)

---

## Proxy Pattern Deep Dive

### How Proxies Work

**Transparent Proxy Pattern (ERC-1967):**
1. User interacts with proxy address
2. Proxy delegates calls to implementation
3. Events emitted by proxy (with proxy address)
4. Implementation can be upgraded without changing proxy address

**Why It Matters for Subgraphs:**
- Always index the **proxy address**, NOT implementation
- Transfer events have proxy as `event.address`
- Implementation upgrades don't break subgraph
- Same event signatures maintained across upgrades

### Implementation Upgrades

**When Implementation Changes:**
- Proxy address remains the same
- Subgraph continues indexing without interruption
- No redeployment needed
- Historical data preserved

**What We Track:**
- Current implementation address in Token entity
- Useful for debugging and transparency
- Doesn't affect event processing

---

## Mint/Burn Detection

### How It Works

**Mint Detection:**
```
Transfer event where from == 0x0000...0000
```

**Burn Detection:**
```
Transfer event where to == 0x0000...0000
```

### Tracked Data

For each mint/burn:
- Transfer entity with `isMint` or `isBurn` flag
- Token.totalSupply adjusted
- Token.mintCount or Token.burnCount incremented
- DailySnapshot.mintCount/burnCount/volume updated

### Only KWT is Mintable

- MSQ: Fixed supply, no minting
- SUT: Fixed supply (minted at deployment only)
- **KWT**: Active minting by owner
- P2UC: No minting capability

---

## Decimals Handling

### Standard (18 decimals): MSQ, SUT, P2UC

**Display Formula:**
```
displayValue = rawValue / 10^18
```

**Example:**
```
rawValue = 1000000000000000000
displayValue = 1.0 token
```

### KWT (6 decimals)

**Display Formula:**
```
displayValue = rawValue / 10^6
```

**Example:**
```
rawValue = 1000000
displayValue = 1.0 KWT
```

**Subgraph Storage:**
- All amounts stored as raw BigInt
- Decimals stored in Token entity
- Frontend/client responsible for display formatting

---

## Query Examples by Token

### Get All Tokens Overview
```graphql
{
  tokens {
    symbol
    name
    decimals
    isProxy
    isMintable
    isPausable
    totalSupply
    holderCount
    transferCount
  }
}
```

### KWT Minting Activity
```graphql
{
  transfers(
    where: {
      token: "0x435001af7fc65b621b0043df99810b2f30860c5d"
      isMint: true
    }
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    to
    amount
    blockTimestamp
    transactionHash
  }
}
```

### SUT Pause History

Note: Cannot directly query pause events (not emitted by ERC-20).
Look for gaps in transfer activity:

```graphql
{
  dailySnapshots(
    where: {
      token: "0x98965474ecbec2f532f1f780ee37b0b05f77ca55"
    }
    orderBy: date
  ) {
    date
    transferCount
  }
}
```

### Cross-Token Portfolio
```graphql
{
  tokenAccounts(
    where: {
      account: "0x..." # Specific address
    }
  ) {
    token {
      symbol
    }
    balance
    transferCount
  }
}
```

---

## Performance Considerations

### Indexing Speed by Token

**Factors:**
- Historical transaction volume
- Start block distance from current
- Proxy complexity (minimal impact)

**Expected Sync Times:**
- MSQ: Fast (lower tx volume)
- SUT: Medium (from block 50M)
- KWT: Medium (active minting)
- P2UC: Fast (newest, fewer txs)

### Query Performance

**Efficient Queries:**
- Filter by token address first
- Use indexed fields (id, blockNumber, blockTimestamp)
- Limit results with `first` parameter

**Avoid:**
- Large result sets without pagination
- Deep nested queries
- Unfiltered cross-token queries

---

## Security Notes

### Proxy Risks

**Upgrade Risk:**
- Implementation can be changed by admin
- Could introduce malicious code
- Subgraph continues tracking regardless

**Mitigation:**
- Monitor implementation address changes
- Verify new implementations before upgrade
- Track historical implementation addresses

### Pausable Risks

**SUT and KWT:**
- Owner can freeze transfers
- Emergency stop for security incidents
- Temporary impact on subgraph activity

---

## Future Expansion

### Adding New Tokens

When adding more tokens:
1. Determine token characteristics (proxy, mintable, etc.)
2. Update token configuration
3. Add to subgraph.yaml with correct address
4. Rebuild and deploy

**Supported Types:**
- Standard ERC-20 ✅
- ERC-1967 Proxy ✅
- UUPS Proxy ✅
- Mintable ✅
- Burnable ✅
- Pausable ✅

### Planned Features

- Portfolio aggregation entity
- Price oracle integration
- Cross-token transfer analytics
- Holder overlap analysis
