import type { Network } from "./types.js"
import { NETWORK_CONFIG } from "./types.js"

/**
 * Read USDC balance for `address` via a direct `eth_call` to the USDC
 * contract's `balanceOf(address)` function. No viem client needed — just
 * a plain JSON-RPC POST.
 */
export async function getUsdcBalance(address: `0x${string}`, network: Network, rpcUrl?: string): Promise<bigint> {
  const config = NETWORK_CONFIG[network]
  const url = rpcUrl ?? config.rpcUrl

  // balanceOf(address) selector = 0x70a08231
  const paddedAddress = address.slice(2).toLowerCase().padStart(64, "0")
  const data = `0x70a08231${paddedAddress}`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: config.usdcAddress, data }, "latest"],
    }),
  })

  const json = (await res.json()) as { result?: string; error?: unknown }
  if (json.error) {
    throw new Error(`RPC error: ${JSON.stringify(json.error)}`)
  }
  return BigInt(json.result ?? "0x0")
}
