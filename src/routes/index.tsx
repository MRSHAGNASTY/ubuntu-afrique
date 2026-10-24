import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Clock, Coins, TrendingUp, Users, Trophy, Flame, Mountain, Zap, Droplet, ShieldCheck, Factory, Calculator, Lock, Info } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Header />
      <Hero />
      <MineSection />
      <OfferingSection />
      <DividendSection />
      <ScenarioSection />
      <ScenarioCharts />
      <DividendCalculator />
      <AffiliateSection />
      <DisclaimerSection />
      <CTASection />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <a href="#" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gold-gradient text-primary-foreground font-display font-bold shadow-[var(--shadow-gold)]">
            UA
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-gold">
            Ubuntu Afrique
          </span>
        </a>
        <nav className="hidden gap-8 md:flex">
          <a href="#mine" className="text-sm text-muted-foreground transition-colors hover:text-gold">Mine</a>
          <a href="#offering" className="text-sm text-muted-foreground transition-colors hover:text-gold">Offering</a>
          <a href="/dashboard/cards" className="text-sm text-muted-foreground transition-colors hover:text-gold">Cards</a>
          <a href="/dashboard/invest" className="text-sm text-muted-foreground transition-colors hover:text-gold">Fractions</a>
          <a href="/marketplace" className="text-sm text-muted-foreground transition-colors hover:text-gold">Marketplace</a>
        </nav>
        <a
          href="/auth/login"
          className="rounded-md border border-gold px-4 py-2 text-sm font-semibold text-gold transition-all hover:bg-gold-gradient hover:text-primary-foreground hover:border-transparent sheen"
        >
          Sign In
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden ore-grain"
      style={{ backgroundImage: "var(--gradient-hero)" }}
    >
      {/* Ambient drifting ore glow */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-gold/20 blur-[120px] ore-drift" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full blur-[120px] ore-drift" style={{ animationDelay: "-6s", background: "color-mix(in oklab, var(--gold-deep) 35%, transparent)" }} />

      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-24 md:grid-cols-2 md:py-32">
        <div className="reveal-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold ring-1 ring-gold/30">
            <Flame className="h-3.5 w-3.5 animate-pulse" /> Named open
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] md:text-7xl">
            Own a Piece of
            <span className="block text-shimmer">Ubuntu Afrique.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Ubuntu Afrique on its own book: Corporate Differential Gap Cover, then named-open
            Cards, $10 Fractions, and Marketplace. NFT records stay closed until 1,400,000
            Aureus shares are sold and named.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/dashboard/invest"
              className="inline-flex items-center gap-2 rounded-md bg-gold-gradient px-6 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-gold)] transition-transform hover:-translate-y-0.5 glow-gold sheen"
            >
              Buy $10 Fractions <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/dashboard/cards"
              className="inline-flex items-center gap-2 rounded-md border border-gold/50 px-6 py-3 font-semibold text-gold transition-colors hover:bg-gold/10 sheen"
            >
              Buy a Card
            </a>
            <a
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-md border border-gold/50 px-6 py-3 font-semibold text-gold transition-colors hover:bg-gold/10 sheen"
            >
              Marketplace
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
            <Stat value="$10" label="Fraction Unit" />
            <Stat value="100k" label="Underlying Allocation" />
            <Stat value="SSA–VP" label="One Rank Engine" />
          </div>

        </div>

        <div className="relative reveal-up" style={{ animationDelay: "120ms" }}>
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gold/15 blur-3xl ore-drift" />
          <div className="rounded-3xl border border-gold/20 bg-surface/70 p-8 backdrop-blur hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Offering Snapshot
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-gold">
                <span className="relative h-2 w-2 rounded-full bg-gold pulse-dot" /> Live
              </span>
            </div>

            <div className="mt-8 space-y-6">
              <SnapshotRow label="Underlying Allocation" value="100,000 shares" />
              <SnapshotRow label="Phase 10 Basis" value="$100 / full share" muted />
              <SnapshotRow label="Fraction Price" value="$10" highlight />
              <SnapshotRow label="Original Liability" value="$10,000,000" />
              <SnapshotRow label="Commerce modules" value="CARD · FRACTION · MARKETPLACE open" />
            </div>

            <div className="mt-8 rounded-xl bg-gold/10 p-5 ring-1 ring-gold/20">
              <p className="text-sm text-gold">
                $10 Fractions convert against the current Aureus phase. Historical ownership
                does not recalculate when the phase moves.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold text-gold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/50 pb-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`font-display text-xl font-semibold ${
          highlight ? "text-gold" : muted ? "text-muted-foreground line-through" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function OfferingSection() {
  return (
    <section id="offering" className="border-y border-border bg-surface/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">
            The Offering
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            The Math Is Simple.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A transparent, fixed-window offering built for accessibility and clarity.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <OfferingCard
            step="01"
            title="Allocation Basis"
            equation="100,000 × $100"
            result="$10,000,000"
            note="Original Ubuntu Afrique liability at Phase 10. It does not rise when Aureus phases up."
          />
          <OfferingCard
            step="02"
            title="Fixed Fraction"
            equation="Current Aureus price ÷ $10"
            result="$10 Unit"
            note="Fraction price stays $10. Phase price only changes how much of a full share $10 buys."
            highlight
          />
          <OfferingCard
            step="03"
            title="Named-open modules"
            equation="Cards · $10 Fractions · Marketplace"
            result="Open"
            note="NFT production trading stays off until all 1,400,000 Aureus shares are sold and named."
          />
        </div>
      </div>
    </section>
  );
}

function OfferingCard({
  step,
  title,
  equation,
  result,
  note,
  highlight,
}: {
  step: string;
  title: string;
  equation: string;
  result: string;
  note: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-8 hover-lift sheen ${
        highlight
          ? "border-gold/60 bg-gold/5 shadow-[var(--shadow-gold)]"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="font-display text-sm font-bold text-gold">{step}</span>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-6 font-display text-2xl font-semibold">{title}</h3>
      <div className="mt-4 text-sm text-muted-foreground">{equation}</div>
      <div className="mt-2 font-display text-3xl font-bold text-gold">{result}</div>
      <p className="mt-6 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function AffiliateSection() {
  return (
    <section id="affiliate" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 md:grid-cols-[1fr,1.2fr]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">
              Affiliate Compensation
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
              Get Rewarded for
              <span className="block text-gold">Growing the Network.</span>
            </h2>
            <p className="mt-6 text-muted-foreground">
              One Corporate Rank engine and one Gap Cover engine. Entitlements are maxima,
              compress when ranks are missing, and never invent a second plan.
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
              <Coins className="h-5 w-5 text-gold" />
              <p className="text-sm text-foreground">
                All commissions paid in <span className="font-semibold text-gold">USDT</span>{" "}
                with additional bonus in fractional shares.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <AffiliateCard
              icon={Users}
              tag="SSA"
              title="Shares Sales Associate"
              percent="10%"
              description="Entry entitlement. Qualifying volume and activation are set by management."
            />
            <AffiliateCard
              icon={Trophy}
              tag="ASM–SSM"
              title="Compressed Gap"
              percent="16–23%"
              description="ASM 16%, BSM 20%, SSM 23%. Missing ranks compress. Unclaimed gap is not redistributed."
            />
            <AffiliateCard
              icon={TrendingUp}
              tag="VP"
              title="Vice President"
              percent="25%"
              description="Maximum standard Gap Cover. Cards, Fractions, and Marketplace are named-open. NFT stays Coming Soon."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AffiliateCard({
  icon: Icon,
  tag,
  title,
  percent,
  subPercent,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  percent: string;
  subPercent?: string;
  description: string;
}) {
  return (
    <div className="group relative flex items-center gap-6 overflow-hidden rounded-2xl border border-border bg-card p-6 hover-lift sheen hover:border-gold/50 hover:bg-gold/5">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gold-gradient text-primary-foreground shadow-[var(--shadow-gold)] transition-transform group-hover:scale-110">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {tag}
        </span>
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="text-right">
        <div className="font-display text-4xl font-bold text-shimmer">{percent}</div>
        {subPercent && (
          <div className="text-xs font-semibold text-gold-soft">{subPercent} Shares</div>
        )}
      </div>
    </div>
  );
}

function CTASection() {
  return (
    <section id="contact" className="border-t border-border bg-surface/40 py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">
          Named-open commerce
        </span>
        <h2 className="mt-4 font-display text-4xl font-bold md:text-6xl">
          100,000 Shares. $10 Fractions.
          <span className="block text-gold">Cards and Marketplace open.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
          Buy a $10 fraction, a card, or a marketplace order on the Ubuntu book. Send USDT on BSC,
          paste the hash, then Johan Verify & Approve. This does not mint Aureus shares. NFT stays closed.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/dashboard/invest"
            className="inline-flex items-center gap-2 rounded-md bg-gold-gradient px-8 py-4 font-semibold text-primary-foreground shadow-[var(--shadow-gold)] transition-transform hover:-translate-y-0.5 glow-gold sheen"
          >
            Buy $10 Fractions <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="/dashboard/cards"
            className="inline-flex items-center gap-2 rounded-md border border-gold/50 px-8 py-4 font-semibold text-gold transition-colors hover:bg-gold/10 sheen"
          >
            Buy a Card
          </a>
          <a
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-md border border-gold/50 px-8 py-4 font-semibold text-gold transition-colors hover:bg-gold/10 sheen"
          >
            Marketplace
          </a>
        </div>
      </div>
    </section>
  );
}

function MineSection() {
  const assets = [
    { icon: Mountain, title: "Secured Land", desc: "Fully permitted mining ground in Kadoma, Zimbabwe." },
    { icon: ShieldCheck, title: "On-Site Security", desc: "24/7 protection for staff, plant and gold recovery." },
    { icon: Factory, title: "100 t/h Wash Plant", desc: "Operational plant capable of yielding 1kg of gold per day." },
    { icon: Droplet, title: "5 Boreholes", desc: "Independent water supply already installed and tested." },
    { icon: Users, title: "Trained Workforce", desc: "Full operations team on the ground and ready to run." },
    { icon: Zap, title: "Power Needed", desc: "Capital raised funds generators & diesel for 10 hrs/day." },
  ];
  return (
    <section id="mine" className="relative border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 md:grid-cols-[1fr,1.4fr]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">
              The Purpose
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
              Funding the Aureus Alliance
              <span className="block text-gold">Holdings Mine — Kadoma.</span>
            </h2>
            <p className="mt-6 text-muted-foreground">
              Capital raised through this offering funds the running expenses of the
              Aureus Alliance Holdings gold mine in Kadoma, Zimbabwe. The site is fully
              secured, staffed and equipped — the capital unlocks daily production.
            </p>
            <p className="mt-4 text-muted-foreground">
              The goal: five additional plants operational by <span className="text-gold font-semibold">December 2026</span>,
              expanding output to 10 plants running in parallel.
            </p>
            <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-6">
              <p className="text-sm text-muted-foreground">Established Backing</p>
              <p className="mt-2 font-display text-xl text-foreground">
                <span className="text-gold">Ubuntu Afrique</span> — Corporate Differential
                Gap Cover, Cards, Fractional Shares, Marketplace, and NFT Share records.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {assets.map((a) => (
              <div
                key={a.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover-lift sheen hover:border-gold/50 hover:bg-gold/5"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold-gradient text-primary-foreground shadow-[var(--shadow-gold)] transition-transform group-hover:rotate-6 group-hover:scale-110">
                  <a.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{a.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DividendSection() {
  const rows = [
    { label: "Gold per day (per plant, projected)", value: "~1 kg" },
    { label: "Operating days per month", value: "22.4" },
    { label: "Plants at full scale", value: "10" },
    { label: "Projected monthly output", value: "~224 kg" },
    { label: "Projected annual output (× 12)", value: "~2,688 kg" },
    { label: "Gold price (per kg, indicative)", value: "$130,000" },
    { label: "Projected gross annual revenue", value: "~$349,440,000" },
    { label: "Less 50% (opex, tax, refinery)", value: "−$174,720,000", muted: true },
    { label: "Projected distributable profit", value: "~$174,720,000", highlight: true },
    { label: "Total shares issued", value: "1,400,000" },
    { label: "Projected dividend per full share / yr", value: "~$124.80", highlight: true },
  ];
  return (
    <section id="dividends" className="border-y border-border bg-surface/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">
            Dividend Illustration
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            How the Numbers Flow.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A <span className="text-foreground">projection</span> based on 10 plants at full production. Actual
            output and returns may be higher or lower depending on gold recovery
            grades, gold spot price, plant uptime, diesel and energy costs,
            regulatory factors and the pace of expansion.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.3fr,1fr]">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-gold" />
              <h3 className="font-display text-xl font-semibold">Annual Production Model</h3>
            </div>
            <div className="mt-6 divide-y divide-border/60">
              {rows.map((r) => (
                <div key={r.label} className="flex items-baseline justify-between py-3">
                  <span className="text-sm text-muted-foreground">{r.label}</span>
                  <span
                    className={`font-display text-lg font-semibold tabular-nums ${
                      r.highlight ? "text-gold" : r.muted ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-gold/40 bg-gold/5 p-8 shadow-[var(--shadow-gold)]">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">
                Ubuntu Afrique Allocation
              </span>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>
                  100,000 shares × <span className="text-foreground font-semibold">~$124.80</span> ≈{" "}
                  <span className="text-foreground font-semibold">~$12,480,000</span> in projected annual dividends.
                </p>
                <p>
                  Fractionalised from 100,000 underlying shares at a $10 unit:
                </p>
              </div>
              <div className="mt-6 rounded-xl bg-background/40 p-6 text-center">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Projected Per Fractional Share / Year
                </div>
                <div className="mt-2 font-display text-5xl font-bold text-shimmer tabular-nums">
                  ~$24.96
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Projection only — may be more or lower; grows as new mines are acquired.
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-gold" />
                <h3 className="font-display text-lg font-semibold">12-Month Lock-Up</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Each share purchased is locked for 12 months. First dividend distribution
                begins <span className="text-gold font-semibold">July 2027</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type Scenario = {
  key: string;
  name: string;
  tagline: string;
  kgPerDay: number;
  pricePerKg: number;
  plants: number;
  tone: "conservative" | "base" | "optimistic";
};

const SCENARIOS: Scenario[] = [
  {
    key: "conservative",
    name: "Conservative",
    tagline: "Lower recovery, softer gold price, slower rollout",
    kgPerDay: 0.7,
    pricePerKg: 110_000,
    plants: 8,
    tone: "conservative",
  },
  {
    key: "base",
    name: "Base Case",
    tagline: "Target model — 10 plants at design capacity",
    kgPerDay: 1.0,
    pricePerKg: 130_000,
    plants: 10,
    tone: "base",
  },
  {
    key: "optimistic",
    name: "Optimistic",
    tagline: "Higher grade, stronger spot price, full 10-plant fleet",
    kgPerDay: 1.2,
    pricePerKg: 150_000,
    plants: 10,
    tone: "optimistic",
  },
];

const DAYS_PER_MONTH = 22.4;
const MONTHS = 12;
const OPEX_RATIO = 0.5; // 50% opex / tax / refinery
const JJ_SHARES = 100_000;
const TOTAL_SHARES = 1_400_000;
const FRACTIONAL_SHARES = 1_000_000;

function computeScenario(s: Scenario) {
  const annualKg = s.kgPerDay * DAYS_PER_MONTH * MONTHS * s.plants;
  const grossRevenue = annualKg * s.pricePerKg;
  const distributable = grossRevenue * (1 - OPEX_RATIO);
  const jjDividend = distributable * (JJ_SHARES / TOTAL_SHARES);
  const perFractional = jjDividend / FRACTIONAL_SHARES;
  const yieldPct = (perFractional / 10) * 100; // $10 cost basis
  return { annualKg, grossRevenue, distributable, jjDividend, perFractional, yieldPct };
}

function fmtUsd(n: number, digits = 0) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}

function ScenarioSection() {
  return (
    <section id="scenarios" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">
            Scenario Projections
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            Higher, Lower — What the Range Looks Like.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dividends move with gold recovered per day, the spot price of gold and how
            many plants are online. These three scenarios show what a fractional share
            could earn per year across a conservative, base and optimistic outlook.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {SCENARIOS.map((s) => {
            const r = computeScenario(s);
            const isBase = s.tone === "base";
            return (
              <div
                key={s.key}
                className={`relative flex flex-col rounded-2xl border p-8 hover-lift sheen ${
                  isBase
                    ? "border-gold/50 bg-gold/5 shadow-[var(--shadow-gold)]"
                    : "border-border bg-card"
                }`}
              >
                {isBase && (
                  <span className="absolute -top-3 left-8 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
                    Target
                  </span>
                )}
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-xl font-semibold">{s.name}</h3>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-widest ${
                      s.tone === "optimistic"
                        ? "text-emerald-400"
                        : s.tone === "conservative"
                          ? "text-muted-foreground"
                          : "text-gold"
                    }`}
                  >
                    {s.tone}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{s.tagline}</p>

                <dl className="mt-6 space-y-2 border-t border-border/60 pt-4 text-sm">
                  <Row label="Gold / day / plant" value={`${s.kgPerDay} kg`} />
                  <Row label="Plants online" value={`${s.plants}`} />
                  <Row label="Gold price / kg" value={fmtUsd(s.pricePerKg)} />
                  <Row label="Annual output" value={`~${Math.round(r.annualKg).toLocaleString()} kg`} />
                  <Row label="Gross revenue" value={`~${fmtUsd(r.grossRevenue)}`} />
                  <Row
                    label="Distributable (50%)"
                    value={`~${fmtUsd(r.distributable)}`}
                  />
                </dl>

                <div
                  className={`mt-6 rounded-xl p-5 text-center ${
                    isBase ? "bg-background/40" : "bg-surface/60"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Projected / Fractional Share / Yr
                  </div>
                  <div className="mt-1 font-display text-4xl font-bold text-gold tabular-nums">
                    ~${r.perFractional.toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    ≈ {r.yieldPct.toFixed(1)}% annual yield on $10 cost
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-muted-foreground">
          All figures are projections, not guarantees. Actual results depend on gold
          grade and recovery, spot price, plant uptime, diesel and energy costs,
          regulatory conditions and the pace at which additional plants and mines
          come online. Returns may be higher or lower than shown.
        </p>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-display font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function DisclaimerSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-2xl border border-border bg-card/60 p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gold/10 ring-1 ring-gold/30">
              <Info className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Important — Nature of the Shares
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Aureus Alliance Holdings shares are <span className="text-foreground">not a security</span> and{" "}
                <span className="text-foreground">not an investment product</span>. You are purchasing a share in
                the holdings company and are therefore entitled to dividends drawn from the
                profits of the operation. Ownership is generational — passing to you, your
                children, and potentially theirs. As the company expands and acquires
                additional mines, dividends are expected to grow beyond the illustrative
                <span className="text-gold font-semibold"> $24.96</span> per fractional share figure shown above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


// ============ Scenario Charts ============
function ScenarioCharts() {
  const rows = SCENARIOS.map((s) => ({ s, r: computeScenario(s) }));
  const metrics = [
    {
      key: "annualKg",
      label: "Annual Gold Output",
      unit: "kg",
      fmt: (v: number) => `${Math.round(v).toLocaleString()} kg`,
    },
    {
      key: "grossRevenue",
      label: "Gross Revenue",
      unit: "USD",
      fmt: (v: number) => fmtUsd(v),
    },
    {
      key: "perFractional",
      label: "Dividend / Fractional Share / Yr",
      unit: "USD",
      fmt: (v: number) => `$${v.toFixed(2)}`,
    },
  ] as const;

  const toneColor = (t: Scenario["tone"]) =>
    t === "optimistic"
      ? "bg-emerald-400/80"
      : t === "conservative"
        ? "bg-muted-foreground/60"
        : "bg-gold";

  return (
    <section id="charts" className="py-24 bg-surface/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">
            Visual Comparison
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            Scenarios Side by Side.
          </h2>
          <p className="mt-4 text-muted-foreground">
            The same three outlooks — conservative, base and optimistic — plotted
            across the metrics that matter most to a fractional shareholder.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {metrics.map((m) => {
            const values = rows.map((r) => r.r[m.key as keyof ReturnType<typeof computeScenario>] as number);
            const max = Math.max(...values);
            return (
              <div key={m.key} className="rounded-2xl border border-border bg-card p-6">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {m.label}
                </div>
                <div className="mt-1 font-display text-sm text-foreground/80">per year</div>

                <div className="mt-6 space-y-5">
                  {rows.map(({ s, r }) => {
                    const v = r[m.key as keyof typeof r] as number;
                    const pct = max > 0 ? (v / max) * 100 : 0;
                    return (
                      <div key={s.key}>
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-semibold uppercase tracking-widest text-muted-foreground">
                            {s.name}
                          </span>
                          <span className="font-display text-sm font-semibold tabular-nums text-foreground">
                            {m.fmt(v)}
                          </span>
                        </div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-background/70 ring-1 ring-border">
                          <div
                            className={`h-full ${toneColor(s.tone)} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-muted-foreground">
          Bars are scaled to the largest value in each chart. Projections only —
          actual outcomes depend on gold grade, recovery, spot price, uptime and
          rollout pace.
        </p>
      </div>
    </section>
  );
}

// ============ Interactive Dividend Calculator ============
function DividendCalculator() {
  const [kgPerDay, setKgPerDay] = useState(1.0);
  const [pricePerKg, setPricePerKg] = useState(130_000);
  const [daysPerMonth, setDaysPerMonth] = useState(22);
  const [plants, setPlants] = useState(10);

  const compute = (kgFactor: number, priceFactor: number) => {
    const annualKg = kgPerDay * kgFactor * daysPerMonth * MONTHS * plants;
    const grossRevenue = annualKg * pricePerKg * priceFactor;
    const distributable = grossRevenue * (1 - OPEX_RATIO);
    const jjDividend = distributable * (JJ_SHARES / TOTAL_SHARES);
    const perFractional = jjDividend / FRACTIONAL_SHARES;
    const yieldPct = (perFractional / 10) * 100;
    return { annualKg, grossRevenue, distributable, perFractional, yieldPct };
  };

  const conservative = compute(0.8, 0.9);
  const base = compute(1, 1);
  const optimistic = compute(1.15, 1.1);

  const cards = [
    { name: "Conservative", tone: "conservative" as const, r: conservative, note: "kg × 0.80  ·  price × 0.90" },
    { name: "Base Case", tone: "base" as const, r: base, note: "your inputs, as entered" },
    { name: "Optimistic", tone: "optimistic" as const, r: optimistic, note: "kg × 1.15  ·  price × 1.10" },
  ];

  const toneRing = (t: "conservative" | "base" | "optimistic") =>
    t === "optimistic"
      ? "border-emerald-400/40 bg-emerald-400/5"
      : t === "conservative"
        ? "border-border bg-card"
        : "border-gold/50 bg-gold/5 shadow-[var(--shadow-gold)]";

  const toneText = (t: "conservative" | "base" | "optimistic") =>
    t === "optimistic" ? "text-emerald-400" : t === "conservative" ? "text-muted-foreground" : "text-gold";

  return (
    <section id="calculator" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">
            Interactive Model
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            Build Your Own Projection.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Adjust gold per day, gold price, plant uptime and number of plants.
            The conservative, base and optimistic dividend estimates update live.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-5">
          {/* Controls */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-8">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-gold" />
              <h3 className="font-display text-lg font-semibold">Inputs</h3>
            </div>

            <div className="mt-6 space-y-6">
              <Slider
                label="Gold / day / plant"
                value={kgPerDay}
                min={0.3}
                max={1.5}
                step={0.05}
                onChange={setKgPerDay}
                display={`${kgPerDay.toFixed(2)} kg`}
              />
              <Slider
                label="Gold price"
                value={pricePerKg}
                min={80_000}
                max={180_000}
                step={1_000}
                onChange={setPricePerKg}
                display={`${fmtUsd(pricePerKg)} / kg`}
              />
              <Slider
                label="Operating days / month"
                value={daysPerMonth}
                min={10}
                max={30}
                step={1}
                onChange={setDaysPerMonth}
                display={`${daysPerMonth} days`}
              />
              <Slider
                label="Plants online"
                value={plants}
                min={1}
                max={15}
                step={1}
                onChange={setPlants}
                display={`${plants} plant${plants === 1 ? "" : "s"}`}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setKgPerDay(1.0);
                setPricePerKg(130_000);
                setDaysPerMonth(22);
                setPlants(10);
              }}
              className="mt-8 w-full rounded-lg border border-border bg-background/60 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-gold hover:border-gold/40 transition"
            >
              Reset to Base Case
            </button>
          </div>

          {/* Live results */}
          <div className="lg:col-span-3 space-y-4">
            {cards.map((c) => {
              const maxPer = Math.max(conservative.perFractional, base.perFractional, optimistic.perFractional);
              const pct = maxPer > 0 ? (c.r.perFractional / maxPer) * 100 : 0;
              return (
                <div key={c.name} className={`rounded-2xl border p-6 ${toneRing(c.tone)}`}>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className={`text-[10px] font-semibold uppercase tracking-widest ${toneText(c.tone)}`}>
                        {c.name}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{c.note}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-3xl font-bold text-gold tabular-nums">
                        ${c.r.perFractional.toFixed(2)}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        per share / yr · {c.r.yieldPct.toFixed(1)}% yield
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/70 ring-1 ring-border">
                    <div
                      className={`h-full transition-all duration-500 ${
                        c.tone === "optimistic"
                          ? "bg-emerald-400/80"
                          : c.tone === "conservative"
                            ? "bg-muted-foreground/60"
                            : "bg-gold"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                    <MiniStat label="Annual kg" value={`${Math.round(c.r.annualKg).toLocaleString()}`} />
                    <MiniStat label="Gross rev." value={fmtUsd(c.r.grossRevenue)} />
                    <MiniStat label="Distributable" value={fmtUsd(c.r.distributable)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-muted-foreground">
          Illustrative model. 50% of gross revenue is reserved for operating costs,
          tax and refinery. Ubuntu Afrique holds {JJ_SHARES.toLocaleString()} of{" "}
          {TOTAL_SHARES.toLocaleString()} total Aureus Alliance Holdings shares,
          distributed across {FRACTIONAL_SHARES.toLocaleString()} fractional shares.
        </p>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </label>
        <span className="font-display text-sm font-semibold tabular-nums text-gold">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-[var(--gold)]"
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/50 p-3 ring-1 ring-border">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-sm font-semibold tabular-nums text-foreground truncate">
        {value}
      </div>
    </div>
  );
}



function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gold text-primary-foreground font-display text-sm font-bold">
            UA
          </span>
          <span className="font-display font-semibold text-gold">Ubuntu Afrique</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ubuntu Afrique. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
