import { join, resolve } from "node:path"
import { createKeypair, loadKeypair } from "./keypair.js"
import { readWalletFile, writeWalletFile, listWalletFiles, migrateLegacyWallet, validateWalletName } from "./storage.js"
import { createPaymentFetch } from "../x402/index.js"
import { Wallet } from "./wallet.js"
import type { CreateWalletOptions } from "./types.js"

const DEFAULT_WALLETS_DIR = ".auteng/wallets"

const _wallets = new Map<string, Wallet>()

export const wallet = {
  /**
   * Create a new named wallet or load an existing one from disk.
   * Idempotent: if a wallet with this name already exists, returns it.
   */
  async create(opts?: CreateWalletOptions): Promise<Wallet> {
    const name = opts?.name ?? "default"
    validateWalletName(name)

    if (_wallets.has(name)) return _wallets.get(name)!

    const dir = resolve(opts?.walletsDir ?? DEFAULT_WALLETS_DIR)
    const filePath = join(dir, `${name}.json`)
    const network = opts?.network ?? "base"
    const rpcUrl = opts?.rpcUrl

    let existing = readWalletFile(filePath)

    if (!existing && name === "default") {
      existing = migrateLegacyWallet(dir)
    }

    let privateKey: `0x${string}`
    let account: ReturnType<typeof loadKeypair>["account"]

    if (existing) {
      privateKey = existing.privateKey
      account = loadKeypair(existing.privateKey).account
    } else {
      const kp = createKeypair()
      privateKey = kp.privateKey
      account = kp.account
      writeWalletFile(filePath, {
        privateKey,
        address: account.address,
        network,
      })
    }

    const effectiveNetwork = existing?.network ?? network
    const paymentFetch = createPaymentFetch(privateKey, effectiveNetwork, rpcUrl)
    const w = new Wallet({
      name,
      account,
      privateKey,
      network: effectiveNetwork,
      rpcUrl,
      paymentFetch,
    })
    _wallets.set(name, w)
    return w
  },

  /**
   * Retrieve a previously-created wallet by name.
   * Loads from disk if not in memory. Throws if not found.
   */
  get(name: string): Wallet {
    validateWalletName(name)

    if (_wallets.has(name)) return _wallets.get(name)!

    const filePath = join(resolve(DEFAULT_WALLETS_DIR), `${name}.json`)
    const data = readWalletFile(filePath)
    if (!data) throw new Error(`Wallet "${name}" not found`)

    const { account } = loadKeypair(data.privateKey)
    const paymentFetch = createPaymentFetch(data.privateKey, data.network)
    const w = new Wallet({
      name,
      account,
      privateKey: data.privateKey,
      network: data.network,
      paymentFetch,
    })
    _wallets.set(name, w)
    return w
  },

  /** List all persisted wallets. */
  list(): Wallet[] {
    const dir = resolve(DEFAULT_WALLETS_DIR)
    const names = listWalletFiles(dir)
    return names.map((n) => {
      if (_wallets.has(n)) return _wallets.get(n)!
      return wallet.get(n)
    })
  },
}
