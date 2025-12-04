import { onchainTable } from "ponder";

export const listings = onchainTable("listings", (t) => ({
  id: t.bigint().primaryKey(),
  seller: t.text().notNull(),
  token: t.text().notNull(),
  tokenAmount: t.bigint().notNull(),
  usdcPrice: t.bigint().notNull(),
  expiresAt: t.bigint().notNull(),
  isActive: t.boolean().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const listingExecutions = onchainTable("listing_executions", (t) => ({
  id: t.text().primaryKey(),
  listingId: t.bigint().notNull(),
  seller: t.text().notNull(),
  buyer: t.text().notNull(),
  token: t.text().notNull(),
  tokenAmount: t.bigint().notNull(),
  usdcPrice: t.bigint().notNull(),
  protocolFee: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const listingCancellations = onchainTable("listing_cancellations", (t) => ({
  id: t.text().primaryKey(),
  listingId: t.bigint().notNull(),
  seller: t.text().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const feeWithdrawals = onchainTable("fee_withdrawals", (t) => ({
  id: t.text().primaryKey(),
  recipient: t.text().notNull(),
  amount: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const feeRecipientUpdates = onchainTable("fee_recipient_updates", (t) => ({
  id: t.text().primaryKey(),
  oldRecipient: t.text().notNull(),
  newRecipient: t.text().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));
