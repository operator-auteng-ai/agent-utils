# @auteng/agent-utils

Give your AI agent its own crypto wallets. Create purpose-specific wallets funded with USDC on Base, then let the agent spend autonomously on x402-enabled services like sandboxed compute. No accounts, no KYC — just wallet addresses and USDC.

## Install

```bash
npm install @auteng/agent-utils
```

## Quick Start

```typescript
import { wallet, compute } from '@auteng/agent-utils';

// 1. Create a wallet for this task
const w = await wallet.create({ name: "my-task" });
console.log(`Fund me: send USDC on Base to ${w.address}`);

// 2. Wait for funding
await w.waitForFunding(5_000000n); // wait for $5 USDC

// 3. Run sandboxed code (payment handled automatically)
const result = await compute.run({
  code: 'print("hello from the sandbox")',
  stack: 'python',
  wallet: w,
});
console.log(result.stdout);
```

## Wallets

Each wallet is an independent keypair with its own address and balance. Create as many as you need — one per task, one per month, one per budget.

```typescript
import { wallet } from '@auteng/agent-utils';

const monthly = await wallet.create({ name: "feb-2026" });
const task    = await wallet.create({ name: "data-pipeline" });
const dev     = await wallet.create({ name: "testnet", network: "base-sepolia" });
```

Wallets are persisted at `.auteng/wallets/<name>.json`. Creating a wallet that already exists loads it from disk.

### Check balance

```typescript
const balance = await monthly.checkBalance();
// Returns USDC in minor units (6 decimals)
// 10_000000n = $10.00 USDC
```

### Wait for funding

```typescript
await monthly.waitForFunding(10_000000n);
// Polls Base every 10s until >= $10 USDC is available
```

### x402 fetch

Drop-in `fetch()` replacement that handles x402 payments automatically:

```typescript
const res = await monthly.fetch('https://x402.auteng.ai/api/x402/compute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'print("hi")', stack: 'python', size: 'small' }),
});
```

If the server returns `402 Payment Required`, the library signs an EIP-3009 authorization and retries with payment headers. No gas needed.

### Retrieve and list wallets

```typescript
const w = wallet.get("feb-2026");   // load by name
const all = wallet.list();           // list all wallets

for (const w of all) {
  const bal = await w.checkBalance();
  console.log(`${w.name}: ${w.address} — ${bal} USDC`);
}
```

## Compute

Run sandboxed code via AutEng's x402 compute endpoint. Pass a wallet to pay for execution:

```typescript
import { wallet, compute } from '@auteng/agent-utils';

const w = await wallet.create({ name: "compute-budget" });

const result = await compute.run({
  code: 'print("hello world")',
  stack: 'python',  // 'python' | 'node'
  size: 'small',    // 'small' | 'med' | 'large'
  wallet: w,
});
console.log(result.stdout); // "hello world\n"
```

### Pricing

| Size  | vCPU | RAM   | Base price | Per second |
|-------|------|-------|-----------|------------|
| small | 2    | 1 GB  | $0.002    | $0.00005   |
| med   | 4    | 4 GB  | $0.008    | $0.00012   |
| large | 8    | 16 GB | $0.03     | $0.00025   |

```typescript
compute.pricing(); // returns full pricing table
```

## Development

```bash
npm install          # install dependencies
npm run build        # build CJS/ESM/DTS to dist/
npm test             # run unit + integration tests
npm run test:watch   # run tests in watch mode
```

## License

MIT
