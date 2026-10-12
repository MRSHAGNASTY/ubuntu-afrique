import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/dashboard/invest")({
  component: InvestPage,
});

function InvestPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<any[]>([]);
  const [fractionQty, setFractionQty] = useState(1);
  const [fractionQuote, setFractionQuote] = useState<any>(null);
  const [fractionError, setFractionError] = useState("");
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/cards/products")
      .then((res) => res.json())
      .then((json) => setCards(json.products || []))
      .catch(() => setCards([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFractionError("");
    fetch("/api/fractions/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: fractionQty }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.ok) {
          setFractionQuote(null);
          setFractionError(json.error || "Quote failed");
          return;
        }
        setFractionQuote({ ...json.quote, inventory: json.inventory, phase: json.phase });
      })
      .catch(() => {
        if (!cancelled) setFractionError("Quote unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [fractionQty]);

  async function placeFraction() {
    setFractionError("");
    setResult(null);
    setBusy(true);
    try {
      const res = await fetch("/api/fractions/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ua_session") || localStorage.getItem("auth_token") || ""}`,
        },
        body: JSON.stringify({ quantity: fractionQty }),
      });
      const json = await res.json();
      if (!json.ok) {
        setFractionError(json.error || "FRACTION checkout failed");
        return;
      }
      setResult(json.order);
      navigate({
        to: "/dashboard/pay",
        search: { kind: "FRACTION", orderId: String(json.order.id) },
      });
    } catch (err) {
      setFractionError(err instanceof Error ? err.message : "FRACTION checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Cards and Fractions</h1>
        <p className="mt-2 text-muted-foreground">
          Named FRACTION checkout is open on this page. CARD checkout stays on the Cards page. Marketplace and NFT stay closed.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Aureus Cards</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quotes only on this page. Named CARD checkout is at <a href="/dashboard/cards" className="text-gold">/dashboard/cards</a>.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <div key={card.productType} className="rounded-2xl border border-border bg-card p-6">
                <p className="text-xs uppercase tracking-widest text-gold">{card.productType}</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{card.name}</h3>
                <p className="mt-4 text-sm text-muted-foreground">Retail {card.unit.retailPrice}</p>
                <p className="text-sm text-muted-foreground">Cost {card.unit.cost}</p>
                <p className="text-sm text-muted-foreground">Max Gap {card.unit.gap}</p>
                <p className="text-sm text-muted-foreground">BLP {card.unit.blp}</p>
                <p className="mt-3 font-semibold text-gold">Ubuntu Afrique gross {card.unit.ubuntuAfriqueGross}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-gold/30 bg-gold/5 p-6">
          <h2 className="font-display text-xl font-semibold">$10 Fractions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Live Ubuntu phase and remaining inventory. Historical ownership locks to the phase used at purchase. After pending, the Ubuntu member payment gate opens for this FRACTION.
          </p>
          <label className="mt-4 block text-sm font-medium">Quantity</label>
          <input
            type="number"
            min={1}
            value={fractionQty}
            onChange={(e) => setFractionQty(Number(e.target.value || 1))}
            className="mt-2 w-40 rounded-lg border border-border bg-background px-4 py-3"
          />
          {fractionError && <p className="mt-3 text-sm text-red-400">{fractionError}</p>}
          {result && (
            <p className="mt-3 text-sm text-gold">
              Pending FRACTION {result.productId} {result.id} @ ${result.total}
            </p>
          )}
          {fractionQuote && (
            <div className="mt-4 grid gap-2 text-sm">
              <p>Phase {fractionQuote.phase?.phase ?? fractionQuote.aureusPhase} at {fractionQuote.phase?.aureusSharePrice ?? fractionQuote.aureusSharePrice}</p>
              <p>Remaining underlying {fractionQuote.inventory?.remainingUnderlying ?? fractionQuote.remainingUnderlying}</p>
              <p>Total {fractionQuote.total}</p>
              <p>Underlying equivalent {fractionQuote.underlyingShareEquivalent}</p>
              <p>Allocation component {fractionQuote.allocationComponent}</p>
              <p>Max Gap {fractionQuote.gap}</p>
              <p>BLP {fractionQuote.blp}</p>
              <p className="font-semibold text-gold">Ubuntu Afrique gross {fractionQuote.ubuntuAfriqueGross}</p>
            </div>
          )}
          <button
            disabled={busy}
            onClick={() => void placeFraction()}
            className="mt-6 rounded-md border border-gold/50 px-6 py-2 font-semibold text-gold hover:bg-gold/10 disabled:opacity-50"
          >
            Place FRACTION order
          </button>
        </section>
      </main>
    </div>
  );
}
