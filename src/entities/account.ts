import { Address, BigInt } from "@graphprotocol/graph-ts";
import { TokenAccount, Token } from "../../generated/schema";
import { ZERO_BI, ONE_BI } from "../utils/constants";
import { generateAccountId, generateTokenId } from "../utils/id-generators";
import { updateUniqueTokenCount, getOrCreateAccountStats } from "./accountStats";

/**
 * Load or create TokenAccount entity
 * @param tokenAddress - Token contract address
 * @param accountAddress - Account address
 * @param block - Block number for initialization
 * @param timestamp - Block timestamp for initialization
 * @returns TokenAccount entity
 */
export function getOrCreateTokenAccount(
  tokenAddress: Address,
  accountAddress: Address,
  block: BigInt,
  timestamp: BigInt
): TokenAccount {
  let id = generateAccountId(tokenAddress, accountAddress);
  let tokenAccount = TokenAccount.load(id);

  if (tokenAccount == null) {
    tokenAccount = new TokenAccount(id);
    tokenAccount.token = generateTokenId(tokenAddress);
    tokenAccount.account = accountAddress;
    tokenAccount.balance = ZERO_BI;

    // Initialize activity statistics
    tokenAccount.transferCount = ZERO_BI;
    tokenAccount.sentCount = ZERO_BI;
    tokenAccount.receivedCount = ZERO_BI;

    // Initialize temporal tracking
    tokenAccount.firstTransferBlock = block;
    tokenAccount.firstTransferTimestamp = timestamp;
    tokenAccount.lastTransferBlock = block;
    tokenAccount.lastTransferTimestamp = timestamp;

    // Link to AccountStats for cross-token analytics
    let accountStats = getOrCreateAccountStats(accountAddress, timestamp);
    tokenAccount.accountStats = accountStats.id;

    tokenAccount.save();

    // Update cross-token AccountStats - increment unique token count
    updateUniqueTokenCount(accountAddress, timestamp);

    // Note: holderCount will be updated in updateHolderCount() when balance becomes > 0
  }

  return tokenAccount as TokenAccount;
}

/**
 * Update TokenAccount after sending tokens
 * @param account - TokenAccount entity
 * @param amount - Amount sent
 * @param block - Block number
 * @param timestamp - Block timestamp
 */
export function updateAccountSent(
  account: TokenAccount,
  amount: BigInt,
  block: BigInt,
  timestamp: BigInt
): void {
  account.balance = account.balance.minus(amount);
  account.sentCount = account.sentCount.plus(ONE_BI);
  account.transferCount = account.transferCount.plus(ONE_BI);
  account.lastTransferBlock = block;
  account.lastTransferTimestamp = timestamp;
  account.save();
}

/**
 * Update TokenAccount after receiving tokens
 * @param account - TokenAccount entity
 * @param amount - Amount received
 * @param block - Block number
 * @param timestamp - Block timestamp
 */
export function updateAccountReceived(
  account: TokenAccount,
  amount: BigInt,
  block: BigInt,
  timestamp: BigInt
): void {
  account.balance = account.balance.plus(amount);
  account.receivedCount = account.receivedCount.plus(ONE_BI);
  account.transferCount = account.transferCount.plus(ONE_BI);
  account.lastTransferBlock = block;
  account.lastTransferTimestamp = timestamp;
  account.save();
}

/**
 * Check if account balance is zero and update holder count accordingly
 * Call this after updating balances
 * @param tokenAddress - Token contract address
 * @param accountBalance - Current account balance
 * @param previousBalance - Previous account balance
 */
export function updateHolderCount(
  tokenAddress: Address,
  accountBalance: BigInt,
  previousBalance: BigInt
): void {
  let token = Token.load(generateTokenId(tokenAddress));
  if (token == null) {
    return;
  }

  // Account went from non-zero to zero (no longer a holder)
  if (previousBalance.gt(ZERO_BI) && accountBalance.equals(ZERO_BI)) {
    token.holderCount = token.holderCount.minus(ONE_BI);
    token.save();
  }

  // Account went from zero to non-zero (new holder)
  else if (previousBalance.equals(ZERO_BI) && accountBalance.gt(ZERO_BI)) {
    token.holderCount = token.holderCount.plus(ONE_BI);
    token.save();
  }
}
