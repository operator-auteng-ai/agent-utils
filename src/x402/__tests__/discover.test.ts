import { describe, it, expect, vi, beforeEach } from "vitest"
import { discover } from "../discover.js"

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"

const bazaarResponse = {
  items: [
    {
      url: "https://api.example.com/compute",
      description: "Sandboxed code execution",
      accepts: [
        {
          scheme: "exact",
          network: "eip155:8453",
          asset: USDC_BASE,
          amount: "2000",
          payTo: "0xABC",
          maxTimeoutSeconds: 300,
        },
      ],
      metadata: { provider: "auteng" },
    },
    {
      resource: { url: "https://api.example.com/weather", description: "Weather data" },
      accepts: [
        {
          scheme: "exact",
          network: "eip155:8453",
          asset: USDC_BASE,
          maxAmountRequired: "500",
          payTo: "0xDEF",
          maxTimeoutSeconds: 60,
        },
      ],
      metadata: {},
    },
  ],
  total: 42,
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("discover", () => {
  it("returns normalized services", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(bazaarResponse), { status: 200 }),
    )

    const result = await discover()
    expect(result.total).toBe(42)
    expect(result.services).toHaveLength(2)

    expect(result.services[0].url).toBe("https://api.example.com/compute")
    expect(result.services[0].description).toBe("Sandboxed code execution")
    expect(result.services[0].price).toBe("$0.002 USDC on Base")
    expect(result.services[0].accepts[0].amount).toBe("2000")

    expect(result.services[1].url).toBe("https://api.example.com/weather")
    expect(result.services[1].description).toBe("Weather data")
    expect(result.services[1].price).toBe("$0.0005 USDC on Base")
  })

  it("forwards pagination params", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }),
    )

    await discover({ limit: 5, offset: 10 })

    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain("limit=5")
    expect(String(url)).toContain("offset=10")
  })

  it("uses custom bazaarUrl", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }),
    )

    await discover({ bazaarUrl: "https://custom.bazaar.com/list" })

    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain("custom.bazaar.com")
  })

  it("throws on non-200 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Server Error", { status: 500 }),
    )

    await expect(discover()).rejects.toThrow("Bazaar request failed (500)")
  })

  it("handles empty items", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }),
    )

    const result = await discover()
    expect(result.services).toHaveLength(0)
    expect(result.total).toBe(0)
  })
})
