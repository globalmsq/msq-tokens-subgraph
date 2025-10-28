import { Address, BigInt } from "@graphprotocol/graph-ts";
import { DailySnapshot, HourlySnapshot, Token } from "../../generated/schema";
import { ZERO_BI, ONE_BI } from "../utils/constants";
import { generateSnapshotId, generateHourlySnapshotId } from "../utils/id-generators";
import { addressToId, getDayStartTimestamp, getHourStartTimestamp } from "../utils/helpers";

/**
 * Load or create DailySnapshot entity
 * @param tokenAddress - Token contract address
 * @param timestamp - Block timestamp
 * @returns DailySnapshot entity
 */
export function getOrCreateDailySnapshot(
  tokenAddress: Address,
  timestamp: BigInt
): DailySnapshot {
  let dayStartTimestamp = getDayStartTimestamp(timestamp);
  let id = generateSnapshotId(addressToId(tokenAddress), dayStartTimestamp);
  let snapshot = DailySnapshot.load(id);

  if (snapshot == null) {
    snapshot = new DailySnapshot(id);
    snapshot.token = addressToId(tokenAddress);
    snapshot.date = dayStartTimestamp;

    // Initialize daily metrics
    snapshot.transferCount = ZERO_BI;
    snapshot.volumeTransferred = ZERO_BI;
    snapshot.uniqueSenders = ZERO_BI;
    snapshot.uniqueReceivers = ZERO_BI;
    snapshot.uniqueAddresses = ZERO_BI;

    // Initialize holder statistics
    snapshot.newHolders = ZERO_BI;

    // Get current holder count from Token entity
    let token = Token.load(addressToId(tokenAddress));
    if (token != null) {
      snapshot.holderCount = token.holderCount;
    } else {
      snapshot.holderCount = ZERO_BI;
    }

    // Initialize mint/burn metrics
    snapshot.mintCount = ZERO_BI;
    snapshot.burnCount = ZERO_BI;
    snapshot.mintVolume = ZERO_BI;
    snapshot.burnVolume = ZERO_BI;

    snapshot.save();
  }

  return snapshot as DailySnapshot;
}

/**
 * Update DailySnapshot with transfer data
 * @param tokenAddress - Token contract address
 * @param timestamp - Block timestamp
 * @param amount - Amount transferred
 * @param isMint - Whether this is a mint operation
 * @param isBurn - Whether this is a burn operation
 */
export function updateDailySnapshot(
  tokenAddress: Address,
  timestamp: BigInt,
  amount: BigInt,
  isMint: boolean,
  isBurn: boolean
): void {
  let snapshot = getOrCreateDailySnapshot(tokenAddress, timestamp);

  // Update transfer statistics
  snapshot.transferCount = snapshot.transferCount.plus(ONE_BI);
  snapshot.volumeTransferred = snapshot.volumeTransferred.plus(amount);

  // Update mint/burn statistics
  if (isMint) {
    snapshot.mintCount = snapshot.mintCount.plus(ONE_BI);
    snapshot.mintVolume = snapshot.mintVolume.plus(amount);
  } else if (isBurn) {
    snapshot.burnCount = snapshot.burnCount.plus(ONE_BI);
    snapshot.burnVolume = snapshot.burnVolume.plus(amount);
  }

  // Update holder count from Token entity
  let token = Token.load(addressToId(tokenAddress));
  if (token != null) {
    snapshot.holderCount = token.holderCount;
  }

  snapshot.save();
}

/**
 * Load or create HourlySnapshot entity (optional feature)
 * @param tokenAddress - Token contract address
 * @param timestamp - Block timestamp
 * @returns HourlySnapshot entity
 */
export function getOrCreateHourlySnapshot(
  tokenAddress: Address,
  timestamp: BigInt
): HourlySnapshot {
  let hourStartTimestamp = getHourStartTimestamp(timestamp);
  let id = generateHourlySnapshotId(addressToId(tokenAddress), hourStartTimestamp);
  let snapshot = HourlySnapshot.load(id);

  if (snapshot == null) {
    snapshot = new HourlySnapshot(id);
    snapshot.token = addressToId(tokenAddress);
    snapshot.hour = hourStartTimestamp;

    // Initialize hourly metrics
    snapshot.transferCount = ZERO_BI;
    snapshot.volumeTransferred = ZERO_BI;
    snapshot.uniqueAddresses = ZERO_BI;
    snapshot.mintCount = ZERO_BI;
    snapshot.burnCount = ZERO_BI;

    snapshot.save();
  }

  return snapshot as HourlySnapshot;
}

/**
 * Update HourlySnapshot with transfer data (optional feature)
 * @param tokenAddress - Token contract address
 * @param timestamp - Block timestamp
 * @param amount - Amount transferred
 * @param isMint - Whether this is a mint operation
 * @param isBurn - Whether this is a burn operation
 */
export function updateHourlySnapshot(
  tokenAddress: Address,
  timestamp: BigInt,
  amount: BigInt,
  isMint: boolean,
  isBurn: boolean
): void {
  let snapshot = getOrCreateHourlySnapshot(tokenAddress, timestamp);

  snapshot.transferCount = snapshot.transferCount.plus(ONE_BI);
  snapshot.volumeTransferred = snapshot.volumeTransferred.plus(amount);

  if (isMint) {
    snapshot.mintCount = snapshot.mintCount.plus(ONE_BI);
  } else if (isBurn) {
    snapshot.burnCount = snapshot.burnCount.plus(ONE_BI);
  }

  snapshot.save();
}
