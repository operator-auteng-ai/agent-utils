export type Network = "base" | "base-sepolia"

export interface CreateWalletOptions {
  /** Wallet identifier. Default: "default" */
  name?: string
  /** Network to use. Default: `base` */
  network?: Network
  /** Custom RPC endpoint. Default: public Base RPC */
  rpcUrl?: string
  /** Base directory for wallet storage. Default: ".auteng/wallets" */
  walletsDir?: string
}

/** @deprecated Use CreateWalletOptions instead */
export type WalletConfig = CreateWalletOptions

export interface WalletFile {
  privateKey: `0x${string}`
  address: `0x${string}`
  network: Network
}

export interface WaitForFundingOptions {
  /** Poll interval in milliseconds. Default: 10000 (10s) */
  pollInterval?: number
  /** Timeout in milliseconds. Default: none (waits forever) */
  timeout?: number
}

export const NETWORK_CONFIG: Record<Network, { chainId: number; usdcAddress: `0x${string}`; rpcUrl: string }> = {
  base: {
    chainId: 8453,
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    rpcUrl: "https://mainnet.base.org",
  },
  "base-sepolia": {
    chainId: 84532,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    rpcUrl: "https://sepolia.base.org",
  },
}
