import { x402Client } from "@x402/core/client"
import { registerExactEvmScheme } from "@x402/evm/exact/client"
import { toClientEvmSigner } from "@x402/evm"
import { wrapFetchWithPayment } from "@x402/fetch"
import { privateKeyToAccount } from "viem/accounts"
import { createPublicClient, http } from "viem"
import { base, baseSepolia } from "viem/chains"
import type { Network } from "../wallet/types.js"

/**
 * Create a fetch function that automatically handles x402 payments.
 * When the server returns 402, the SDK signs an EIP-3009 authorization
 * using the provided private key and retries with payment headers.
 */
export function createPaymentFetch(
  privateKey: `0x${string}`,
  network: Network = "base",
  rpcUrl?: string
): typeof globalThis.fetch {
  const account = privateKeyToAccount(privateKey)
  const chain = network === "base" ? base : baseSepolia
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  })
  const signer = toClientEvmSigner(account, publicClient)

  const client = new x402Client()
  registerExactEvmScheme(client, { signer })
  return wrapFetchWithPayment(fetch, client)
}
