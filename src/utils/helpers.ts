import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts";
import { ZERO_ADDRESS, SECONDS_PER_DAY, SECONDS_PER_HOUR } from "./constants";

/**
 * Check if an address is the zero address (mint/burn indicator)
 */
export function isZeroAddress(address: Address): boolean {
  return address.toHexString() == ZERO_ADDRESS;
}

/**
 * Convert address to lowercase hex string
 */
export function addressToId(address: Address): string {
  return address.toHexString().toLowerCase();
}

/**
 * Round timestamp down to the start of the day (UTC)
 * @param timestamp - Unix timestamp in seconds
 * @returns Timestamp rounded down to midnight UTC
 */
export function getDayStartTimestamp(timestamp: BigInt): BigInt {
  let secondsPerDay = BigInt.fromI32(SECONDS_PER_DAY);
  return timestamp.minus(timestamp.mod(secondsPerDay));
}

/**
 * Round timestamp down to the start of the hour (UTC)
 * @param timestamp - Unix timestamp in seconds
 * @returns Timestamp rounded down to hour start
 */
export function getHourStartTimestamp(timestamp: BigInt): BigInt {
  let secondsPerHour = BigInt.fromI32(SECONDS_PER_HOUR);
  return timestamp.minus(timestamp.mod(secondsPerHour));
}

/**
 * Check if an array contains a specific address
 * @param arr - Array of Bytes (addresses)
 * @param address - Address to search for
 * @returns true if address is in array, false otherwise
 */
export function arrayContainsAddress(arr: Bytes[], address: Address): boolean {
  let addressHex = address.toHexString();
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].toHexString() == addressHex) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate total unique addresses from sender and receiver arrays
 * Deduplicates addresses that appear in both arrays
 * @param senders - Array of sender addresses
 * @param receivers - Array of receiver addresses
 * @returns Count of unique addresses across both arrays
 */
export function calculateUniqueAddresses(
  senders: Bytes[],
  receivers: Bytes[]
): BigInt {
  let uniqueSet = new Set<string>();

  for (let i = 0; i < senders.length; i++) {
    uniqueSet.add(senders[i].toHexString());
  }
  for (let i = 0; i < receivers.length; i++) {
    uniqueSet.add(receivers[i].toHexString());
  }

  return BigInt.fromI32(uniqueSet.size);
}
