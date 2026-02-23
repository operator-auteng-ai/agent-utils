import { describe, it, expect } from "vitest"
import { formatPrice } from "../format.js"

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

describe("formatPrice", () => {
  it("formats USDC on Base", () => {
    expect(formatPrice("2000", USDC_BASE, "eip155:8453")).toBe("$0.002 USDC on Base")
  })

  it("formats larger amounts", () => {
    expect(formatPrice("1000000", USDC_BASE, "eip155:8453")).toBe("$1 USDC on Base")
  })

  it("formats USDC on Base Sepolia", () => {
    expect(formatPrice("5000", USDC_SEPOLIA, "eip155:84532")).toBe("$0.005 USDC on Base Sepolia")
  })

  it("handles case-insensitive asset addresses", () => {
    expect(formatPrice("2000", USDC_BASE.toLowerCase(), "eip155:8453")).toBe("$0.002 USDC on Base")
  })

  it("short format omits network", () => {
    expect(formatPrice("2000", USDC_BASE, "eip155:8453", { short: true })).toBe("$0.002 USDC")
  })

  it("falls back for unknown assets", () => {
    const result = formatPrice("500", "0xABCDEF1234567890ABCDEF1234567890ABCDEF12", "eip155:8453")
    expect(result).toBe("500 0xABCD...EF12 on Base")
  })

  it("falls back for unknown networks", () => {
    expect(formatPrice("2000", USDC_BASE, "eip155:999")).toBe("$0.002 USDC")
  })

  it("handles zero amount", () => {
    expect(formatPrice("0", USDC_BASE, "eip155:8453")).toBe("$0 USDC on Base")
  })

  it("handles legacy network names", () => {
    expect(formatPrice("2000", USDC_BASE, "base")).toBe("$0.002 USDC on Base")
    expect(formatPrice("2000", USDC_SEPOLIA, "base-sepolia")).toBe("$0.002 USDC on Base Sepolia")
  })
})
