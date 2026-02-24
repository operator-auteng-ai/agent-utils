export type Stack = "python" | "node"
export type Size = "small" | "med" | "large"

/** Any object with a fetch method — pocket-money Wallet, custom wrapper, etc. */
export interface ComputeWallet {
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>
}

export interface ComputeRequest {
  /** The code to execute */
  code: string
  /** Runtime stack: 'python' (3.14) or 'node' (24 LTS) */
  stack: Stack
  /** The wallet to pay from — any object with a fetch() method */
  wallet: ComputeWallet
  /** Sandbox size. Default: 'small' */
  size?: Size
  /** Execution timeout in seconds. Default: per-size default */
  timeout_seconds?: number
  /** Optional files to include: filename → base64 content */
  files?: Record<string, string>
}

export interface ComputeResponse {
  stdout: string
  stderr: string
  exit_code: number
  execution_time_ms: number
}

export interface PricingTier {
  vcpu: number
  ram_gb: number
  default_timeout_s: number
  max_timeout_s: number
  base_price_usd: number
  per_second_usd: number
}
