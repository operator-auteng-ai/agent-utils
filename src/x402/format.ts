import type { FormatPriceOptions } from "./types.js"

const KNOWN_ASSETS: Record<string, { symbol: string; decimals: number; prefix: string }> = {
  // USDC on Base mainnet
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { symbol: "USDC", decimals: 6, prefix: "$" },
  // USDC on Base Sepolia
  "0x036cbd53842c5426634e7929541ec2318f3dcf7e": { symbol: "USDC", decimals: 6, prefix: "$" },
}

const NETWORK_NAMES: Record<string, string> = {
  "eip155:8453": "Base",
  "eip155:84532": "Base Sepolia",
  "base": "Base",
  "base-sepolia": "Base Sepolia",
}

/**
 * Format a raw x402 price into a human-readable string.
 *
 * Knows about common assets (USDC on Base = 6 decimals, $-prefixed)
 * and falls back to raw display for unknown assets.
 *
 * @example
 * formatPrice("2000", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "eip155:8453")
 * // → "$0.002 USDC on Base"
 */
export function formatPrice(
  amount: string,
  asset: string,
  network: string,
  options?: FormatPriceOptions,
): string {
  const known = KNOWN_ASSETS[asset.toLowerCase()]
  const networkName = NETWORK_NAMES[network]

  if (known) {
    const value = Number(amount) / 10 ** known.decimals
    const formatted = `${known.prefix}${value} ${known.symbol}`
    if (options?.short || !networkName) return formatted
    return `${formatted} on ${networkName}`
  }

  // Unknown asset — show raw
  const shortAsset = `${asset.slice(0, 6)}...${asset.slice(-4)}`
  const raw = `${amount} ${shortAsset}`
  if (options?.short || !networkName) return raw
  return `${raw} on ${networkName}`
}
