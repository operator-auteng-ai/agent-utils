import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  readWalletFile,
  writeWalletFile,
  listWalletFiles,
  migrateLegacyWallet,
  validateWalletName,
} from "../storage.js"
import type { WalletFile } from "../types.js"

const TEST_DIR = join(tmpdir(), `agent-utils-test-storage-${Date.now()}`)

const SAMPLE_WALLET: WalletFile = {
  privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  network: "base",
}

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true })
})

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

describe("validateWalletName", () => {
  it("accepts valid names", () => {
    expect(() => validateWalletName("default")).not.toThrow()
    expect(() => validateWalletName("monthly-budget")).not.toThrow()
    expect(() => validateWalletName("task_123")).not.toThrow()
    expect(() => validateWalletName("a")).not.toThrow()
  })

  it("rejects names with uppercase", () => {
    expect(() => validateWalletName("MyWallet")).toThrow("Invalid wallet name")
  })

  it("rejects names with spaces", () => {
    expect(() => validateWalletName("my wallet")).toThrow("Invalid wallet name")
  })

  it("rejects names with special characters", () => {
    expect(() => validateWalletName("wallet.json")).toThrow("Invalid wallet name")
    expect(() => validateWalletName("../escape")).toThrow("Invalid wallet name")
    expect(() => validateWalletName("")).toThrow("Invalid wallet name")
  })
})

describe("readWalletFile", () => {
  it("returns null for non-existent file", () => {
    const result = readWalletFile(join(TEST_DIR, "nope.json"))
    expect(result).toBeNull()
  })

  it("reads a valid wallet file", () => {
    const path = join(TEST_DIR, "test.json")
    writeWalletFile(path, SAMPLE_WALLET)
    const result = readWalletFile(path)
    expect(result).toEqual(SAMPLE_WALLET)
  })
})

describe("writeWalletFile", () => {
  it("creates parent directories", () => {
    const path = join(TEST_DIR, "deep", "nested", "wallet.json")
    writeWalletFile(path, SAMPLE_WALLET)
    expect(existsSync(path)).toBe(true)
  })

  it("writes valid JSON", () => {
    const path = join(TEST_DIR, "wallet.json")
    writeWalletFile(path, SAMPLE_WALLET)
    const raw = readFileSync(path, "utf-8")
    const parsed = JSON.parse(raw)
    expect(parsed.privateKey).toBe(SAMPLE_WALLET.privateKey)
    expect(parsed.address).toBe(SAMPLE_WALLET.address)
    expect(parsed.network).toBe(SAMPLE_WALLET.network)
  })

  it("sets restrictive file permissions", () => {
    const path = join(TEST_DIR, "wallet.json")
    writeWalletFile(path, SAMPLE_WALLET)
    const { statSync } = require("node:fs")
    const stats = statSync(path)
    // 0o600 = owner read/write only
    expect(stats.mode & 0o777).toBe(0o600)
  })
})

describe("listWalletFiles", () => {
  it("returns empty array for non-existent directory", () => {
    const result = listWalletFiles(join(TEST_DIR, "nope"))
    expect(result).toEqual([])
  })

  it("returns empty array for empty directory", () => {
    const dir = join(TEST_DIR, "empty")
    mkdirSync(dir)
    const result = listWalletFiles(dir)
    expect(result).toEqual([])
  })

  it("lists wallet names without .json extension", () => {
    const dir = join(TEST_DIR, "wallets")
    writeWalletFile(join(dir, "alpha.json"), SAMPLE_WALLET)
    writeWalletFile(join(dir, "beta.json"), SAMPLE_WALLET)
    const result = listWalletFiles(dir)
    expect(result.sort()).toEqual(["alpha", "beta"])
  })

  it("ignores non-json files", () => {
    const dir = join(TEST_DIR, "wallets")
    mkdirSync(dir, { recursive: true })
    writeWalletFile(join(dir, "real.json"), SAMPLE_WALLET)
    require("node:fs").writeFileSync(join(dir, "readme.txt"), "hello")
    const result = listWalletFiles(dir)
    expect(result).toEqual(["real"])
  })
})

describe("migrateLegacyWallet", () => {
  it("returns null when no legacy file exists", () => {
    const walletsDir = join(TEST_DIR, "wallets")
    const result = migrateLegacyWallet(walletsDir)
    expect(result).toBeNull()
  })

  it("migrates legacy wallet.json to wallets/default.json", () => {
    const walletsDir = join(TEST_DIR, "wallets")
    const legacyPath = join(TEST_DIR, "wallet.json")
    writeWalletFile(legacyPath, SAMPLE_WALLET)

    const result = migrateLegacyWallet(walletsDir)
    expect(result).toEqual(SAMPLE_WALLET)
    expect(existsSync(join(walletsDir, "default.json"))).toBe(true)
    // Legacy file should still exist (not deleted)
    expect(existsSync(legacyPath)).toBe(true)
  })

  it("does not overwrite existing default.json", () => {
    const walletsDir = join(TEST_DIR, "wallets")
    const legacyPath = join(TEST_DIR, "wallet.json")

    const otherWallet: WalletFile = {
      ...SAMPLE_WALLET,
      address: "0x0000000000000000000000000000000000000001",
    }
    writeWalletFile(legacyPath, SAMPLE_WALLET)
    writeWalletFile(join(walletsDir, "default.json"), otherWallet)

    const result = migrateLegacyWallet(walletsDir)
    expect(result).toBeNull()
    // Existing default.json should be unchanged
    const existing = readWalletFile(join(walletsDir, "default.json"))
    expect(existing?.address).toBe(otherWallet.address)
  })
})
