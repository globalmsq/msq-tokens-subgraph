import { BigInt, Bytes, ByteArray, crypto } from "@graphprotocol/graph-ts";

/**
 * Generate Token entity ID
 * For Token entities, the ID is simply the contract address in Bytes format
 * @param tokenAddress - Token contract address (Bytes)
 * @returns Token entity ID (Bytes)
 */
export function generateTokenId(tokenAddress: Bytes): Bytes {
  return tokenAddress;
}

/**
 * Generate TokenAccount entity ID
 * Composite: tokenAddress.concat(accountAddress)
 * @param tokenAddress - Token contract address (Bytes)
 * @param accountAddress - Account address (Bytes)
 * @returns Composite ID for TokenAccount entity (Bytes)
 */
export function generateAccountId(
  tokenAddress: Bytes,
  accountAddress: Bytes
): Bytes {
  return tokenAddress.concat(accountAddress);
}

/**
 * Generate Transfer entity ID
 * Composite: txHash.concatI32(logIndex)
 * Using concatI32 for efficient log index appending
 * @param txHash - Transaction hash (Bytes)
 * @param logIndex - Log index within transaction (BigInt)
 * @returns Composite ID for Transfer entity (Bytes)
 */
export function generateTransferId(
  txHash: Bytes,
  logIndex: BigInt
): Bytes {
  return txHash.concatI32(logIndex.toI32());
}

/**
 * Helper function to convert BigInt timestamp to Bytes
 * Pads to 8 bytes (64-bit) for consistent length
 * @param timestamp - Timestamp as BigInt
 * @returns Timestamp as Bytes (8 bytes)
 */
function bigIntToBytes(timestamp: BigInt): Bytes {
  // Convert BigInt to hex string (without 0x prefix)
  let hex = timestamp.toHexString().slice(2);

  // Pad to 16 hex chars (8 bytes)
  while (hex.length < 16) {
    hex = "0" + hex;
  }

  return Bytes.fromHexString("0x" + hex);
}

/**
 * Generate DailySnapshot entity ID
 * Composite: tokenAddress.concat(timestampBytes)
 * @param tokenAddress - Token contract address (Bytes)
 * @param dayTimestamp - Day start timestamp (BigInt, rounded to midnight UTC)
 * @returns Composite ID for DailySnapshot entity (Bytes)
 */
export function generateSnapshotId(
  tokenAddress: Bytes,
  dayTimestamp: BigInt
): Bytes {
  return tokenAddress.concat(bigIntToBytes(dayTimestamp));
}

/**
 * Generate HourlySnapshot entity ID
 * Composite: tokenAddress.concat(timestampBytes)
 * @param tokenAddress - Token contract address (Bytes)
 * @param hourTimestamp - Hour start timestamp (BigInt)
 * @returns Composite ID for HourlySnapshot entity (Bytes)
 */
export function generateHourlySnapshotId(
  tokenAddress: Bytes,
  hourTimestamp: BigInt
): Bytes {
  return tokenAddress.concat(bigIntToBytes(hourTimestamp));
}
