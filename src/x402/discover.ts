import type { DiscoverResult, DiscoverOptions, BazaarService, PaymentOption } from "./types.js"
import { formatPrice } from "./format.js"

const DEFAULT_BAZAAR_URL = "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources"

/**
 * Query the Bazaar registry to find available x402 services.
 *
 * Fetches from the Coinbase CDP Bazaar discovery endpoint and returns
 * a normalized list of services with human-readable pricing.
 *
 * No wallet or authentication needed.
 */
export async function discover(options?: DiscoverOptions): Promise<DiscoverResult> {
  const baseUrl = options?.bazaarUrl ?? DEFAULT_BAZAAR_URL
  const params = new URLSearchParams()
  if (options?.limit != null) params.set("limit", String(options.limit))
  if (options?.offset != null) params.set("offset", String(options.offset))

  const url = params.toString() ? `${baseUrl}?${params}` : baseUrl

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: options?.signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Bazaar request failed (${res.status}): ${text}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await res.json()) as any

  // The Bazaar response has an `items` array (or `resources`)
  const items: unknown[] = json.items ?? json.resources ?? []

  const services: BazaarService[] = items.map(normalizeBazaarItem).filter(Boolean) as BazaarService[]

  return {
    services,
    total: json.total ?? json.totalCount ?? services.length,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBazaarItem(item: any): BazaarService | null {
  if (!item || typeof item !== "object") return null

  const accepts: unknown[] = item.accepts ?? []
  if (accepts.length === 0) return null

  const normalizedAccepts: PaymentOption[] = accepts.map((a: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accept = a as any
    return {
      scheme: accept.scheme ?? "exact",
      network: accept.network ?? "",
      asset: accept.asset ?? "",
      amount: String(accept.amount ?? accept.maxAmountRequired ?? "0"),
      payTo: accept.payTo ?? "",
      maxTimeoutSeconds: accept.maxTimeoutSeconds ?? 0,
      extra: accept.extra ?? undefined,
    }
  })

  // Find cheapest option for display price
  const cheapest = normalizedAccepts.reduce((min, a) => (BigInt(a.amount) < BigInt(min.amount) ? a : min))
  const price = formatPrice(cheapest.amount, cheapest.asset, cheapest.network)

  // Extract description from various possible locations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstAccept = accepts[0] as any
  const description: string | null =
    item.description ?? item.resource?.description ?? firstAccept?.description ?? item.metadata?.description ?? null

  // Extract URL
  const url: string =
    item.url ??
    item.resource?.url ??
    (typeof item.resource === "string" ? item.resource : null) ??
    firstAccept?.resource ??
    ""

  return {
    url,
    description,
    price,
    accepts: normalizedAccepts,
    metadata: item.metadata ?? {},
  }
}
