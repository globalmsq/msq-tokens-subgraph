import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { getTokenConfig } from "../utils/constants";
import { ZERO_BI } from "../utils/constants";
import { generateTokenId } from "../utils/id-generators";

/**
 * Load or create Token entity
 * @param address - Token contract address
 * @param block - Block number for initialization
 * @param timestamp - Block timestamp for initialization
 * @returns Token entity
 */
export function getOrCreateToken(
  address: Address,
  block: BigInt,
  timestamp: BigInt
): Token {
  let id = generateTokenId(address);
  let token = Token.load(id);

  if (token == null) {
    // Load token configuration
    let config = getTokenConfig(address.toHexString());

    token = new Token(id);
    token.address = address;
    token.symbol = config.symbol;
    token.name = config.name;
    token.decimals = config.decimals;

    // Token characteristics
    token.isProxy = config.isProxy;
    token.isMintable = config.isMintable;
    token.isPausable = config.isPausable;

    if (config.implementationAddress) {
      token.implementationAddress = Bytes.fromHexString(
        config.implementationAddress!
      ) as Bytes;
    }

    // Initialize statistics
    token.totalSupply = ZERO_BI;
    token.transferCount = ZERO_BI;
    token.holderCount = ZERO_BI;
    token.totalVolumeTransferred = ZERO_BI;
    token.mintCount = ZERO_BI;
    token.burnCount = ZERO_BI;

    // Initialize temporal data
    token.deployBlock = block;
    token.firstTransferTimestamp = timestamp;
    token.lastTransferTimestamp = timestamp;

    token.save();
  }

  return token as Token;
}

/**
 * Update Token statistics after a transfer
 * @param token - Token entity to update
 * @param amount - Amount transferred
 * @param isMint - Whether this is a mint operation
 * @param isBurn - Whether this is a burn operation
 * @param timestamp - Block timestamp
 */
export function updateTokenStats(
  token: Token,
  amount: BigInt,
  isMint: boolean,
  isBurn: boolean,
  timestamp: BigInt
): void {
  // Increment transfer count
  token.transferCount = token.transferCount.plus(BigInt.fromI32(1));

  // Update volume
  token.totalVolumeTransferred = token.totalVolumeTransferred.plus(amount);

  // Update supply
  if (isMint) {
    token.totalSupply = token.totalSupply.plus(amount);
    token.mintCount = token.mintCount.plus(BigInt.fromI32(1));
  } else if (isBurn) {
    token.totalSupply = token.totalSupply.minus(amount);
    token.burnCount = token.burnCount.plus(BigInt.fromI32(1));
  }

  // Update last transfer timestamp
  token.lastTransferTimestamp = timestamp;

  token.save();
}
