import { describe, it, expect, vi } from "vitest"
import { compute } from "../index.js"
import type { ComputeWallet } from "../types.js"

function createMockWallet(fetchResponse?: Response): ComputeWallet {
  const mockFetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
    fetchResponse ??
      new Response(
        JSON.stringify({
          stdout: "hello\n",
          stderr: "",
          exit_code: 0,
          execution_time_ms: 150,
        }),
        { status: 200 }
      )
  )
  return { fetch: mockFetch }
}

describe("compute.run", () => {
  it("sends correct request to the endpoint", async () => {
    const w = createMockWallet()
    const fetchSpy = vi.spyOn(w, "fetch")

    await compute.run({
      code: 'print("hello")',
      stack: "python",
      wallet: w,
    })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toContain("/api/x402/compute")
    expect(init?.method).toBe("POST")

    const body = JSON.parse(init?.body as string)
    expect(body.code).toBe('print("hello")')
    expect(body.stack).toBe("python")
    expect(body.size).toBe("small")
  })

  it("returns parsed compute response", async () => {
    const w = createMockWallet()
    const result = await compute.run({
      code: 'print("hello")',
      stack: "python",
      wallet: w,
    })

    expect(result.stdout).toBe("hello\n")
    expect(result.stderr).toBe("")
    expect(result.exit_code).toBe(0)
    expect(result.execution_time_ms).toBe(150)
  })

  it("passes size, timeout_seconds, and files through", async () => {
    const w = createMockWallet()
    const fetchSpy = vi.spyOn(w, "fetch")

    await compute.run({
      code: "import data",
      stack: "python",
      size: "large",
      timeout_seconds: 120,
      files: { "data.csv": "aGVsbG8=" },
      wallet: w,
    })

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(body.size).toBe("large")
    expect(body.timeout_seconds).toBe(120)
    expect(body.files).toEqual({ "data.csv": "aGVsbG8=" })
  })

  it("throws when code is missing", async () => {
    const w = createMockWallet()
    await expect(compute.run({ code: "", stack: "python", wallet: w })).rejects.toThrow("'code' is required")
  })

  it("throws when stack is missing", async () => {
    const w = createMockWallet()
    await expect(compute.run({ code: "x = 1", stack: "" as any, wallet: w })).rejects.toThrow("'stack' is required")
  })

  it("throws when wallet is missing", async () => {
    await expect(compute.run({ code: "x = 1", stack: "python", wallet: undefined as any })).rejects.toThrow(
      "'wallet' is required"
    )
  })

  it("throws on non-200 response", async () => {
    const w = createMockWallet(new Response("Internal Server Error", { status: 500 }))
    await expect(compute.run({ code: "x = 1", stack: "python", wallet: w })).rejects.toThrow(
      "Compute request failed (500)"
    )
  })
})

describe("compute.pricing", () => {
  it("returns pricing for all sizes", () => {
    const pricing = compute.pricing()
    expect(pricing).toHaveProperty("small")
    expect(pricing).toHaveProperty("med")
    expect(pricing).toHaveProperty("large")
  })

  it("returns a copy (not the internal object)", () => {
    const a = compute.pricing()
    const b = compute.pricing()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })

  it("has correct structure for each tier", () => {
    const pricing = compute.pricing()
    for (const tier of Object.values(pricing)) {
      expect(tier).toHaveProperty("vcpu")
      expect(tier).toHaveProperty("ram_gb")
      expect(tier).toHaveProperty("base_price_usd")
      expect(tier).toHaveProperty("per_second_usd")
      expect(tier).toHaveProperty("default_timeout_s")
      expect(tier).toHaveProperty("max_timeout_s")
    }
  })
})

describe("compute.setEndpoint", () => {
  it("changes the endpoint for subsequent requests", async () => {
    const w = createMockWallet()
    const fetchSpy = vi.spyOn(w, "fetch")

    compute.setEndpoint("https://custom.example.com/compute")
    await compute.run({ code: "x=1", stack: "python", wallet: w })

    const [url] = fetchSpy.mock.calls[0]
    expect(url).toBe("https://custom.example.com/compute")

    // Reset to default
    compute.setEndpoint("https://x402.auteng.ai/api/x402/compute")
  })
})
