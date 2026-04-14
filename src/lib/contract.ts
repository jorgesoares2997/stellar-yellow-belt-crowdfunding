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

export type TxState = "idle" | "pending" | "success" | "failed";

export type CampaignState = {
  goal: string;
  raised: string;
  donorCount: number;
  owner?: string;
};

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
    return { goal: "0", raised: "0", donorCount: 0 };
  }

  return {
    goal: String((value as any).goal ?? 0),
    raised: String((value as any).raised ?? 0),
    donorCount: Number((value as any).donor_count ?? 0),
    owner: String((value as any).owner ?? "")
  };
}

export async function donate(publicKey: string, amount: string) {
  requireContractId();
  const contract = new Contract(CONTRACT_ID);
  const source = await server.getAccount(publicKey);

  const tx = new TransactionBuilder(source, {
    fee: "200000",
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(
      contract.call("donate", new Address(publicKey).toScVal(), nativeToScVal(amount, { type: "i128" }))
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
    const tx = await server.getTransaction(hash);
    if (tx.status === rpc.Api.GetTransactionStatus.SUCCESS) return tx;
    if (tx.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed: ${tx.resultXdr}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Transaction confirmation timeout");
}

export async function getRecentEvents() {
  requireContractId();
  const events = await server.getEvents({
    startLedger: 0,
    filters: [{ type: "contract", contractIds: [CONTRACT_ID] }],
    limit: 10
  });
  return events.events ?? [];
}
