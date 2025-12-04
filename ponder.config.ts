import { createConfig } from "ponder";

import { OverTheCounterAbi } from "./abis/OverTheCounterAbi";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL!,
  },
  chains: {
    base: {
      id: 8453,
      rpc: process.env.PONDER_RPC_URL_8453!,
    },
  },
  contracts: {
    OverTheCounter: {
      chain: "base",
      abi: OverTheCounterAbi,
      address: process.env.CONTRACT_ADDRESS as `0x${string}`,
      startBlock: parseInt(process.env.START_BLOCK || "0"),
    },
  },
});
