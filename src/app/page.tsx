"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CampaignState,
  TxState,
  donate,
  getRecentEvents,
  readCampaign,
  waitForTx
} from "@/lib/contract";
import { WalletAppError, connectWallet } from "@/lib/wallet";
import { CONTRACT_ID } from "@/lib/config";

type Status = { kind: TxState; message: string; hash?: string };

const initialCampaign: CampaignState = { goal: "0", raised: "0", donorCount: 0 };

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [campaign, setCampaign] = useState<CampaignState>(initialCampaign);
  const [amount, setAmount] = useState("1");
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "Ready" });
  const [events, setEvents] = useState<string[]>([]);
  const [errorCode, setErrorCode] = useState("");

  const progress = useMemo(() => {
    const goal = Number(campaign.goal || 0);
    const raised = Number(campaign.raised || 0);
    if (!goal) return 0;
    return Math.min(100, Math.round((raised / goal) * 100));
  }, [campaign]);

  const syncData = async (source: string) => {
    const [campaignData, eventData] = await Promise.all([readCampaign(source), getRecentEvents()]);
    setCampaign(campaignData);
    setEvents(
      eventData
        .slice(-8)
        .reverse()
        .map((e: any) => `${e.ledger || "?"}: ${e.type} ${e.contractId?.slice(0, 12) || ""}`)
    );
  };

  const onConnect = async () => {
    setErrorCode("");
    try {
      const pk = await connectWallet();
      setWallet(pk);
      await syncData(pk);
    } catch (error: any) {
      const walletError = error as WalletAppError;
      setErrorCode(walletError.code || "UNKNOWN");
      setStatus({ kind: "failed", message: walletError.message || "Wallet connection failed" });
    }
  };

  const onDonate = async () => {
    if (!wallet) return;
    setErrorCode("");
    try {
      setStatus({ kind: "pending", message: "Submitting donation transaction..." });
      const hash = await donate(wallet, amount);
      setStatus({ kind: "pending", message: "Waiting for confirmation...", hash });
      await waitForTx(hash);
      setStatus({ kind: "success", message: "Donation confirmed on testnet.", hash });
      await syncData(wallet);
    } catch (error: any) {
      const message = String(error?.message || "Transaction failed");
      const code = (error as WalletAppError).code ?? "UNKNOWN";
      setErrorCode(code);
      setStatus({ kind: "failed", message });
    }
  };

  useEffect(() => {
    if (!wallet) return;
    const id = setInterval(() => {
      syncData(wallet).catch(() => undefined);
    }, 8000);
    return () => clearInterval(id);
  }, [wallet]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <section className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur">
        <h1 className="text-3xl font-bold">Yellow Belt Crowdfunding</h1>
        <p className="mt-2 text-sm text-white/70">
          Multi-wallet donation dApp with Soroban contract calls and real-time event sync.
        </p>
        <p className="mt-3 text-xs text-white/60 break-all">
          Contract: {CONTRACT_ID || "Set NEXT_PUBLIC_CONTRACT_ID in .env.local"}
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
          <h2 className="font-semibold">Wallet</h2>
          <button
            onClick={onConnect}
            className="mt-3 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400"
          >
            Connect Wallet (Multi-wallet modal)
          </button>
          <p className="mt-3 text-xs break-all text-white/70">{wallet || "Not connected"}</p>
          <p className="mt-2 text-xs text-rose-300">
            Error type: {errorCode || "none"} (required: WALLET_NOT_FOUND / WALLET_REJECTED /
            INSUFFICIENT_BALANCE)
          </p>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
          <h2 className="font-semibold">Campaign State</h2>
          <p className="mt-2 text-sm">Goal: {campaign.goal}</p>
          <p className="text-sm">Raised: {campaign.raised}</p>
          <p className="text-sm">Donors: {campaign.donorCount}</p>
          <div className="mt-3 h-3 overflow-hidden rounded bg-white/10">
            <div className="h-full bg-emerald-400" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/70">{progress}% funded</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-5">
        <h2 className="font-semibold">Donate</h2>
        <div className="mt-3 flex gap-3">
          <input
            className="w-40 rounded-lg border border-white/20 bg-transparent px-3 py-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="1"
          />
          <button
            disabled={!wallet || status.kind === "pending"}
            onClick={onDonate}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Donate
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-5">
        <h2 className="font-semibold">Transaction Status</h2>
        <p className="mt-2 text-sm">
          State: <strong>{status.kind}</strong>
        </p>
        <p className="text-sm text-white/80">{status.message}</p>
        {status.hash && (
          <a
            className="mt-2 block text-xs text-sky-300 underline"
            target="_blank"
            rel="noreferrer"
            href={`https://stellar.expert/explorer/testnet/tx/${status.hash}`}
          >
            View transaction hash
          </a>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-5">
        <h2 className="font-semibold">Real-time Contract Events</h2>
        <ul className="mt-3 space-y-1 text-xs text-white/70">
          {events.length ? events.map((e) => <li key={e}>{e}</li>) : <li>No events yet.</li>}
        </ul>
      </section>
    </main>
  );
}
