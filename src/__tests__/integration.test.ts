import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { rmSync, existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { wallet, Wallet } from "../index.js"

const TEST_DIR = join(tmpdir(), `agent-utils-integration-${Date.now()}`)
const WALLETS_DIR = join(TEST_DIR, "wallets")

beforeEach(() => {
  // @ts-expect-error internal test helper
  wallet._reset()
})

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

describe("end-to-end multi-wallet flow", () => {
  it("creates multiple wallets, persists, and retrieves them", async () => {
    // Step 1: Create two named wallets
    const budget = await wallet.create({
      name: "monthly-budget",
      walletsDir: WALLETS_DIR,
      network: "base-sepolia",
    })
    const task = await wallet.create({
      name: "one-off-task",
      walletsDir: WALLETS_DIR,
      network: "base-sepolia",
    })

    // Verify they're distinct
    expect(budget.address).not.toBe(task.address)
    expect(budget.name).toBe("monthly-budget")
    expect(task.name).toBe("one-off-task")

    // Step 2: Both are Wallet instances
    expect(budget).toBeInstanceOf(Wallet)
    expect(task).toBeInstanceOf(Wallet)

    // Step 3: Files exist on disk
    expect(existsSync(join(WALLETS_DIR, "monthly-budget.json"))).toBe(true)
    expect(existsSync(join(WALLETS_DIR, "one-off-task.json"))).toBe(true)

    // Step 4: File format is correct
    const raw = JSON.parse(readFileSync(join(WALLETS_DIR, "monthly-budget.json"), "utf-8"))
    expect(raw.privateKey).toMatch(/^0x[0-9a-f]{64}$/)
    expect(raw.address).toBe(budget.address)
    expect(raw.network).toBe("base-sepolia")

    // Step 5: Retrieve by name
    const retrieved = wallet.get("monthly-budget")
    expect(retrieved.address).toBe(budget.address)

    // Step 6: List all wallets
    const all = wallet.list()
    const names = all.map((w) => w.name).sort()
    expect(names).toContain("monthly-budget")
    expect(names).toContain("one-off-task")

    // Step 7: Check balance on testnet (should be 0 for new wallets)
    const balance = await budget.checkBalance()
    expect(balance).toBe(0n)
  })

  it("idempotently loads the same wallet", async () => {
    const name = "idempotent-test"
    const w1 = await wallet.create({ name, walletsDir: WALLETS_DIR })
    const w2 = await wallet.create({ name, walletsDir: WALLETS_DIR })
    expect(w1.address).toBe(w2.address)
  })

  it("default wallet name is 'default'", async () => {
    const w = await wallet.create({ walletsDir: WALLETS_DIR })
    expect(w.name).toBe("default")
    expect(existsSync(join(WALLETS_DIR, "default.json"))).toBe(true)
  })

  it("wallet.fetch is callable (mock endpoint)", async () => {
    const w = await wallet.create({
      name: "fetch-test",
      walletsDir: WALLETS_DIR,
      network: "base-sepolia",
    })

    // We can't test a real x402 endpoint in unit tests, but we can verify
    // fetch is a function and doesn't throw on construction
    expect(typeof w.fetch).toBe("function")
  })
})
