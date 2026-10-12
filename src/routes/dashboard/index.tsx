import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, Layers, Trophy, Wallet } from "lucide-react";
import { auth, ubuntuDb } from "../../lib/supabase";
import { loadUbuntuStaffMe } from "../../lib/ubuntuAdminClient";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

type MemberOverview = {
  ok: boolean;
  error?: string;
  book?: string;
  checkoutEnabled: boolean;
  userId?: string;
  username?: string;
  email?: string;
  currentRank?: string;
  wallet?: { available: string; credits: string; reversals: string; byType: Record<string, string> };
  cards?: { paidCount: number; paidTotal: string };
  fractions?: { quantity: number; underlying: string };
  volume?: { personalQv: string; teamQv: string; monthlyTeamQv: string };
  progress?: {
    currentRank: string;
    nextRank: string | null;
    entitlement: string;
    progress: {
      teamVolume: { have: string; need: string; met: boolean };
      teamMembers: { have: number; need: number; met: boolean };
      qualifiedLegs: { have: number; need: number; requiredRank: string | null; met: boolean };
    };
  };
};

function DashboardPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<MemberOverview | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState("Member");
  const [loading, setLoading] = useState(true);
  const [aureusReadOnlyNote, setAureusReadOnlyNote] = useState(false);
  const [kycStatus, setKycStatus] = useState("NONE");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    localStorage.removeItem("auth_token");
    navigate({ to: "/" });
  };

  const fetchDashboardData = async () => {
    try {
      const current = await auth.getCurrentUser();
      if (!current.user) {
        navigate({ to: "/auth/login" });
        return;
      }

      if (current.identitySource === "aureus") {
        setAureusReadOnlyNote(true);
        setDisplayName(current.profile?.username || current.user.email || "Member");
      } else {
        setDisplayName(current.user.email || "Member");
      }
      const staff = await loadUbuntuStaffMe();
      setIsAdmin(staff.ok && staff.roles.length > 0);

      let token = typeof localStorage !== "undefined" ? localStorage.getItem("ua_session") || localStorage.getItem("auth_token") : null;
      if (!token) {
        const { data } = await ubuntuDb.auth.getSession();
        token = data.session?.access_token || null;
      }
      if (!token) {
        navigate({ to: "/auth/login" });
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [res, kycRes] = await Promise.all([
        fetch("/api/member/ledger", { headers }),
        fetch("/api/member/kyc", { headers }),
      ]);
      const json = await res.json();
      const kycJson = await kycRes.json().catch(() => null);
      setKycStatus(String(kycJson?.kyc?.status || "NONE"));
      setOverview({
        ok: Boolean(json.ok),
        error: json.error,
        book: json.book,
        checkoutEnabled: json.checkoutEnabled === true,
        userId: json.userId,
        username: json.username,
        email: json.email,
        currentRank: json.currentRank,
        wallet: json.wallet,
        cards: json.cards,
        fractions: json.fractions,
        volume: json.volume,
        progress: json.progress,
      });
      if (json.username) setDisplayName(json.username);
    } catch (error) {
      console.error("Failed to fetch Ubuntu member ledger", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const missingBook = !overview?.ok;
  const progress = overview?.progress;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-gold-gradient text-primary-foreground font-display font-bold shadow-[var(--shadow-gold)]">
              UA
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-gold">
              Ubuntu Afrique
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="text-sm font-medium text-gold">Dashboard</a>
            <a href="/dashboard/network" className="text-sm text-muted-foreground hover:text-foreground">Network</a>
            <a href="/dashboard/wallet" className="text-sm text-muted-foreground hover:text-foreground">Wallet</a>
            <a href="/dashboard/orders" className="text-sm text-muted-foreground hover:text-foreground">Orders</a>
            <a href="/dashboard/cards" className="text-sm text-muted-foreground hover:text-foreground">Cards</a>
            <a href="/dashboard/invest" className="text-sm text-muted-foreground hover:text-foreground">Fractions</a>
            <a href="/dashboard/pay" className="text-sm text-muted-foreground hover:text-foreground">Pay</a>
            <a href="/dashboard/kyc" className="text-sm text-muted-foreground hover:text-foreground">KYC</a>
            <a href="/dashboard/notifications" className="text-sm text-muted-foreground hover:text-foreground">Notifications</a>
            <a href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">Marketplace</a>
            <a href="/dashboard/nft" className="text-sm text-muted-foreground hover:text-foreground">NFT</a>
            <a href="/affiliate" className="text-sm text-muted-foreground hover:text-foreground">Affiliate</a>
            {isAdmin && (
              <a href="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin</a>
            )}
            <button onClick={handleSignOut} className="text-sm text-muted-foreground hover:text-foreground">Sign Out</button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Member book</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back, {overview?.username || displayName} — Ubuntu Afrique ledger
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            First-run path: complete KYC, then buy cards or fractions. KYC does not block CARD or FRACTION pay.
          </p>
          {aureusReadOnlyNote && (
            <p className="mt-2 text-sm text-gold/80">
              Aureus Africa login is read-only. Money, rank, cards, and fractions on this page come from the Ubuntu book only.
            </p>
          )}
        </div>

        
            <div className="mb-8 rounded-2xl border border-gold/30 bg-gold/5 p-6">
              <h2 className="font-display text-lg font-semibold">KYC status</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {kycStatus === "NONE" ? "Not submitted" : kycStatus}. Open KYC, then cards or invest. Pay stays open.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="/dashboard/kyc" className="rounded-md bg-gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground">Open KYC</a>
                <a href="/dashboard/cards" className="rounded-md border border-gold/50 px-4 py-2 text-sm font-semibold text-gold">Cards</a>
                <a href="/dashboard/invest" className="rounded-md border border-gold/50 px-4 py-2 text-sm font-semibold text-gold">Fractions</a>
              </div>
            </div>

        {missingBook ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="font-display text-xl font-semibold">No Ubuntu member book</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {overview?.error || "This login is not linked to a ua_users row. The Aureus share book is not shown here."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Trophy} label="Corporate rank" value={overview?.currentRank || "SSA"} subtext={progress?.nextRank ? `Next ${progress.nextRank}` : "Top rank"} />
              <StatCard icon={Wallet} label="Wallet available" value={`$${overview?.wallet?.available || "0.00"}`} subtext={`Credits $${overview?.wallet?.credits || "0.00"}`} />
              <StatCard icon={Layers} label="Fraction underlying" value={overview?.fractions?.underlying || "0.00"} subtext={`${overview?.fractions?.quantity || 0} fraction lots`} />
              <StatCard icon={Coins} label="Paid card orders" value={String(overview?.cards?.paidCount || 0)} subtext={`$${overview?.cards?.paidTotal || "0.00"}`} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-8">
                <h2 className="font-display text-xl font-semibold">Rank progress</h2>
                <div className="mt-6 space-y-4">
                  <Row label="Team volume" value={`$${progress?.progress.teamVolume.have || "0.00"} / $${progress?.progress.teamVolume.need || "0.00"}`} met={progress?.progress.teamVolume.met} />
                  <Row label="Team members" value={`${progress?.progress.teamMembers.have || 0} / ${progress?.progress.teamMembers.need || 0}`} met={progress?.progress.teamMembers.met} />
                  <Row label="Qualified legs" value={`${progress?.progress.qualifiedLegs.have || 0} / ${progress?.progress.qualifiedLegs.need || 0}${progress?.progress.qualifiedLegs.requiredRank ? ` ${progress.progress.qualifiedLegs.requiredRank}` : ""}`} met={progress?.progress.qualifiedLegs.met} />
                  <Row label="Personal QV" value={overview?.volume?.personalQv || "0.00"} />
                  <Row label="Monthly team QV" value={overview?.volume?.monthlyTeamQv || "0.00"} />
                </div>
                <a
                  href="/dashboard/invest"
                  className="mt-6 inline-flex items-center gap-2 rounded-md border border-gold/50 px-6 py-3 font-semibold text-gold transition-colors hover:bg-gold/10"
                >
                  Buy fractions
                </a>
              </div>

              <div className="rounded-2xl border border-border bg-card p-8">
                <h2 className="font-display text-xl font-semibold">Wallet types</h2>
                <div className="mt-6 space-y-3 text-sm">
                  <Row label="Gap commission" value={`$${overview?.wallet?.byType?.GAP_COMMISSION || "0.00"}`} />
                  <Row label="BLP" value={`$${overview?.wallet?.byType?.BLP || "0.00"}`} />
                  <Row label="Reversals" value={`$${overview?.wallet?.reversals || "0.00"}`} />
                </div>
                <a
                  href="/affiliate"
                  className="mt-6 block w-full rounded-md border border-gold/50 px-6 py-3 text-center font-semibold text-gold transition-colors hover:bg-gold/10"
                >
                  Affiliate
                </a>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, met }: { label: string; value: string; met?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-display text-lg font-semibold ${met === true ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/10 text-gold">
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="mt-1 font-display text-2xl font-bold">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{subtext}</div>
      </div>
    </div>
  );
}
