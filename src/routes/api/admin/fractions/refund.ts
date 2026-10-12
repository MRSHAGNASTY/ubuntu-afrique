import { createFileRoute } from "@tanstack/react-router"
import type { SupabaseClient } from "@supabase/supabase-js"
import { confirmCommercePayment, orderFromFractionRow, reverseFractionOrder } from "../../../../lib/commerceOrders.mjs"
import { addMoney, formatMoney2, parseMoney } from "../../../../lib/money.mjs"
import { persistFractionRefund } from "../../../../lib/persistRefund.server"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { getUbuntuServerClient, loadGapCoverMembers } from "../../../../lib/ubuntuServer.server"

async function authorize(request: Request, body: Record<string, unknown>) {
  return authorizeUbuntuStaff(request, body, "SHARE")
}

function closed(body: Record<string, unknown>, status = 200) {
  return Response.json({ ...body, checkoutEnabled: false }, { status })
}

async function ledgerAmount(ubuntu: SupabaseClient, orderId: string, entryType: string) {
  const { data, error } = await ubuntu
    .from("ua_aureus_liability_ledger")
    .select("id, amount")
    .eq("source_transaction_id", orderId)
    .eq("entry_type", entryType)
    .maybeSingle()
  if (error && !String(error.message || "").includes("does not exist")) {
    throw new Error(error.message)
  }
  return data
}

export const Route = createFileRoute("/api/admin/fractions/refund")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = await request.json().catch(() => ({}))
        const body: Record<string, unknown> =
          parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed as Record<string, unknown>
            : {}
        const auth = await authorize(request, body)
        if (!auth.ok) {
          return closed({ ok: false, error: auth.error }, auth.status)
        }

        const orderId = String(body.orderId || "").trim()
        const reason = String(body.reason || "").trim()
        if (!orderId) {
          return closed({ ok: false, error: "orderId is required" }, 400)
        }

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return closed({
            ok: false,
            error: err instanceof Error ? err.message : "Ubuntu write refused",
          }, 500)
        }
        if (!ubuntu) {
          return closed({ ok: false, error: "Ubuntu Afrique database is not configured" }, 503)
        }

        const { data: existing, error: existingError } = await ubuntu
          .from("ua_fraction_transactions")
          .select("*")
          .eq("id", orderId)
          .maybeSingle()
        if (existingError) {
          return closed({ ok: false, error: existingError.message }, 500)
        }
        if (!existing) {
          return closed({ ok: false, error: "Fraction order not found" }, 404)
        }

        const status = String(existing.transaction_status || "")
        if (status === "REFUNDED" || status === "CANCELLED") {
          return closed({
            ok: true,
            orderId,
            transactionStatus: status,
            idempotent: true,
          })
        }
        if (status !== "PENDING_PAYMENT" && status !== "PAID") {
          return closed({ ok: false, error: "Fraction refund requires PENDING_PAYMENT or PAID" }, 409)
        }

        let reserve
        let sale
        try {
          reserve = await ledgerAmount(ubuntu, orderId, "FRACTION_RESERVE")
          sale = await ledgerAmount(ubuntu, orderId, "FRACTION_SALE")
        } catch (err) {
          return closed({
            ok: false,
            error: err instanceof Error ? err.message : "Fraction ledger read failed",
          }, 500)
        }

        if (status === "PENDING_PAYMENT" && sale) {
          return closed({ ok: false, error: "Fraction sale already posted" }, 409)
        }
        if (status === "PENDING_PAYMENT" && !reserve) {
          return closed({ ok: false, error: "Pending fraction cancel requires a reserve" }, 409)
        }
        if (status === "PAID" && !sale) {
          return closed({ ok: false, error: "Fraction refund requires a sale" }, 409)
        }

        const { data: inventory, error: inventoryError } = await ubuntu
          .from("ua_underlying_inventory")
          .select("remaining_underlying, sold_underlying")
          .eq("id", "AUREUS_100K")
          .maybeSingle()
        if (inventoryError) {
          return closed({ ok: false, error: inventoryError.message }, 500)
        }
        if (!inventory) {
          return closed({ ok: false, error: "Ubuntu underlying inventory row is missing" }, 500)
        }

        const currentRemaining = String(inventory.remaining_underlying ?? "0")
        const currentSold = String(inventory.sold_underlying ?? "0")
        const heldRaw = reserve?.amount != null ? reserve.amount : sale?.amount
        const rebuildRemaining = heldRaw != null
          ? formatMoney2(addMoney(parseMoney(currentRemaining), parseMoney(String(heldRaw))))
          : formatMoney2(parseMoney(currentRemaining))

        let order
        try {
          order = orderFromFractionRow(existing, rebuildRemaining)
          order.remainingUnderlying = formatMoney2(parseMoney(currentRemaining))
          order.soldUnderlying = formatMoney2(parseMoney(currentSold))
          if (existing.underlying_share_equivalent != null && String(existing.underlying_share_equivalent).trim() !== "") {
            order.underlyingShareEquivalent = formatMoney2(parseMoney(String(existing.underlying_share_equivalent)))
          }
          if (existing.qv != null && String(existing.qv).trim() !== "") {
            order.qv = formatMoney2(parseMoney(String(existing.qv)))
          }
          if (reserve?.amount != null) {
            order.fractionReserve = { amount: formatMoney2(parseMoney(String(reserve.amount))) }
            order.reservedUnderlying = order.fractionReserve.amount
          }
          if (sale?.amount != null) {
            order.fractionSale = { amount: formatMoney2(parseMoney(String(sale.amount))) }
          }

          if (status === "PAID") {
            const { data: commissions, error: commissionError } = await ubuntu
              .from("ua_commission_transactions")
              .select("recipient_user_id, recipient_rank, commission_type, previous_entitlement, new_entitlement, gap_percentage, amount, comp_plan_version")
              .eq("source_transaction_id", orderId)
              .eq("commission_type", "GAP_COMMISSION")
            if (commissionError) {
              return closed({ ok: false, error: commissionError.message }, 500)
            }
            if (commissions && commissions.length) {
              order.gapCover = {
                payments: commissions.map((row) => ({
                  recipientId: String(row.recipient_user_id),
                  recipientRank: String(row.recipient_rank || ""),
                  commissionType: String(row.commission_type),
                  previousEntitlement: String(row.previous_entitlement || "0"),
                  newEntitlement: String(row.new_entitlement || "0"),
                  gapPercentage: String(row.gap_percentage || "0"),
                  amount: String(row.amount),
                  compPlanVersion: String(row.comp_plan_version || "GAP_COVER_V1"),
                })),
              }
            }
            if (!order.gapCover || !order.volume) {
              const sellerId = String(existing.sponsor_id || order.sponsorId || order.userId)
              const members = await loadGapCoverMembers(ubuntu, sellerId)
              const rebuilt = confirmCommercePayment({
                order: {
                  ...order,
                  status: "PENDING_PAYMENT",
                  remainingUnderlying: rebuildRemaining,
                  soldUnderlying: formatMoney2(parseMoney(currentSold)),
                  inventory: undefined,
                  ownership: undefined,
                  gapCover: undefined,
                },
                paymentId: String(existing.payment_id || "REFUND"),
                members,
              })
              if (!order.gapCover) order.gapCover = rebuilt.gapCover
              order.volume = rebuilt.volume
              order.blpAccrual = rebuilt.blpAccrual
            }
            order.status = "PAID"
            order.paymentId = String(existing.payment_id || "REFUND")
            order.ownership = {
              userId: String(order.userId),
              quantity: order.quantity,
              aureusPhase: order.aureusPhase,
              aureusSharePrice: order.aureusSharePrice,
              underlyingShareEquivalent: order.underlyingShareEquivalent,
            }
          }
        } catch (err) {
          return closed({
            ok: false,
            error: err instanceof Error ? err.message : "Refund rebuild failed",
          }, 400)
        }

        let refunded
        try {
          refunded = reverseFractionOrder({ order, reason })
        } catch (err) {
          return closed({
            ok: false,
            error: err instanceof Error ? err.message : "Refund failed",
          }, 400)
        }

        try {
          const persisted = await persistFractionRefund(ubuntu, refunded)
          return closed({
            ok: true,
            order: refunded,
            persisted: true,
            idempotent: Boolean(persisted.idempotent),
            transactionStatus: refunded.status,
          })
        } catch (err) {
          return closed({
            ok: false,
            error: err instanceof Error ? err.message : "Refund persist failed",
          }, 500)
        }
      },
    },
  },
})
