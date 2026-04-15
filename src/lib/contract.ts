import {
  Address,
  Contract,
  Networks,
  Transaction,
  TransactionBuilder,
  rpc,
  scValToNative,
  nativeToScVal
} from "@stellar/stellar-sdk";
import { CONTRACT_ID, SOROBAN_RPC_URL } from "@/lib/config";
import { WalletAppError, signXdr } from "@/lib/wallet";

const server = new rpc.Server(SOROBAN_RPC_URL);

export type TxState = "idle" | "pending" | "success" | "error";

export type CampaignState = {
  goal: number;
  raised: number;
  donors: number;
};

/** RPC v15 parses `contractId` as a `Contract` instance; `.slice` only exists on strings. */
export function contractIdToString(contractId: unknown): string {
  if (contractId == null) return "";
  if (typeof contractId === "string") return contractId;
  return String(contractId);
}

function requireContractId() {
  if (!CONTRACT_ID) {
    throw new Error("Missing NEXT_PUBLIC_CONTRACT_ID.");
  }
}

export async function readCampaign(sourcePublicKey: string): Promise<CampaignState> {
  requireContractId();
  const contract = new Contract(CONTRACT_ID);
  const source = await server.getAccount(sourcePublicKey);
  const tx = new TransactionBuilder(source, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(contract.call("get_campaign"))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }

  const value = sim.result?.retval ? scValToNative(sim.result.retval) : null;
  if (!value || typeof value !== "object") {
    return { goal: 0, raised: 0, donors: 0 };
  }

  return {
    goal: Number((value as any).goal ?? 0),
    raised: Number((value as any).raised ?? 0),
    donors: Number((value as any).donor_count ?? 0),
  };
}

export async function donate(publicKey: string, amount: number) {
  requireContractId();
  const contract = new Contract(CONTRACT_ID);
  const source = await server.getAccount(publicKey);

  const tx = new TransactionBuilder(source, {
    fee: "200000",
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(
      contract.call("donate", new Address(publicKey).toScVal(), nativeToScVal(String(amount), { type: "i128" }))
    )
    .setTimeout(120)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    const err = String(sim.error ?? "Simulation failed");
    if (/insufficient|balance/i.test(err)) {
      throw new WalletAppError("INSUFFICIENT_BALANCE", "Insufficient balance for donation.");
    }
    throw new Error(err);
  }

  const prepared = rpc.assembleTransaction(tx, sim).build();
  const signed = await signXdr(prepared.toXDR(), Networks.TESTNET);
  const txSigned = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    Networks.TESTNET
  ) as Transaction;

  const sendResp = await server.sendTransaction(txSigned);
  return sendResp.hash;
}

export async function waitForTx(hash: string) {
  for (let i = 0; i < 20; i += 1) {
    try {
      const tx = await server.getTransaction(hash);
      if (tx.status === rpc.Api.GetTransactionStatus.SUCCESS) return tx;
      if (tx.status === rpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Transaction failed: ${tx.resultXdr}`);
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (/Bad union switch/i.test(msg)) {
        throw new Error(
          "RPC response could not be decoded (XDR mismatch). Run `npm install @stellar/stellar-sdk@latest` and restart the dev server."
        );
      }
      throw e;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Transaction confirmation timeout");
}

/** Recent ledgers to scan for contract events (RPC requires startLedger >= 1). */
const EVENT_LEDGER_WINDOW = 5000;

export async function getRecentEvents() {
  requireContractId();
  try {
    const { sequence: latest } = await server.getLatestLedger();
    const startLedger = Math.max(1, latest - EVENT_LEDGER_WINDOW);
    const events = await server.getEvents({
      startLedger,
      endLedger: latest,
      filters: [{ type: "contract", contractIds: [CONTRACT_ID] }],
      limit: 10
    });
    return events.events ?? [];
  } catch (e) {
    console.warn("getRecentEvents:", e);
    return [];
  }
}
