# Deployment Log - MSQ Tokens Subgraph

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
