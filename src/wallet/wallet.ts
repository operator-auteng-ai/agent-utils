import type { PrivateKeyAccount } from "viem"
import { getUsdcBalance } from "./balance.js"
import type { Network, WaitForFundingOptions } from "./types.js"

export class Wallet {
  readonly name: string
  readonly address: `0x${string}`
  readonly network: Network

  private _account: PrivateKeyAccount
  private _privateKey: `0x${string}`
  private _rpcUrl: string | undefined
  private _paymentFetch: typeof globalThis.fetch

  constructor(params: {
    name: string
    account: PrivateKeyAccount
    privateKey: `0x${string}`
    network: Network
    rpcUrl?: string
    paymentFetch: typeof globalThis.fetch
  }) {
    this.name = params.name
    this._account = params.account
    this._privateKey = params.privateKey
    this.address = params.account.address
    this.network = params.network
    this._rpcUrl = params.rpcUrl
    this._paymentFetch = params.paymentFetch
  }

  /** Check USDC balance on Base. Returns balance in minor units (6 decimals). */
  async checkBalance(): Promise<bigint> {
    return getUsdcBalance(this._account.address, this.network, this._rpcUrl)
  }

  /**
   * Poll until USDC balance >= minAmount.
   * @param minAmount - minimum USDC balance in minor units (6 decimals)
   */
  async waitForFunding(minAmount: bigint, opts?: WaitForFundingOptions): Promise<void> {
    const interval = opts?.pollInterval ?? 10_000
    const deadline = opts?.timeout ? Date.now() + opts.timeout : null

    while (true) {
      const balance = await getUsdcBalance(this._account.address, this.network, this._rpcUrl)
      if (balance >= minAmount) return

      if (deadline && Date.now() >= deadline) {
        throw new Error(`Funding timeout: balance ${balance} < required ${minAmount}`)
      }

      await new Promise((r) => setTimeout(r, interval))
    }
  }

  /**
   * Drop-in `fetch()` replacement that handles x402 payments automatically.
   * If the server returns 402, the library signs an EIP-3009 authorization
   * and retries the request with payment headers.
   */
  async fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    return this._paymentFetch(input, init)
  }
}
