# @auteng/agent-utils

Utility belt for autonomous AI agents. Create crypto wallets, discover and pay for x402-enabled services, and run sandboxed compute — all with USDC on Base. No accounts, no KYC — just wallet addresses and USDC.

## Install

```bash
npm install @auteng/agent-utils
```

## Quick Start

```typescript
import { wallet, x402, compute } from '@auteng/agent-utils';

// Probe any URL to check if it's x402-enabled
const info = await x402.probe('https://api.example.com/generate');
console.log(info.price); // "$0.05 USDC on Base"

// Create a wallet and pay for it
const w = await wallet.create({ name: "my-task" });
const res = await w.fetch('https://api.example.com/generate', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'hello' }),
});
```

## x402 — Discover & Inspect Services

Standalone functions for working with x402 services. No wallet needed.

### Probe a URL

Check if a URL is x402-enabled and see what it costs:

```typescript
import { x402 } from '@auteng/agent-utils';

const info = await x402.probe('https://api.example.com/generate');
if (info.enabled) {
  console.log(info.price);                        // "$0.05 USDC on Base"
  console.log(info.paymentRequired.accepts[0]);    // full payment details
  console.log(info.paymentRequired.resource);      // what you're paying for
}
```

### Discover services

Browse the [Bazaar](https://www.x402.org/) registry to find x402 services:

```typescript
const { services, total } = await x402.discover({ limit: 10 });
for (const svc of services) {
  console.log(`${svc.description} — ${svc.price}`);
  console.log(`  ${svc.url}`);
}
```

### Format prices

Convert raw x402 amounts to human-readable strings:

```typescript
x402.formatPrice("2000", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "eip155:8453");
// → "$0.002 USDC on Base"

x402.formatPrice("2000", "0x833589f...", "eip155:8453", { short: true });
// → "$0.002 USDC"
```

## Wallets

Each wallet is an independent keypair with its own address and balance. Create as many as you need — one per task, one per month, one per budget.

```typescript
import { wallet } from '@auteng/agent-utils';

const monthly = await wallet.create({ name: "feb-2026" });
const task    = await wallet.create({ name: "data-pipeline" });
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

### Pay any x402 service

Drop-in `fetch()` replacement that handles x402 payments automatically:

```typescript
const res = await monthly.fetch('https://any-x402-service.com/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'hello' }),
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

## Compute (AutEng)

Convenience wrapper for AutEng's x402 sandboxed compute service:

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

## Demo

Run the included demo to see wallet creation, funding, and compute in action:

```bash
node demo.mjs
```

```
────────────────────────────────────────────────────────
  POCKET MONEY DEMO — autonomous compute with x402
────────────────────────────────────────────────────────

  Compute pricing:
    small  → $0.002 base + $0.00005/s  (2 vCPU, 1GB RAM)
    med    → $0.008 base + $0.00012/s  (4 vCPU, 4GB RAM)
    large  → $0.03 base + $0.00025/s  (8 vCPU, 16GB RAM)

  Wallet: "demo-compute"
  Address: 0x9cc8...e18
  Balance: $0.0000
────────────────────────────────────────────────────────

  Waiting for funds...
  Funded! New balance: $1.0000
────────────────────────────────────────────────────────

  Running compute jobs...

  ▸ Python — Fibonacci
    fib(50) = 12586269025

  ▸ Python — System info
    Python 3.12.12, Linux 6.1.158, x86_64, 2 CPUs

  ▸ Node — UUID generation
    f8b260ec-2dea-401b-b807-544f366a8588
    ...

  Spent: $0.0020
────────────────────────────────────────────────────────
  Done!
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
