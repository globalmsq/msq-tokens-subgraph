# Deployment Log - MSQ Tokens Subgraph

## v0.0.3 - Multi-Token Support (2025-10-29)

**Deployment Status**: ⏳ Ready to Deploy

**Deployment Details**:
- **Version**: v0.0.3
- **Build Hash**: TBD (will be generated during deployment)
- **Deployed**: TBD
- **Studio URL**: https://thegraph.com/studio/subgraph/msq-tokens-subgraph
- **Query Endpoint**: https://api.studio.thegraph.com/query/1704765/msq-tokens-subgraph/v0.0.3

**Changes in This Version**:

### Added Tokens
1. **MSQ (MSQUARE)** - Standard ERC-20 Token
   - Address: `0x6A8Ec2d9BfBDD20A7F5A4E89D640F7E7cebA4499`
   - Start Block: 28,385,214
   - Type: Standard ERC-20
   - Features: None (basic ERC-20)

2. **KWT (Korean Won Token)** - ERC-1967 Proxy + Mintable
   - Address: `0x435001Af7fC65B621B0043df99810B2f30860c5d` (Proxy)
   - Implementation: `0x59e17bf8eecbaab7db37e8fab1d68ecaeb39f3d1`
   - Start Block: 69,407,446
   - Type: ERC-1967 Transparent Proxy
   - Features: Mintable, Burnable, Pausable, Upgradeable
   - Decimals: 6

3. **P2UC (Point to You Coin)** - ERC-1967 Proxy
   - Address: `0x8B3C6ff5911392dECB5B08611822280dEe0E4f64` (Proxy)
   - Implementation: `0xd66a87e1d13ddb2b05ec762932265cef3adb9b6c`
   - Start Block: 73,725,373
   - Type: ERC-1967 Transparent Proxy
   - Features: Upgradeable
   - Decimals: 18

### Configuration Updates
- Updated `constants.ts` with accurate deployment blocks for all tokens
- Enabled all tokens in `config/tokens.json`
- Updated SUT start block: 50,000,000 → 52,882,612 (accurate deployment block)

### Architecture Notes
- All tokens use the same shared `handleTransfer` event handler
- No code changes required - unified architecture supports all token types
- Each token indexes independently from its own start block
- Composite entity IDs prevent cross-token conflicts

**Expected Indexing Timeline**:
- MSQ: Starts from Block 28,385,214 (oldest - longest history)
- SUT: Continues from Block 52,882,612
- KWT: Starts from Block 69,407,446
- P2UC: Starts from Block 73,725,373 (newest - shortest history)

**Next Steps**:
1. Deploy to The Graph Studio: `graph deploy msq-tokens-subgraph`
2. Monitor indexing progress for all 4 tokens
3. Verify data for each token after initial sync
4. Update this log with actual Build Hash and deployment timestamp

---

## v0.0.2 - Bug Fixes (2025-10-29)

**Deployment Status**: ✅ Successfully Deployed

**Deployment Details**:
- **Version**: v0.0.2
- **Build Hash**: QmTH4RFC1MQeXAKRicAdwXPjCPfoqdcd3ZpdXdPVBMbZ5e
- **Deployed**: 2025-10-29
- **Studio URL**: https://thegraph.com/studio/subgraph/msq-tokens-subgraph
- **Query Endpoint**: https://api.studio.thegraph.com/query/1704765/msq-tokens-subgraph/v0.0.2

**Changes in This Version**:

### Bug Fixes
1. **Fixed DailySnapshot unique address tracking** (always returned 0)
   - Added `senderAddresses` and `receiverAddresses` array fields
   - Implemented array-based unique address tracking
   - Now correctly counts uniqueSenders, uniqueReceivers, uniqueAddresses

2. **Fixed Token.holderCount logic** (always returned 0)
   - Removed premature holderCount increment in account creation
   - Added missing balance 0→non-zero case in updateHolderCount()
   - Added holderCount tracking in receiver flow
   - Now correctly counts accounts with balance > 0

### Schema Changes
- Added `senderAddresses: [Bytes!]!` to DailySnapshot
- Added `receiverAddresses: [Bytes!]!` to DailySnapshot

**⚠️ Important**: This deployment requires full re-indexing from genesis block due to schema changes.

**Expected Re-sync Time**: 2-4 hours

---

## Next Steps

### 1. Monitor Re-sync Progress
Visit Studio dashboard to monitor indexing progress:
https://thegraph.com/studio/subgraph/msq-tokens-subgraph

### 2. Validation Timeline

**At 75% Sync (~1.5 hours)**:
```bash
cd validation
npm run validate:snapshots
npm run validate:metadata
```

Expected results:
- ✅ uniqueSenders, uniqueReceivers, uniqueAddresses > 0 (not 0 anymore)
- ✅ Token.holderCount > 0 (not 0 anymore)

**At 95% Sync (~3 hours)**:
```bash
npm run validate:all
```

**At 100% Sync (~4 hours)**:
```bash
npm run validate:all
```

Expected: All validations PASS

### 3. After Successful Validation
- Document validation results
- Consider publishing to Decentralized Network
- Plan next phase: Add remaining tokens (MSQ, KWT, P2UC)

---

## Previous Versions

### v0.0.1 - Initial Implementation (2025-01-28)
- Initial SUT token subgraph
- Basic transfer indexing and balance tracking
- DailySnapshot aggregations
- **Issues**:
  - uniqueSenders/uniqueReceivers/uniqueAddresses always 0
  - Token.holderCount always 0

---

## Validation Results

### Pre-Deployment Validation (v0.0.1)
- ❌ DailySnapshot unique addresses: All 0
- ❌ Token.holderCount: 0
- ✅ Token metadata: 100% accurate
- ⚠️ Account balances: Temporal mismatch (expected)

Detailed report: `validation/reports/VALIDATION_SUMMARY.md`

### Post-Deployment Validation (v0.0.2)
*Pending re-sync completion*

---

## Technical Details

**Modified Files** (5):
- `schema.graphql` - Added address tracking arrays
- `src/utils/helpers.ts` - Added array helper functions
- `src/entities/snapshot.ts` - Implemented unique tracking
- `src/entities/account.ts` - Fixed holderCount logic
- `src/mappings/token.ts` - Added from/to parameters

**Lines Changed**: +85 lines, -11 lines

**Git Commit**: 06b45a0 fix: DailySnapshot unique address tracking and holderCount logic

---

*Last Updated: 2025-10-29*
