# MSQ Tokens Subgraph

A unified Graph Protocol subgraph for indexing multiple MSQ ecosystem tokens on Polygon network.

## 📊 Supported Tokens

| Token | Symbol | Type | Address |
|-------|--------|------|---------|
| MSQUARE | MSQ | Standard ERC-20 | `0x6A8Ec2d9BfBDD20A7F5A4E89D640F7E7cebA4499` |
| SUPER TRUST | SUT | ERC-20 + Pausable | `0x98965474EcBeC2F532F1f780ee37b0b05F77Ca55` |
| Korean Won Token | KWT | ERC-1967 Proxy + Mintable | `0x435001Af7fC65B621B0043df99810B2f30860c5d` |
| Point to You Coin | P2UC | ERC-1967 Proxy | `0x8B3C6ff5911392dECB5B08611822280dEe0E4f64` |

## ✨ Features

- **Multi-Token Support**: Track multiple tokens in a single unified subgraph
- **Proxy Contract Compatible**: Fully supports ERC-1967 transparent proxy tokens
- **Mint/Burn Tracking**: Automatic detection and tracking of minting and burning operations
- **Real-Time Balances**: Up-to-date holder balances for all tokens
- **Historical Data**: Complete transaction history with daily and hourly snapshots
- **Cross-Token Analytics**: Portfolio views and multi-token holder tracking
- **GraphQL API**: Efficient querying with flexible filtering and aggregations

## 🏗️ Architecture

**Design Pattern**: Single subgraph with multiple `dataSources`
- One GraphQL endpoint for all tokens
- Shared event handler for all tokens (no code duplication)
- Composite entity IDs to prevent cross-token conflicts
- Scalable architecture for easy token additions

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm or yarn
- The Graph CLI

### Installation

```bash
# Install dependencies
npm install

# Install Graph CLI globally (if not already installed)
npm install -g @graphprotocol/graph-cli
```

### Build

```bash
# Generate types from schema
npm run codegen

# Build the subgraph
npm run build
```

### Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📖 Documentation

- [CLAUDE.md](./CLAUDE.md) - Developer guide for working with this codebase
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [prd.md](./prd.md) - Original product requirements document
- [claudedocs/token-analysis.md](./claudedocs/token-analysis.md) - Token analysis and comparison

## 🔍 Example Queries

### Get SUT Token Info
```graphql
query {
  token(id: "0x98965474ecbec2f532f1f780ee37b0b05f77ca55") {
    symbol
    name
    totalSupply
    holderCount
    transferCount
  }
}
```

### Get Top Holders for a Token
```graphql
query {
  tokenAccounts(
    first: 10
    orderBy: balance
    orderDirection: desc
    where: { token: "0x98965474ecbec2f532f1f780ee37b0b05f77ca55" }
  ) {
    account
    balance
    transferCount
  }
}
```

### Get Recent Transfers
```graphql
query {
  transfers(
    first: 100
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    token {
      symbol
    }
    from
    to
    amount
    isMint
    isBurn
    blockTimestamp
  }
}
```

### Get Daily Statistics
```graphql
query {
  dailySnapshots(
    first: 30
    orderBy: date
    orderDirection: desc
    where: { token: "0x98965474ecbec2f532f1f780ee37b0b05f77ca55" }
  ) {
    date
    transferCount
    volumeTransferred
    holderCount
    mintCount
    burnCount
  }
}
```

## 🛠️ Development

### Project Structure

```
msq-tokens-subgraph/
├── config/
│   └── tokens.json           # Token configuration
├── abis/
│   └── ERC20.json            # Standard ERC-20 ABI
├── src/
│   ├── mappings/
│   │   └── token.ts          # Shared event handler
│   ├── entities/             # Entity helper functions
│   └── utils/                # Utility functions
├── schema.graphql            # GraphQL schema
├── subgraph.yaml             # Subgraph configuration
└── package.json
```

### Adding New Tokens

1. Update `config/tokens.json`
2. Update `src/utils/constants.ts`
3. Add new `dataSource` to `subgraph.yaml`
4. Rebuild and deploy

No code changes needed in handlers!

## 📊 Entity Schema

- **Token**: Global token information and statistics
- **TokenAccount**: Per-account balance for each token
- **Transfer**: Individual transfer events
- **DailySnapshot**: Daily aggregated statistics
- **HourlySnapshot**: Hourly aggregated statistics (optional)

## 🔗 Links

- [The Graph Documentation](https://thegraph.com/docs/)
- [Polygon Network](https://polygon.technology/)
- [Polygonscan](https://polygonscan.com/)

## 📝 License

This project is part of the MSQ ecosystem.

## 🤝 Contributing

This is an internal project for MSQ token tracking. For questions or issues, please contact the development team.
