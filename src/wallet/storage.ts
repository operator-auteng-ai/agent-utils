import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, copyFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import type { WalletFile } from "./types.js"

const VALID_NAME = /^[a-z0-9_-]+$/

export function validateWalletName(name: string): void {
  if (!VALID_NAME.test(name)) {
    throw new Error(
      `Invalid wallet name "${name}". Use lowercase letters, numbers, hyphens, and underscores only.`
    )
  }
}

export function readWalletFile(path: string): WalletFile | null {
  if (!existsSync(path)) return null
  const raw = readFileSync(path, "utf-8")
  return JSON.parse(raw) as WalletFile
}

export function writeWalletFile(path: string, data: WalletFile): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", {
    mode: 0o600,
  })
}

export function listWalletFiles(dir: string): string[] {
  const resolved = resolve(dir)
  if (!existsSync(resolved)) return []
  return readdirSync(resolved)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
}

export function migrateLegacyWallet(walletsDir: string): WalletFile | null {
  const legacyPath = resolve(walletsDir, "..", "wallet.json")
  const newPath = join(resolve(walletsDir), "default.json")
  if (existsSync(legacyPath) && !existsSync(newPath)) {
    const data = readWalletFile(legacyPath)
    if (data) {
      mkdirSync(resolve(walletsDir), { recursive: true })
      copyFileSync(legacyPath, newPath)
      return data
    }
  }
  return null
}
