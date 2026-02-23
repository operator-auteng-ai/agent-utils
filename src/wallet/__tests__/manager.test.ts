import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { wallet } from "../index.js"
import { writeWalletFile } from "../storage.js"
import type { WalletFile } from "../types.js"

const TEST_DIR = join(tmpdir(), `agent-utils-test-manager-${Date.now()}`)
const WALLETS_DIR = join(TEST_DIR, "wallets")

// Use a unique suffix to avoid collisions between test runs
let testId = 0
function uniqueName() {
  return `test-wallet-${Date.now()}-${testId++}`
}

beforeEach(() => {
  wallet._reset()
})

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

describe("wallet.create", () => {
  it("creates a new wallet and returns a Wallet instance", async () => {
    const name = uniqueName()
    const w = await wallet.create({ name, walletsDir: WALLETS_DIR })
    expect(w.name).toBe(name)
    expect(w.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(w.network).toBe("base")
  })

  it("persists the wallet file to disk", async () => {
    const name = uniqueName()
    await wallet.create({ name, walletsDir: WALLETS_DIR })
    expect(existsSync(join(WALLETS_DIR, `${name}.json`))).toBe(true)
  })

  it("returns the same instance when called twice with the same name", async () => {
    const name = uniqueName()
    const a = await wallet.create({ name, walletsDir: WALLETS_DIR })
    const b = await wallet.create({ name, walletsDir: WALLETS_DIR })
    expect(a.address).toBe(b.address)
  })

  it("loads an existing wallet from disk", async () => {
    const name = uniqueName()
    const w1 = await wallet.create({ name, walletsDir: WALLETS_DIR })
    const address1 = w1.address

    // Create a fresh manager call — the in-memory cache won't have it
    // but the file on disk will. We simulate this by using wallet.get
    const w2 = wallet.get(name)
    expect(w2.address).toBe(address1)
  })

  it("creates different wallets for different names", async () => {
    const a = await wallet.create({ name: uniqueName(), walletsDir: WALLETS_DIR })
    const b = await wallet.create({ name: uniqueName(), walletsDir: WALLETS_DIR })
    expect(a.address).not.toBe(b.address)
  })

  it("defaults to 'default' name when no name given", async () => {
    const w = await wallet.create({ walletsDir: WALLETS_DIR })
    expect(w.name).toBe("default")
    expect(existsSync(join(WALLETS_DIR, "default.json"))).toBe(true)
  })

  it("uses base network by default", async () => {
    const w = await wallet.create({ name: uniqueName(), walletsDir: WALLETS_DIR })
    expect(w.network).toBe("base")
  })

  it("accepts base-sepolia network", async () => {
    const w = await wallet.create({
      name: uniqueName(),
      walletsDir: WALLETS_DIR,
      network: "base-sepolia",
    })
    expect(w.network).toBe("base-sepolia")
  })

  it("rejects invalid wallet names", async () => {
    await expect(wallet.create({ name: "Bad Name", walletsDir: WALLETS_DIR }))
      .rejects.toThrow("Invalid wallet name")
  })

  it("migrates legacy wallet.json for default name", async () => {
    const legacyData: WalletFile = {
      privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      network: "base",
    }
    // Write a legacy wallet.json one level up from the wallets dir
    writeWalletFile(join(TEST_DIR, "wallet.json"), legacyData)

    const w = await wallet.create({ walletsDir: join(TEST_DIR, "wallets") })
    expect(w.address.toLowerCase()).toBe(legacyData.address.toLowerCase())
  })
})

describe("wallet.get", () => {
  it("retrieves a previously created wallet", async () => {
    const name = uniqueName()
    const created = await wallet.create({ name, walletsDir: WALLETS_DIR })
    const retrieved = wallet.get(name)
    expect(retrieved.address).toBe(created.address)
  })

  it("throws for non-existent wallet", () => {
    expect(() => wallet.get("does-not-exist")).toThrow('Wallet "does-not-exist" not found')
  })

  it("rejects invalid names", () => {
    expect(() => wallet.get("Bad Name")).toThrow("Invalid wallet name")
  })
})

describe("wallet.list", () => {
  it("lists all created wallets", async () => {
    const nameA = uniqueName()
    const nameB = uniqueName()
    await wallet.create({ name: nameA, walletsDir: WALLETS_DIR })
    await wallet.create({ name: nameB, walletsDir: WALLETS_DIR })

    const all = wallet.list()
    const names = all.map((w) => w.name).sort()
    expect(names).toContain(nameA)
    expect(names).toContain(nameB)
  })
})
