import { describe, it, expect, vi } from "vitest"
import { Wallet } from "../wallet.js"
import { createKeypair } from "../keypair.js"

function createTestWallet(overrides?: Partial<ConstructorParameters<typeof Wallet>[0]>) {
  const { privateKey, account } = createKeypair()
  const mockFetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), { status: 200 })
  )
  return new Wallet({
    name: "test",
    account,
    privateKey,
    network: "base",
    paymentFetch: mockFetch,
    ...overrides,
  })
}

describe("Wallet", () => {
  it("exposes name, address, and network as readonly", () => {
    const w = createTestWallet({ name: "my-wallet" })
    expect(w.name).toBe("my-wallet")
    expect(w.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(w.network).toBe("base")
  })

  it("fetch delegates to paymentFetch", async () => {
    const mockFetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response("ok", { status: 200 })
    )
    const w = createTestWallet({ paymentFetch: mockFetch })

    const response = await w.fetch("https://example.com/api", {
      method: "POST",
      body: "test",
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/api", {
      method: "POST",
      body: "test",
    })
    expect(response.status).toBe(200)
  })

  it("checkBalance calls the RPC endpoint", async () => {
    const w = createTestWallet({ network: "base-sepolia" })
    // checkBalance makes a real RPC call — just verify it doesn't throw on a valid network
    // and returns a bigint (balance will be 0 for a random address)
    const balance = await w.checkBalance()
    expect(typeof balance).toBe("bigint")
    expect(balance).toBeGreaterThanOrEqual(0n)
  })

  it("waitForFunding resolves when balance meets threshold", async () => {
    const w = createTestWallet({ network: "base-sepolia" })
    // A random new wallet will have 0 USDC, so waitForFunding(0n) should resolve immediately
    await expect(w.waitForFunding(0n)).resolves.toBeUndefined()
  })

  it("waitForFunding throws on timeout", async () => {
    const w = createTestWallet({ network: "base-sepolia" })
    // Require 1 USDC on a random wallet with 100ms timeout — should fail
    await expect(
      w.waitForFunding(1_000000n, { timeout: 100, pollInterval: 50 })
    ).rejects.toThrow("Funding timeout")
  })
})
