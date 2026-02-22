import { wallet } from "../wallet/index.js"
import type { ComputeRequest, ComputeResponse, PricingTier, Size } from "./types.js"

const DEFAULT_ENDPOINT = "https://x402.auteng.ai/api/x402/compute"

let _endpoint = DEFAULT_ENDPOINT

const PRICING: Record<Size, PricingTier> = {
  small: {
    vcpu: 2,
    ram_gb: 1,
    default_timeout_s: 30,
    max_timeout_s: 300,
    base_price_usd: 0.002,
    per_second_usd: 0.00005,
  },
  med: {
    vcpu: 4,
    ram_gb: 4,
    default_timeout_s: 60,
    max_timeout_s: 600,
    base_price_usd: 0.008,
    per_second_usd: 0.00012,
  },
  large: {
    vcpu: 8,
    ram_gb: 16,
    default_timeout_s: 120,
    max_timeout_s: 3600,
    base_price_usd: 0.03,
    per_second_usd: 0.00025,
  },
}

export const compute = {
  /**
   * Execute sandboxed code via AutEng's x402 compute endpoint.
   * Payment is handled automatically via the wallet's x402 layer.
   */
  async run(request: ComputeRequest): Promise<ComputeResponse> {
    if (!request.code) {
      throw new Error("compute.run: 'code' is required")
    }
    if (!request.stack) {
      throw new Error("compute.run: 'stack' is required")
    }

    const body = {
      code: request.code,
      stack: request.stack,
      size: request.size ?? "small",
      ...(request.timeout_seconds != null && {
        timeout_seconds: request.timeout_seconds,
      }),
      ...(request.files != null && { files: request.files }),
    }

    const response = await wallet.fetch(_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(`Compute request failed (${response.status}): ${text}`)
    }

    return (await response.json()) as ComputeResponse
  },

  /** Returns the pricing table for all compute sizes. */
  pricing(): Record<Size, PricingTier> {
    return { ...PRICING }
  },

  /**
   * Override the compute endpoint URL.
   * Default: https://x402.auteng.ai/api/x402/compute
   */
  setEndpoint(url: string): void {
    _endpoint = url
  },
}
