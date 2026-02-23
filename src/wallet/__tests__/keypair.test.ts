import { describe, it, expect } from "vitest"
import { createKeypair, loadKeypair } from "../keypair.js"

describe("createKeypair", () => {
  it("generates a valid private key and account", () => {
    const { privateKey, account } = createKeypair()
    expect(privateKey).toMatch(/^0x[0-9a-f]{64}$/)
    expect(account.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it("generates unique keypairs each time", () => {
    const a = createKeypair()
    const b = createKeypair()
    expect(a.privateKey).not.toBe(b.privateKey)
    expect(a.account.address).not.toBe(b.account.address)
  })
})

describe("loadKeypair", () => {
  it("loads a known private key to the expected address", () => {
    // Well-known Hardhat/Anvil test key #0
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    const { account } = loadKeypair(privateKey)
    expect(account.address.toLowerCase()).toBe("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")
  })

  it("round-trips with createKeypair", () => {
    const { privateKey, account: original } = createKeypair()
    const { account: loaded } = loadKeypair(privateKey)
    expect(loaded.address).toBe(original.address)
  })
})
