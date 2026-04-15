# Stellar Yellow Belt Crowdfunding

## Project Title

Stellar Yellow Belt Crowdfunding

## Project Description

Stellar Yellow Belt Crowdfunding is a Web3 donation dApp built with Next.js and Soroban on Stellar Testnet. It allows users to connect Stellar wallets, donate on-chain to a campaign contract, monitor donation progress, and track recent contract events in near real time.

## Project Vision

The project is designed as a foundation for transparent and community-driven fundraising on Stellar, where:

- campaign metrics are verifiable on-chain
- donations are authorized by user wallet signatures
- transaction and event history are publicly auditable
- the UX is modern enough for broader non-technical adoption

## Key Features

- Multi-wallet connection and transaction signing via Stellar Wallets Kit.
- Soroban smart contract-backed campaign state (`goal`, `raised`, `donor_count`).
- On-chain donation flow with validation (`amount > 0`).
- Live campaign progress stats and animated donation dashboard.
- Transaction lifecycle feedback (`idle`, `pending`, `success`, `error`) with explorer links.
- Recent contract event feed from Soroban RPC ledger event scanning.
- Testnet-ready configuration through `NEXT_PUBLIC_SOROBAN_RPC_URL` and `NEXT_PUBLIC_CONTRACT_ID`.

## Deployed Smartcontract Details

- **Network:** Stellar Testnet
- **RPC URL:** `https://soroban-testnet.stellar.org`
- **Deployed contract ID:** `CDTZ6LR6CTZWGD3Y62WYXHJ4FCHQCWEJ2BK3DSIIF53YRII3BFHMQJV3`
- **Block Explorer URL:** [Stellar Expert - Contract Page](https://stellar.expert/explorer/testnet/contract/CDTZ6LR6CTZWGD3Y62WYXHJ4FCHQCWEJ2BK3DSIIF53YRII3BFHMQJV3)

### Screenshot of Block Explorer (Deployed Smart Contract)

![Deployed smart contract on Stellar Expert](https://image.thum.io/get/width/1200/noanimate/https://stellar.expert/explorer/testnet/contract/CDTZ6LR6CTZWGD3Y62WYXHJ4FCHQCWEJ2BK3DSIIF53YRII3BFHMQJV3)

## Future Scope

- Support multiple campaigns and campaign categories in one contract/app.
- Add donor identity/profile layer and per-wallet donation history.
- Introduce milestone-based fund release and governance approvals.
- Add tokenized rewards/NFT badges for donors and engagement programs.
- Integrate indexer/cache layer for richer analytics and faster historical queries.
- Harden for production with role controls, monitoring, and mainnet deployment playbooks.
