import { ponder } from "ponder:registry";
import { eq } from "ponder";
import {
  listings,
  listingExecutions,
  listingCancellations,
  feeWithdrawals,
  feeRecipientUpdates,
} from "../ponder.schema";

const sendListingToBackend = async (listingData: any) => {
  try {
    const apiKey = process.env.INDEXER_API_KEY;
    const baseUrl =
      process.env.BACKEND_API_BASE_URL || "https://poiesis.anky.app";
    if (!apiKey) {
      console.error("INDEXER_API_KEY not set - skipping listing submission");
      return;
    }

    const response = await fetch(`${baseUrl}/otc/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Indexer-Source": "ponder-otc-indexer",
      },
      body: JSON.stringify(listingData),
    });

    if (!response.ok) {
      console.error(
        "Failed to send listing to backend:",
        response.status,
        response.statusText
      );
    } else {
      console.log("Listing successfully sent to backend");
    }
  } catch (error) {
    console.error("Error sending listing to backend:", error);
  }
};

const sendExecutionToBackend = async (executionData: any) => {
  try {
    const apiKey = process.env.INDEXER_API_KEY;
    const baseUrl =
      process.env.BACKEND_API_BASE_URL || "https://poiesis.anky.app";
    if (!apiKey) {
      console.error("INDEXER_API_KEY not set - skipping execution submission");
      return;
    }

    const response = await fetch(`${baseUrl}/otc/executions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Indexer-Source": "ponder-otc-indexer",
      },
      body: JSON.stringify(executionData),
    });

    if (!response.ok) {
      console.error(
        "Failed to send execution to backend:",
        response.status,
        response.statusText
      );
    } else {
      console.log("Execution successfully sent to backend");
    }
  } catch (error) {
    console.error("Error sending execution to backend:", error);
  }
};

ponder.on("OverTheCounter:ListingCreated", async ({ event, context }) => {
  const { listingId, seller, token, tokenAmount, usdcPrice, expiresAt } = event.args;
  const { block, transaction } = event;

  await context.db.insert(listings).values({
    id: listingId,
    seller: seller.toLowerCase(),
    token: token.toLowerCase(),
    tokenAmount,
    usdcPrice,
    expiresAt,
    isActive: true,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });

  const listingData = {
    id: listingId.toString(),
    seller: seller.toLowerCase(),
    token: token.toLowerCase(),
    tokenAmount: tokenAmount.toString(),
    usdcPrice: usdcPrice.toString(),
    expiresAt: expiresAt.toString(),
    isActive: true,
    blockNumber: block.number.toString(),
    transactionHash: transaction.hash,
    timestamp: block.timestamp.toString(),
  };

  await sendListingToBackend(listingData);
});

ponder.on("OverTheCounter:ListingExecuted", async ({ event, context }) => {
  const { listingId, seller, buyer, token, tokenAmount, usdcPrice, protocolFee } = event.args;
  const { block, transaction } = event;

  const executionId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(listingExecutions).values({
    id: executionId,
    listingId,
    seller: seller.toLowerCase(),
    buyer: buyer.toLowerCase(),
    token: token.toLowerCase(),
    tokenAmount,
    usdcPrice,
    protocolFee,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });

  await context.db
    .update(listings, { id: listingId })
    .set({
      isActive: false,
    });

  const executionData = {
    id: executionId,
    listingId: listingId.toString(),
    seller: seller.toLowerCase(),
    buyer: buyer.toLowerCase(),
    token: token.toLowerCase(),
    tokenAmount: tokenAmount.toString(),
    usdcPrice: usdcPrice.toString(),
    protocolFee: protocolFee.toString(),
    blockNumber: block.number.toString(),
    transactionHash: transaction.hash,
    timestamp: block.timestamp.toString(),
  };

  await sendExecutionToBackend(executionData);
});

ponder.on("OverTheCounter:ListingCancelled", async ({ event, context }) => {
  const { listingId, seller } = event.args;
  const { block, transaction } = event;

  const cancellationId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(listingCancellations).values({
    id: cancellationId,
    listingId,
    seller: seller.toLowerCase(),
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });

  await context.db
    .update(listings, { id: listingId })
    .set({
      isActive: false,
    });
});

ponder.on("OverTheCounter:FeesWithdrawn", async ({ event, context }) => {
  const { recipient, amount } = event.args;
  const { block, transaction } = event;

  const withdrawalId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(feeWithdrawals).values({
    id: withdrawalId,
    recipient: recipient.toLowerCase(),
    amount,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("OverTheCounter:FeeRecipientUpdated", async ({ event, context }) => {
  const { oldRecipient, newRecipient } = event.args;
  const { block, transaction } = event;

  const updateId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(feeRecipientUpdates).values({
    id: updateId,
    oldRecipient: oldRecipient.toLowerCase(),
    newRecipient: newRecipient.toLowerCase(),
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});
