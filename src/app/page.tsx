"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ParallaxSection } from "@/components/ParallaxSection";
import { GlassButton } from "@/components/GlassButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowDown, Wallet, Zap, Users, TrendingUp, ExternalLink } from "lucide-react";
import { CONTRACT_ID } from "@/lib/config";
import {
  type TxState,
  contractIdToString,
  donate,
  getRecentEvents,
  readCampaign,
  waitForTx,
} from "@/lib/contract";
import { WalletAppError, connectWallet } from "@/lib/wallet";

interface CampaignState {
  goal: number;
  raised: number;
  donors: number;
}

interface TransactionStatus {
  state: TxState;
  message: string;
  hash?: string;
}

interface ContractEvent {
  ledger: number;
  contractId: string;
}

/* ─── Floating Nav Bar ─── */
function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className="fixed bottom-8 left-1/2 z-50 flex items-center gap-1 px-2 py-2 glass-panel-strong"
      initial={{ y: 100, x: "-50%" }}
      animate={{ y: scrolled ? 0 : 100, x: "-50%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {["Hero", "Campaign", "Donate", "Events"].map((label) => (
        <a
          key={label}
          href={`#${label.toLowerCase()}`}
          className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
        >
          {label}
        </a>
      ))}
    </motion.nav>
  );
}

/* ─── Animated Counter ─── */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className="font-mono tabular-nums">
      {display.toLocaleString()}{suffix}
    </span>
  );
}

/* ─── Hero Section ─── */
function HeroSection() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.15], [0, -80]);
  const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, hsl(42 100% 58%), transparent 70%)" }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, hsl(258 55% 52%), transparent 70%)" }}
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div className="relative z-10 max-w-5xl mx-auto px-6 text-center" style={{ opacity, y, scale }}>
        <ScrollReveal delay={0.1} direction="none">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground border border-border">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            Soroban Smart Contract · Testnet
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-extrabold leading-[0.9] tracking-tight mb-8">
            <span className="block">Yellow</span>
            <span className="block text-gradient-gold">Belt</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <p className="max-w-xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed mb-12 text-balance">
            Multi-wallet donation dApp with real-time event sync.
            Built on Stellar. Powered by Soroban.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.6}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <GlassButton variant="primary" onClick={() => document.getElementById("donate")?.scrollIntoView({ behavior: "smooth" })}>
              <Zap size={14} />
              Donate Now
            </GlassButton>
            <GlassButton variant="glass" onClick={() => document.getElementById("campaign")?.scrollIntoView({ behavior: "smooth" })}>
              Explore Campaign
              <ArrowDown size={14} />
            </GlassButton>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.8}>
          <p className="mt-12 font-mono text-[10px] text-muted-foreground/60 break-all max-w-md mx-auto">
            {CONTRACT_ID}
          </p>
        </ScrollReveal>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
          Scroll
        </span>
        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground/40 to-transparent" />
      </motion.div>
    </section>
  );
}

/* ─── Campaign Stats ─── */
function CampaignSection({ campaign }: { campaign: CampaignState }) {
  const percent = campaign.goal ? Math.min((campaign.raised / campaign.goal) * 100, 100) : 0;

  return (
    <section id="campaign" className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-6">
            Campaign Progress
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-16 max-w-2xl text-balance">
            Funding the future,
            <br />
            <span className="text-muted-foreground">one donation at a time.</span>
          </h2>
        </ScrollReveal>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border mb-16">
          {[
            { label: "Goal", value: campaign.goal, icon: TrendingUp },
            { label: "Raised", value: campaign.raised, icon: Zap, highlight: true },
            { label: "Donors", value: campaign.donors, icon: Users, suffix: "" },
          ].map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.15} direction="up">
              <div className="glass-panel p-8 md:p-12 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <stat.icon size={14} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em]">{stat.label}</span>
                </div>
                <span className={`text-3xl md:text-5xl font-display font-bold ${stat.highlight ? "text-primary" : ""}`}>
                  <AnimatedNumber value={stat.value} />
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Progress bar */}
        <ScrollReveal>
          <div className="space-y-3">
            <div className="w-full h-1 bg-border overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                whileInView={{ width: `${percent}%` }}
                transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                viewport={{ once: true }}
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <span>{percent.toFixed(1)}% funded</span>
              <span>{campaign.raised.toLocaleString()} / {campaign.goal.toLocaleString()}</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── Wallet + Donate ─── */
function DonateSection({
  walletAddress,
  walletError,
  txStatus,
  onConnect,
  onDonate,
}: {
  walletAddress: string | null;
  walletError: string | null;
  txStatus: TransactionStatus;
  onConnect: () => void;
  onDonate: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("3");

  return (
    <section id="donate" className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
          {/* Wallet */}
          <ScrollReveal direction="left">
            <div className="glass-panel p-8 md:p-12 h-full flex flex-col gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet size={14} />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em]">Wallet</span>
                {walletAddress && (
                  <span className="ml-auto w-2 h-2 bg-success rounded-full animate-pulse" />
                )}
              </div>

              <GlassButton variant="outline" onClick={onConnect}>
                {walletAddress ? "Connected" : "Connect Wallet"}
              </GlassButton>

              {walletAddress && (
                <p className="font-mono text-xs text-muted-foreground break-all leading-relaxed">
                  {walletAddress}
                </p>
              )}
              {walletError && (
                <p className="text-xs text-destructive">Error: {walletError}</p>
              )}
            </div>
          </ScrollReveal>

          {/* Donate */}
          <ScrollReveal direction="right">
            <div className="glass-panel p-8 md:p-12 h-full flex flex-col gap-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Make a Donation
              </span>

              <h3 className="text-2xl md:text-3xl font-display font-bold">
                Support this campaign
              </h3>

              <div className="flex items-stretch gap-0 mt-auto">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 px-4 py-3 bg-input border border-border text-foreground font-mono text-sm focus:outline-none focus:border-primary transition-colors"
                  min="1"
                  placeholder="Amount"
                />
                <GlassButton
                  variant="primary"
                  onClick={() => onDonate(Number(amount))}
                  disabled={!walletAddress || txStatus.state === "pending"}
                >
                  <Zap size={14} />
                  Donate
                </GlassButton>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2">
                {[1, 5, 10, 50].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-wider border transition-all ${
                      amount === String(v)
                        ? "border-primary text-primary bg-primary/5"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Transaction status */}
        <AnimatePresence>
          {txStatus.state !== "idle" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-panel p-6 mt-px flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <span
                    className={`inline-block px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
                      txStatus.state === "success"
                        ? "bg-success/10 text-success"
                        : txStatus.state === "error"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {txStatus.state}
                  </span>
                  <span className="text-sm text-secondary-foreground">{txStatus.message}</span>
                </div>
                {txStatus.hash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${txStatus.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-accent hover:text-accent/80 transition-colors"
                  >
                    View on Explorer <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─── Events Section ─── */
function EventsSection({ events }: { events: ContractEvent[] }) {
  return (
    <section id="events" className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Real-time Contract Events
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-12 text-balance">
            Live on-chain activity
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {events.length === 0 ? (
            <ScrollReveal>
              <div className="glass-panel p-6 col-span-2">
                <p className="font-mono text-sm text-muted-foreground">
                  No events yet. Connect your wallet and make a donation to see on-chain activity.
                </p>
              </div>
            </ScrollReveal>
          ) : (
            events.map((ev, i) => (
              <ScrollReveal key={i} delay={i * 0.05} direction="up">
                <motion.div
                  className="glass-panel p-6 flex items-center gap-4 group cursor-default"
                  whileHover={{ backgroundColor: "hsl(var(--card) / 0.8)" }}
                >
                  <span className="font-mono text-xs text-primary/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p className="font-mono text-sm text-foreground">
                      Ledger {ev.ledger.toLocaleString()}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      {ev.contractId}…
                    </p>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                </motion.div>
              </ScrollReveal>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Marquee ─── */
function MarqueeBand() {
  const text = "STELLAR · SOROBAN · YELLOW BELT · CROWDFUNDING · TESTNET · ";
  return (
    <ParallaxSection speed={0.1}>
      <div className="py-6 border-y border-border overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="font-display text-6xl md:text-8xl font-extrabold text-foreground/[0.03] mx-4 shrink-0">
              {text}
            </span>
          ))}
        </div>
      </div>
    </ParallaxSection>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="relative py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="section-divider mb-12" />
        <ScrollReveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <h3 className="text-2xl font-display font-bold text-gradient-gold mb-2">
                Yellow Belt
              </h3>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Crowdfunding on Stellar
              </p>
            </div>
            <div className="flex gap-6">
              <a href="https://stellar.expert" target="_blank" rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors">
                Explorer
              </a>
              <a href="https://soroban.stellar.org" target="_blank" rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors">
                Soroban
              </a>
              <a href="https://stellar.org" target="_blank" rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors">
                Stellar
              </a>
            </div>
          </div>
        </ScrollReveal>
        <div className="section-divider mt-12 mb-6" />
        <p className="font-mono text-[10px] text-muted-foreground/40 text-center">
          © 2026 Yellow Belt · Powered by Stellar Network
        </p>
      </div>
    </footer>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignState>({
    goal: 0,
    raised: 0,
    donors: 0,
  });
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    state: "idle",
    message: "Ready",
  });
  const [events, setEvents] = useState<ContractEvent[]>([]);

  const syncChainData = async (address: string) => {
    const [campaignData, eventData] = await Promise.all([readCampaign(address), getRecentEvents()]);
    const normalized: CampaignState = {
      goal: Number(campaignData.goal),
      raised: Number(campaignData.raised),
      donors: Number(campaignData.donors),
    };
    setCampaign(normalized);
    setEvents(
      eventData
        .slice(-8)
        .reverse()
        .map((e: any) => ({
          ledger: Number(e.ledger ?? 0),
          contractId: contractIdToString(e.contractId).slice(0, 12),
        }))
    );
  };

  const handleConnect = async () => {
    setWalletError(null);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      await syncChainData(address);
    } catch (error: any) {
      const walletErr = error as WalletAppError;
      setWalletError(`${walletErr.code ?? "UNKNOWN"}: ${walletErr.message}`);
      setTxStatus({ state: "error", message: walletErr.message || "Wallet connection failed." });
    }
  };

  const handleDonate = async (amount: number) => {
    if (!walletAddress) {
      setTxStatus({ state: "error", message: "Connect wallet first." });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setTxStatus({ state: "error", message: "Enter a valid donation amount." });
      return;
    }
    try {
      setTxStatus({ state: "pending", message: "Submitting donation transaction..." });
      const hash = await donate(walletAddress, amount);
      setTxStatus({ state: "pending", message: "Waiting for confirmation...", hash });
      await waitForTx(hash);
      setTxStatus({ state: "success", message: "Donation confirmed on testnet.", hash });
      await syncChainData(walletAddress);
    } catch (error: any) {
      setTxStatus({ state: "error", message: String(error?.message ?? "Transaction failed.") });
    }
  };

  useEffect(() => {
    if (!walletAddress) return;
    const interval = setInterval(() => {
      syncChainData(walletAddress).catch(() => undefined);
    }, 8000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  return (
    <div className="relative grain">
      <ThemeToggle />
      <FloatingNav />

      <HeroSection />

      <MarqueeBand />

      <ParallaxSection speed={0.15}>
        <CampaignSection campaign={campaign} />
      </ParallaxSection>

      <div className="section-divider mx-6 max-w-5xl lg:mx-auto" />

      <DonateSection
        walletAddress={walletAddress}
        walletError={walletError}
        txStatus={txStatus}
        onConnect={handleConnect}
        onDonate={handleDonate}
      />

      <MarqueeBand />

      <ParallaxSection speed={0.2}>
        <EventsSection events={events} />
      </ParallaxSection>

      <Footer />
    </div>
  );
}
