import { Address, BigInt } from "@graphprotocol/graph-ts";
import { AccountStats, TokenAccount } from "../../generated/schema";
import { ZERO_BI, ONE_BI } from "../utils/constants";

// 30 days in seconds (30 * 24 * 60 * 60)
const THIRTY_DAYS_SECONDS = BigInt.fromI32(2592000);

/**
 * Load or create AccountStats entity for cross-token statistics
 * @param accountAddress - Account address
 * @param timestamp - Current block timestamp for initialization
 * @returns AccountStats entity
 */
export function getOrCreateAccountStats(
  accountAddress: Address,
  timestamp: BigInt
): AccountStats {
  let id = accountAddress;
  let stats = AccountStats.load(id);

  if (stats == null) {
    stats = new AccountStats(id);
    stats.account = accountAddress;

    // Initialize aggregate counts
    stats.totalTransferCount = ZERO_BI;
    stats.totalSentCount = ZERO_BI;
    stats.totalReceivedCount = ZERO_BI;
    stats.totalVolumeTransferred = ZERO_BI;

    // Initialize temporal tracking
    stats.firstTransactionTimestamp = timestamp;
    stats.lastTransactionTimestamp = timestamp;

    // Initialize activity analysis
    stats.isActive = true; // New accounts are active by definition
    stats.uniqueTokenCount = ZERO_BI;

    stats.save();
  }

  return stats as AccountStats;
}

/**
 * Update AccountStats after sending tokens
 * @param accountAddress - Account address
 * @param amount - Amount sent (raw value, not decimals-adjusted)
 * @param timestamp - Current block timestamp
 */
export function updateAccountStatsSent(
  accountAddress: Address,
  amount: BigInt,
  timestamp: BigInt
): void {
  let stats = getOrCreateAccountStats(accountAddress, timestamp);

  stats.totalTransferCount = stats.totalTransferCount.plus(ONE_BI);
  stats.totalSentCount = stats.totalSentCount.plus(ONE_BI);
  stats.totalVolumeTransferred = stats.totalVolumeTransferred.plus(amount);
  stats.lastTransactionTimestamp = timestamp;

  // Update isActive status
  stats.isActive = calculateIsActive(timestamp, stats.lastTransactionTimestamp);

  stats.save();
}

/**
 * Update AccountStats after receiving tokens
 * @param accountAddress - Account address
 * @param amount - Amount received (raw value, not decimals-adjusted)
 * @param timestamp - Current block timestamp
 */
export function updateAccountStatsReceived(
  accountAddress: Address,
  amount: BigInt,
  timestamp: BigInt
): void {
  let stats = getOrCreateAccountStats(accountAddress, timestamp);

  stats.totalTransferCount = stats.totalTransferCount.plus(ONE_BI);
  stats.totalReceivedCount = stats.totalReceivedCount.plus(ONE_BI);
  stats.totalVolumeTransferred = stats.totalVolumeTransferred.plus(amount);
  stats.lastTransactionTimestamp = timestamp;

  // Update isActive status
  stats.isActive = calculateIsActive(timestamp, stats.lastTransactionTimestamp);

  stats.save();
}

/**
 * Calculate if account is active (transacted within last 30 days)
 * @param currentTimestamp - Current block timestamp
 * @param lastTransactionTimestamp - Last transaction timestamp
 * @returns true if account is active, false otherwise
 */
export function calculateIsActive(
  currentTimestamp: BigInt,
  lastTransactionTimestamp: BigInt
): boolean {
  let timeDifference = currentTimestamp.minus(lastTransactionTimestamp);
  return timeDifference.le(THIRTY_DAYS_SECONDS);
}

/**
 * Update unique token count for an account
 * This should be called after a new TokenAccount entity is created
 * @param accountAddress - Account address
 * @param timestamp - Current block timestamp
 */
export function updateUniqueTokenCount(
  accountAddress: Address,
  timestamp: BigInt
): void {
  let stats = getOrCreateAccountStats(accountAddress, timestamp);

  // Count unique tokens by querying TokenAccount entities
  // Note: In AssemblyScript, we increment on each new TokenAccount creation
  stats.uniqueTokenCount = stats.uniqueTokenCount.plus(ONE_BI);

  stats.save();
}
