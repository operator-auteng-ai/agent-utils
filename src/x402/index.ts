// Internal — used by wallet module
export { createPaymentFetch } from "./payment-fetch.js"

// Public x402 convenience functions
import { probe } from "./probe.js"
import { discover } from "./discover.js"
import { formatPrice } from "./format.js"

export const x402 = {
  probe,
  discover,
  formatPrice,
}

export type {
  ProbeResult,
  ProbeOptions,
  PaymentRequiredResponse,
  PaymentOption,
  BazaarService,
  DiscoverResult,
  DiscoverOptions,
  FormatPriceOptions,
} from "./types.js"
