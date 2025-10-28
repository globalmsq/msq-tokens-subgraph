/**
 * Shared Transfer event handler for all tokens
 * This handler works for standard ERC-20, proxy contracts, and mintable tokens
 */

import { Transfer as TransferEvent } from "../../generated/SUT/ERC20";
import { getOrCreateToken, updateTokenStats } from "../entities/token";
import {
  getOrCreateTokenAccount,
  updateAccountSent,
  updateAccountReceived,
  updateHolderCount
} from "../entities/account";
import { createTransferEntity } from "../entities/transfer";
import { updateDailySnapshot } from "../entities/snapshot";
import { isZeroAddress } from "../utils/helpers";

/**
 * Handle Transfer event from any ERC-20 token
 * Supports:
 * - Standard ERC-20 tokens
 * - Proxy contracts (ERC-1967)
 * - Mintable tokens (detects mint via from==0x0)
 * - Burnable tokens (detects burn via to==0x0)
 * - Pausable tokens (no special handling needed)
 *
 * @param event - Transfer event from token contract
 */
export function handleTransfer(event: TransferEvent): void {
  let tokenAddress = event.address;
  let from = event.params.from;
  let to = event.params.to;
  let amount = event.params.value;

  // Detect mint and burn operations
  let isMint = isZeroAddress(from);
  let isBurn = isZeroAddress(to);

  // 1. Load or create Token entity
  let token = getOrCreateToken(
    tokenAddress,
    event.block.number,
    event.block.timestamp
  );

  // 2. Handle sender (skip if mint)
  if (!isMint) {
    let fromAccount = getOrCreateTokenAccount(
      tokenAddress,
      from,
      event.block.number,
      event.block.timestamp
    );

    let previousBalance = fromAccount.balance;

    updateAccountSent(
      fromAccount,
      amount,
      event.block.number,
      event.block.timestamp
    );

    // Check if sender balance went to zero (no longer a holder)
    updateHolderCount(tokenAddress, fromAccount.balance, previousBalance);
  }

  // 3. Handle receiver (skip if burn)
  if (!isBurn) {
    let toAccount = getOrCreateTokenAccount(
      tokenAddress,
      to,
      event.block.number,
      event.block.timestamp
    );

    updateAccountReceived(
      toAccount,
      amount,
      event.block.number,
      event.block.timestamp
    );

    // Note: New holders are already counted in getOrCreateTokenAccount
  }

  // 4. Create Transfer entity
  createTransferEntity(
    tokenAddress,
    from,
    to,
    amount,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp,
    event.logIndex
  );

  // 5. Update Token statistics
  updateTokenStats(token, amount, isMint, isBurn, event.block.timestamp);

  // 6. Update DailySnapshot
  updateDailySnapshot(
    tokenAddress,
    event.block.timestamp,
    amount,
    isMint,
    isBurn
  );
}

// NOTE: When adding new tokens, no code changes are needed here.
// Simply add a new dataSource in subgraph.yaml pointing to this same handler.
