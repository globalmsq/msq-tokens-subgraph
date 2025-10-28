import { BigInt } from "@graphprotocol/graph-ts";

// Common constants
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const SECONDS_PER_DAY = 86400;
export const SECONDS_PER_HOUR = 3600;

// BigInt constants for convenience
export const ZERO_BI = BigInt.fromI32(0);
export const ONE_BI = BigInt.fromI32(1);

// Token configuration
// NOTE: In a production setup, this would be loaded from config/tokens.json
// For AssemblyScript, we define token metadata statically
export class TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: i32;
  deployBlock: i32;
  isProxy: boolean;
  implementationAddress: string | null;
  isMintable: boolean;
  isPausable: boolean;

  constructor(
    symbol: string,
    name: string,
    address: string,
    decimals: i32,
    deployBlock: i32,
    isProxy: boolean,
    isMintable: boolean,
    isPausable: boolean,
    implementationAddress: string | null = null
  ) {
    this.symbol = symbol;
    this.name = name;
    this.address = address.toLowerCase();
    this.decimals = decimals;
    this.deployBlock = deployBlock;
    this.isProxy = isProxy;
    this.implementationAddress = implementationAddress;
    this.isMintable = isMintable;
    this.isPausable = isPausable;
  }
}

// Token configurations
// NOTE: Update this when adding new tokens
export function getTokenConfig(address: string): TokenConfig {
  let addr = address.toLowerCase();

  // MSQ
  if (addr == "0x6a8ec2d9bfbdd20a7f5a4e89d640f7e7ceba4499") {
    return new TokenConfig(
      "MSQ",
      "MSQUARE",
      addr,
      18,
      0,
      false,
      false,
      false
    );
  }

  // SUT
  if (addr == "0x98965474ecbec2f532f1f780ee37b0b05f77ca55") {
    return new TokenConfig(
      "SUT",
      "SUPER TRUST",
      addr,
      18,
      50000000,
      false,
      false,
      true
    );
  }

  // KWT (Proxy + Mintable)
  if (addr == "0x435001af7fc65b621b0043df99810b2f30860c5d") {
    return new TokenConfig(
      "KWT",
      "Korean Won Token",
      addr,
      6,
      0,
      true,
      true,
      true,
      "0x59e17bf8eecbaab7db37e8fab1d68ecaeb39f3d1"
    );
  }

  // P2UC (Proxy)
  if (addr == "0x8b3c6ff5911392decb5b08611822280dee0e4f64") {
    return new TokenConfig(
      "P2UC",
      "Point to You Coin",
      addr,
      18,
      0,
      true,
      false,
      false,
      "0xd66a87e1d13ddb2b05ec762932265cef3adb9b6c"
    );
  }

  // Default/Unknown token
  return new TokenConfig(
    "UNKNOWN",
    "Unknown Token",
    addr,
    18,
    0,
    false,
    false,
    false
  );
}
