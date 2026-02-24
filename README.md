# @auteng/agent-utils

x402 payments and sandboxed compute for autonomous AI agents. Discover, probe, and pay for x402-enabled services, and run sandboxed compute — all with USDC on Base.

> **Wallet management** has moved to [`@auteng/pocket-money`](https://www.npmjs.com/package/@auteng/pocket-money). This package focuses on x402 protocol tools and compute. Agents can use any wallet — pocket-money, Coinbase Agentic Wallet, viem, ethers, or raw key management.

## Install

```bash
npm install @auteng/agent-utils
```

## Quick Start

```typescript
import { x402, compute } from '@auteng/agent-utils';

// Probe any URL to check if it's x402-enabled
const info = await x402.probe('https://api.example.com/generate');
console.log(info.price); // "$0.05 USDC on Base"
```

## x402 — Discover & Inspect Services

Standalone functions for working with x402 services.

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

## Compute (AutEng)

Convenience wrapper for AutEng's x402 sandboxed compute service. Accepts any object with a `fetch()` method as the wallet:

```typescript
import { compute } from '@auteng/agent-utils';

const result = await compute.run({
  code: 'print("hello world")',
  stack: 'python',  // 'python' | 'node'
  size: 'small',    // 'small' | 'med' | 'large'
  wallet: myWallet, // any object with fetch()
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
npm test             # run tests
npm run test:watch   # run tests in watch mode
```

## License

MIT
