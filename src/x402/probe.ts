import type { ProbeResult, ProbeOptions, PaymentRequiredResponse, PaymentOption } from "./types.js"
import { formatPrice } from "./format.js"

/**
 * Check if a URL is x402-enabled and see what it costs, without paying.
 *
 * Sends a request to the URL. If the server returns 402 Payment Required,
 * parses the payment requirements and returns a structured result with
 * human-readable pricing. Non-402 responses return `{ enabled: false }`.
 *
 * No wallet needed — this is a read-only inspection.
 */
export async function probe(url: string, options?: ProbeOptions): Promise<ProbeResult> {
  const res = await fetch(url, {
    method: options?.method ?? "GET",
    headers: options?.headers,
    body: options?.body,
    signal: options?.signal,
  })

  if (res.status !== 402) {
    return { enabled: false, url, status: res.status, price: null, paymentRequired: null }
  }

  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    return { enabled: false, url, status: 402, price: null, paymentRequired: null }
  }

  const paymentRequired = normalizePaymentRequired(raw)
  if (!paymentRequired || paymentRequired.accepts.length === 0) {
    return { enabled: false, url, status: 402, price: null, paymentRequired: null }
  }

  const first = paymentRequired.accepts[0]
  const price = formatPrice(first.amount, first.asset, first.network)

  return { enabled: true, url, status: 402, price, paymentRequired }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePaymentRequired(raw: any): PaymentRequiredResponse | null {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.accepts) || raw.accepts.length === 0) {
    return null
  }

  const firstAccept = raw.accepts[0]

  // Determine if v2 (has top-level resource object and accepts[].amount)
  // or v1 (has accepts[].maxAmountRequired and inline resource/description)
  const isV2 = typeof firstAccept.amount === "string" && raw.resource && typeof raw.resource === "object"

  if (isV2) {
    return {
      x402Version: raw.x402Version ?? 2,
      resource: {
        url: raw.resource.url ?? "",
        description: raw.resource.description,
        mimeType: raw.resource.mimeType,
      },
      accepts: raw.accepts.map(normalizeAccept),
      extensions: raw.extensions ?? undefined,
    }
  }

  // v1 shape: maxAmountRequired, inline resource/description on each accept
  if (typeof firstAccept.maxAmountRequired === "string") {
    return {
      x402Version: raw.x402Version ?? 1,
      resource: {
        url: firstAccept.resource ?? raw.resource?.url ?? "",
        description: firstAccept.description ?? raw.resource?.description,
        mimeType: firstAccept.mimeType ?? raw.resource?.mimeType,
      },
      accepts: raw.accepts.map((a: Record<string, unknown>) =>
        normalizeAccept({
          ...a,
          amount: a.maxAmountRequired,
        })
      ),
      extensions: raw.extensions ?? undefined,
    }
  }

  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAccept(a: any): PaymentOption {
  return {
    scheme: a.scheme ?? "exact",
    network: a.network ?? "",
    asset: a.asset ?? "",
    amount: String(a.amount ?? a.maxAmountRequired ?? "0"),
    payTo: a.payTo ?? "",
    maxTimeoutSeconds: a.maxTimeoutSeconds ?? 0,
    extra: a.extra ?? undefined,
  }
}
