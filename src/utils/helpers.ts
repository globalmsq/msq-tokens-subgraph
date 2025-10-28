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
