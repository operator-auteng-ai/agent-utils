import { resolve } from "node:path"
import type { PrivateKeyAccount } from "viem"
import { createKeypair, loadKeypair } from "./keypair.js"
import { readWalletFile, writeWalletFile } from "./storage.js"
import { getUsdcBalance } from "./balance.js"
import { createPaymentFetch } from "../x402/index.js"
import type { Network, WalletConfig, WaitForFundingOptions } from "./types.js"

// --- Internal state ---

let _account: PrivateKeyAccount | null = null
let _privateKey: `0x${string}` | null = null
let _network: Network = "base"
let _rpcUrl: string | undefined
let _paymentFetch: typeof globalThis.fetch | null = null

function ensureCreated(): void {
  if (!_account) {
    throw new Error("Wallet not initialized. Call wallet.create() first.")
  }
}

// --- Public API ---

export const wallet = {
  /**
   * Create a new EVM wallet or load an existing one from disk.
   * Idempotent: if the wallet file already exists, loads it.
   */
  async create(opts?: WalletConfig): Promise<void> {
    const keyPath = resolve(opts?.keyPath ?? ".auteng/wallet.json")
    _network = opts?.network ?? "base"
    _rpcUrl = opts?.rpcUrl

    const existing = readWalletFile(keyPath)
    if (existing) {
      _privateKey = existing.privateKey
      const { account } = loadKeypair(existing.privateKey)
      _account = account
      _network = existing.network
    } else {
      const { privateKey, account } = createKeypair()
      _privateKey = privateKey
      _account = account
      writeWalletFile(keyPath, {
        privateKey,
        address: account.address,
        network: _network,
      })
    }

    _paymentFetch = createPaymentFetch(_privateKey!, _network, _rpcUrl)
  },

  /** The wallet's public address. Throws if not created. */
  get address(): `0x${string}` {
    ensureCreated()
    return _account!.address
  },

  /** Check USDC balance on Base. Returns balance in minor units (6 decimals). */
  async checkBalance(): Promise<bigint> {
    ensureCreated()
    return getUsdcBalance(_account!.address, _network, _rpcUrl)
  },

  /**
   * Poll until USDC balance >= minAmount.
   * @param minAmount - minimum USDC balance in minor units (6 decimals)
   */
  async waitForFunding(minAmount: bigint, opts?: WaitForFundingOptions): Promise<void> {
    ensureCreated()
    const interval = opts?.pollInterval ?? 10_000
    const deadline = opts?.timeout ? Date.now() + opts.timeout : null

    while (true) {
      const balance = await getUsdcBalance(_account!.address, _network, _rpcUrl)
      if (balance >= minAmount) return

      if (deadline && Date.now() >= deadline) {
        throw new Error(`Funding timeout: balance ${balance} < required ${minAmount}`)
      }

      await new Promise((r) => setTimeout(r, interval))
    }
  },

  /**
   * Drop-in `fetch()` replacement that handles x402 payments automatically.
   * If the server returns 402, the library signs an EIP-3009 authorization
   * and retries the request with payment headers.
   */
  async fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    ensureCreated()
    if (!_paymentFetch) {
      throw new Error("Payment layer not initialized")
    }
    return _paymentFetch(input, init)
  },
}
