#!/bin/bash

# Generate subgraph.yaml from config/tokens.json
# This script reads tokens.json and creates dataSource entries for enabled tokens

echo "Generating subgraph.yaml from config/tokens.json..."

# NOTE: This is a simple shell script.
# For production, consider using a more robust solution (Node.js script with JSON parsing)

cat > subgraph.yaml <<'EOF'
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
EOF

# IMPORTANT: This script currently only generates SUT token configuration.
# TODO: Implement JSON parsing to automatically generate all enabled tokens from config/tokens.json
# WORKAROUND: For now, manually edit subgraph.yaml to add additional tokens (MSQ, KWT, P2UC)

# Add SUT (enabled by default)
cat >> subgraph.yaml <<'EOF'
  - kind: ethereum/contract
    name: SUT
    network: matic
    source:
      address: "0x98965474EcBeC2F532F1f780ee37b0b05f77Ca55"
      abi: ERC20
      startBlock: 50000000
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Token
        - TokenAccount
        - Transfer
        - DailySnapshot
        - HourlySnapshot
      abis:
        - name: ERC20
          file: ./abis/ERC20.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTransfer
      file: ./src/mappings/token.ts
EOF

echo "subgraph.yaml generated successfully!"
echo ""
echo "To add more tokens, edit config/tokens.json (set enabled: true)"
echo "Then run this script again, or manually add dataSource entries to subgraph.yaml"
