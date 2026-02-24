// ─── Network ─────────────────────────────────────────────────

export type Network = "base" | "base-sepolia"

// ─── Shared ──────────────────────────────────────────────────

/** A single accepted payment option from a 402 response. */
export interface PaymentOption {
  scheme: string
  network: string
  asset: string
  /** Raw amount in minor units (e.g. "2000" = $0.002 USDC). */
  amount: string
  payTo: string
  maxTimeoutSeconds: number
  extra?: Record<string, unknown>
}

/** Normalized 402 response (works across v1 and v2). */
export interface PaymentRequiredResponse {
  x402Version: number
  resource: {
    url: string
    description?: string
    mimeType?: string
  }
  accepts: PaymentOption[]
  extensions?: Record<string, unknown>
}

// ─── Probe ───────────────────────────────────────────────────

/** Result of probing a URL for x402 payment requirements. */
export interface ProbeResult {
  /** Whether the URL returned 402 Payment Required. */
  enabled: boolean
  /** The URL that was probed. */
  url: string
  /** HTTP status code returned. */
  status: number
  /** Human-readable price summary, e.g. "$0.002 USDC on Base". Null if not x402. */
  price: string | null
  /** The parsed 402 response body. Null if not x402. */
  paymentRequired: PaymentRequiredResponse | null
}

export interface ProbeOptions {
  /** HTTP method to use. Default: "GET". */
  method?: string
  /** Request headers to include. */
  headers?: Record<string, string>
  /** Request body (for POST endpoints). */
  body?: string
  /** Abort signal for timeout control. */
  signal?: AbortSignal
}

// ─── Discover ────────────────────────────────────────────────

/** A service listed in the Bazaar registry. */
export interface BazaarService {
  /** The service endpoint URL. */
  url: string
  /** Service description. */
  description: string | null
  /** Human-readable price of the cheapest accept option. */
  price: string
  /** All accepted payment options. */
  accepts: PaymentOption[]
  /** Raw metadata from the Bazaar. */
  metadata: Record<string, unknown>
}

export interface DiscoverResult {
  services: BazaarService[]
  total: number
}

export interface DiscoverOptions {
  /** Max results to return. Default: 20. */
  limit?: number
  /** Pagination offset. Default: 0. */
  offset?: number
  /** Bazaar API base URL. Override for testing. */
  bazaarUrl?: string
  /** Abort signal for timeout control. */
  signal?: AbortSignal
}

// ─── Format ──────────────────────────────────────────────────

export interface FormatPriceOptions {
  /** If true, omit the network suffix (e.g. "$0.002 USDC" instead of "$0.002 USDC on Base"). */
  short?: boolean
}
