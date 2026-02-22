import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname } from "node:path"
import type { WalletFile } from "./types.js"

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
