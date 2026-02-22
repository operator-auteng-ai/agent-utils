import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import type { PrivateKeyAccount } from "viem"

export function createKeypair(): {
  privateKey: `0x${string}`
  account: PrivateKeyAccount
} {
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)
  return { privateKey, account }
}

export function loadKeypair(privateKey: `0x${string}`): {
  account: PrivateKeyAccount
} {
  const account = privateKeyToAccount(privateKey)
  return { account }
}
