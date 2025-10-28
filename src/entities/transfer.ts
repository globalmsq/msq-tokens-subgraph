import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/schema";
import { generateTransferId, generateAccountId } from "../utils/id-generators";
import { addressToId, isZeroAddress } from "../utils/helpers";

/**
 * Create Transfer entity
 * @param tokenAddress - Token contract address
 * @param from - Sender address
 * @param to - Receiver address
 * @param amount - Amount transferred
 * @param txHash - Transaction hash
 * @param blockNumber - Block number
 * @param blockTimestamp - Block timestamp
 * @param logIndex - Log index within transaction
 * @returns Transfer entity
 */
export function createTransferEntity(
  tokenAddress: Address,
  from: Address,
  to: Address,
  amount: BigInt,
  txHash: Bytes,
  blockNumber: BigInt,
  blockTimestamp: BigInt,
  logIndex: BigInt
): Transfer {
  let id = generateTransferId(
    addressToId(tokenAddress),
    txHash.toHexString(),
    logIndex
  );

  let transfer = new Transfer(id);
  transfer.token = addressToId(tokenAddress);

  // Transfer participants
  transfer.from = from;
  transfer.to = to;
  transfer.amount = amount;

  // Determine if this is a mint or burn
  let isMint = isZeroAddress(from);
  let isBurn = isZeroAddress(to);

  transfer.isMint = isMint;
  transfer.isBurn = isBurn;

  // Link to TokenAccount entities (null for mint/burn)
  if (!isMint) {
    transfer.fromAccount = generateAccountId(
      addressToId(tokenAddress),
      addressToId(from)
    );
  }

  if (!isBurn) {
    transfer.toAccount = generateAccountId(
      addressToId(tokenAddress),
      addressToId(to)
    );
  }

  // Transaction metadata
  transfer.transactionHash = txHash;
  transfer.blockNumber = blockNumber;
  transfer.blockTimestamp = blockTimestamp;
  transfer.logIndex = logIndex;

  transfer.save();

  return transfer;
}
