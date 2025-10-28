import { BigInt } from "@graphprotocol/graph-ts";

/**
 * Generate Token entity ID
 * @param tokenAddress - Token contract address (lowercase)
 * @returns Token entity ID
 */
export function generateTokenId(tokenAddress: string): string {
  return tokenAddress.toLowerCase();
}

/**
 * Generate TokenAccount entity ID
 * Composite: {tokenAddress}-{accountAddress}
 * @param tokenAddress - Token contract address
 * @param accountAddress - Account address
 * @returns Composite ID for TokenAccount entity
 */
export function generateAccountId(
  tokenAddress: string,
  accountAddress: string
): string {
  return `${tokenAddress.toLowerCase()}-${accountAddress.toLowerCase()}`;
}

/**
 * Generate Transfer entity ID
 * Composite: {tokenAddress}-{txHash}-{logIndex}
 * @param tokenAddress - Token contract address
 * @param txHash - Transaction hash
 * @param logIndex - Log index within transaction
 * @returns Composite ID for Transfer entity
 */
export function generateTransferId(
  tokenAddress: string,
  txHash: string,
  logIndex: BigInt
): string {
  return `${tokenAddress.toLowerCase()}-${txHash}-${logIndex.toString()}`;
}

/**
 * Generate DailySnapshot entity ID
 * Composite: {tokenAddress}-{dayTimestamp}
 * @param tokenAddress - Token contract address
 * @param dayTimestamp - Day start timestamp (rounded to midnight UTC)
 * @returns Composite ID for DailySnapshot entity
 */
export function generateSnapshotId(
  tokenAddress: string,
  dayTimestamp: BigInt
): string {
  return `${tokenAddress.toLowerCase()}-${dayTimestamp.toString()}`;
}

/**
 * Generate HourlySnapshot entity ID
 * Composite: {tokenAddress}-{hourTimestamp}
 * @param tokenAddress - Token contract address
 * @param hourTimestamp - Hour start timestamp
 * @returns Composite ID for HourlySnapshot entity
 */
export function generateHourlySnapshotId(
  tokenAddress: string,
  hourTimestamp: BigInt
): string {
  return `${tokenAddress.toLowerCase()}-${hourTimestamp.toString()}`;
}
