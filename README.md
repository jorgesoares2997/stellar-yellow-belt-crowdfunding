# Stellar Yellow Belt - Crowdfunding Page

Crowdfunding dApp for Stellar Journey Yellow Belt.

## What this project includes

- Multi-wallet integration via `@creit.tech/stellar-wallets-kit`
- Soroban smart contract read/write from frontend
- Real-time synchronization using contract event polling
- Transaction status tracking (`pending` / `success` / `failed`)
- 3 required error types handled:
  - `WALLET_NOT_FOUND`
  - `WALLET_REJECTED`
  - `INSUFFICIENT_BALANCE`

## Setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Set your deployed contract:

`NEXT_PUBLIC_CONTRACT_ID=<your testnet contract id>`

3. Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy contract to testnet (Soroban CLI)

Compile:

```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
```

Deploy (example):

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/crowdfunding_contract.wasm \
  --source YOUR_IDENTITY \
  --network testnet
```

Initialize:

```bash
soroban contract invoke \
  --id YOUR_CONTRACT_ID \
  --source YOUR_IDENTITY \
  --network testnet \
  -- init \
  --owner YOUR_PUBLIC_KEY \
  --goal 100000000
```

Then put your deployed id in `.env.local`:

```bash
NEXT_PUBLIC_CONTRACT_ID=YOUR_CONTRACT_ID
```

## Submission checklist fields

- Live demo link: _(optional, add after deploy)_
- Screenshot wallet options: _(add screenshot here)_
- Deployed contract address: `NEXT_PUBLIC_CONTRACT_ID`
- Contract call tx hash: shown in UI under "Transaction Status"
- 2+ meaningful commits: recommended split
  1) `feat: scaffold yellow belt crowdfunding frontend`
  2) `feat: add soroban crowdfunding contract + readme deploy guide`

## Notes

- This app targets **Stellar testnet**.
- You must deploy your own crowdfunding Soroban contract and set the ID in `.env.local`.
