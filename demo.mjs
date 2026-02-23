import { wallet, compute } from '@auteng/agent-utils';

// ── Pretty helpers ──────────────────────────────────────────────────
const fmt = (usdc) => `$${(Number(usdc) / 1_000_000).toFixed(4)}`;
const hr = () => console.log('─'.repeat(56));

async function main() {
  hr();
  console.log('  POCKET MONEY DEMO — autonomous compute with x402');
  hr();

  // 1. Show pricing
  const prices = compute.pricing();
  console.log('\n  Compute pricing:');
  for (const [size, p] of Object.entries(prices)) {
    console.log(`    ${size.padEnd(6)} → $${p.base_price_usd} base + $${p.per_second_usd}/s  (${p.vcpu} vCPU, ${p.ram_gb}GB RAM)`);
  }

  // 2. Create (or load) a wallet
  const w = await wallet.create({ name: 'demo-compute' });
  const balance = await w.checkBalance();

  console.log(`\n  Wallet: "${w.name}"`);
  console.log(`  Address: ${w.address}`);
  console.log(`  Balance: ${fmt(balance)}`);
  hr();

  // 3. If no funds, ask and wait
  const needed = 1_000_000n; // $1.00 — plenty for demos
  if (balance < needed) {
    console.log(`\n  This wallet needs at least ${fmt(needed)} USDC to run the demo.`);
    console.log(`\n  Please send USDC on **Base** to:`);
    console.log(`  ${w.address}`);
    console.log(`\n  Waiting for funds...`);
    await w.waitForFunding(needed);
    const newBal = await w.checkBalance();
    console.log(`  Funded! New balance: ${fmt(newBal)}`);
    hr();
  }

  // 4. Run some compute jobs
  const jobs = [
    {
      label: 'Python — Fibonacci',
      code: `
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

for i in [10, 20, 30, 40, 50]:
    print(f"fib({i}) = {fib(i)}")
`,
      stack: 'python',
    },
    {
      label: 'Python — System info',
      code: `
import platform, os
print(f"Python {platform.python_version()}")
print(f"OS: {platform.system()} {platform.release()}")
print(f"Arch: {platform.machine()}")
print(f"CPUs: {os.cpu_count()}")
`,
      stack: 'python',
    },
    {
      label: 'Node — UUID generation',
      code: `
const crypto = require('crypto');
for (let i = 0; i < 5; i++) {
  console.log(crypto.randomUUID());
}
`,
      stack: 'node',
    },
  ];

  console.log('\n  Running compute jobs...\n');

  for (const job of jobs) {
    console.log(`  ▸ ${job.label}`);
    try {
      const result = await compute.run({
        code: job.code.trim(),
        stack: job.stack,
        size: 'small',
        wallet: w,
      });
      // indent output
      const lines = (result.stdout || '').trim().split('\n');
      for (const line of lines) {
        console.log(`    ${line}`);
      }
      if (result.stderr) {
        console.log(`    [stderr] ${result.stderr.trim()}`);
      }
    } catch (err) {
      console.log(`    ERROR: ${err.message}`);
    }
    console.log();
  }

  // 5. Final balance
  const finalBal = await w.checkBalance();
  console.log(`  Starting balance: ${fmt(balance)}`);
  console.log(`  Final balance:    ${fmt(finalBal)}`);
  console.log(`  Spent:            ${fmt(balance - finalBal)}`);
  hr();
  console.log('  Done!');
}

main().catch(console.error);
