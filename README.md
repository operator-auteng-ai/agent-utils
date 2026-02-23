# @auteng/agent-utils

Utility belt for autonomous AI agents — wallet, compute, and x402 payments.

## Install

```bash
npm install @auteng/agent-utils
```

## Wallet

Create a crypto wallet (USDC on Base) so your agent can pay for x402 services:

```typescript
import { wallet } from '@auteng/agent-utils';

await wallet.create();
console.log(wallet.address); // 0xABC...
```

This generates an EVM keypair and stores it at `.auteng/wallet.json`. If a wallet already exists, it loads it.

### Check balance

```typescript
const balance = await wallet.checkBalance();
// Returns USDC balance in minor units (6 decimals)
// e.g., 10_000000n = $10.00
```

### Wait for funding

```typescript
await wallet.waitForFunding(10_000000n);
// Polls every 10s until >= 10 USDC is available
```

### x402 fetch

Drop-in `fetch()` replacement that handles x402 payments automatically:

```typescript
const res = await wallet.fetch('https://x402.auteng.ai/api/x402/compute', {
  method: 'POST',
  body: JSON.stringify({ code: 'print("hi")', stack: 'python', size: 'small' }),
});
```

If the server returns `402 Payment Required`, the library signs an EIP-3009 authorization and retries with payment headers.

## Compute

Run sandboxed code via AutEng's x402 compute endpoint:

```typescript
import { compute } from '@auteng/agent-utils';

const result = await compute.run({
  code: 'print("hello world")',
  stack: 'python',  // 'python' | 'node'
  size: 'small',    // 'small' | 'med' | 'large'
});
console.log(result.stdout); // "hello world\n"
```

### Pricing

```typescript
compute.pricing();
// { small: { base_price_usd: 0.002, ... }, med: { ... }, large: { ... } }
```

| Size  | vCPU | RAM  | Base price | Per second |
|-------|------|------|-----------|------------|
| small | 2    | 1 GB | $0.002    | $0.00005   |
| med   | 4    | 4 GB | $0.008    | $0.00012   |
| large | 8    | 16 GB| $0.03     | $0.00025   |

## License

MIT
