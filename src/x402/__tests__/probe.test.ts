import { describe, it, expect, vi, beforeEach } from "vitest"
import { probe } from "../probe.js"

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"

const v2Response = {
  x402Version: 2,
  resource: {
    url: "https://api.example.com/compute",
    description: "Execute code in sandbox",
    mimeType: "application/json",
  },
  accepts: [
    {
      scheme: "exact",
      network: "eip155:8453",
      asset: USDC_BASE,
      amount: "2000",
      payTo: "0x16F452F90AcED51F6EBd0B790ecA12D196e42085",
      maxTimeoutSeconds: 300,
      extra: { name: "USD Coin", version: "2" },
    },
  ],
}

const v1Response = {
  x402Version: 1,
  accepts: [
    {
      scheme: "exact",
      network: "eip155:8453",
      asset: USDC_BASE,
      maxAmountRequired: "5000",
      payTo: "0xABCDEF",
      maxTimeoutSeconds: 60,
      resource: "https://api.example.com/weather",
      description: "Weather data",
    },
  ],
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("probe", () => {
  it("detects x402 v2 endpoint", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(v2Response), { status: 402 }),
    )

    const result = await probe("https://api.example.com/compute")
    expect(result.enabled).toBe(true)
    expect(result.status).toBe(402)
    expect(result.price).toBe("$0.002 USDC on Base")
    expect(result.paymentRequired!.accepts[0].amount).toBe("2000")
    expect(result.paymentRequired!.accepts[0].payTo).toBe("0x16F452F90AcED51F6EBd0B790ecA12D196e42085")
    expect(result.paymentRequired!.resource.description).toBe("Execute code in sandbox")
  })

  it("normalizes v1 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(v1Response), { status: 402 }),
    )

    const result = await probe("https://api.example.com/weather")
    expect(result.enabled).toBe(true)
    expect(result.price).toBe("$0.005 USDC on Base")
    expect(result.paymentRequired!.accepts[0].amount).toBe("5000")
    expect(result.paymentRequired!.resource.url).toBe("https://api.example.com/weather")
    expect(result.paymentRequired!.resource.description).toBe("Weather data")
  })

  it("returns disabled for 200 responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("ok", { status: 200 }),
    )

    const result = await probe("https://free-api.example.com")
    expect(result.enabled).toBe(false)
    expect(result.status).toBe(200)
    expect(result.price).toBeNull()
    expect(result.paymentRequired).toBeNull()
  })

  it("returns disabled for 500 responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("error", { status: 500 }),
    )

    const result = await probe("https://broken.example.com")
    expect(result.enabled).toBe(false)
    expect(result.status).toBe(500)
  })

  it("returns disabled for 402 with invalid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not json", { status: 402 }),
    )

    const result = await probe("https://weird.example.com")
    expect(result.enabled).toBe(false)
    expect(result.status).toBe(402)
  })

  it("forwards method, headers, and body", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(v2Response), { status: 402 }),
    )

    await probe("https://api.example.com/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"code":"print(1)"}',
    })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [, init] = fetchSpy.mock.calls[0]
    expect(init?.method).toBe("POST")
    expect((init?.headers as Record<string, string>)?.["Content-Type"]).toBe("application/json")
    expect(init?.body).toBe('{"code":"print(1)"}')
  })
})
