"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { AdminLogin } from "@/components/crm/AdminLogin";
import { WorkOrderForm } from "@/components/crm/WorkOrderForm";
import { isAdminAuthenticated, logoutAdmin, restoreSessionFromToken } from "@/lib/auth";
import { loadDb } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { Button } from "@/components/ui/Button";

function WorkOrdersPageContent() {
  const { t } = useI18n();
  const w = t.wo;
  const c = t.crm;
  const sig = t.signature;
  const searchParams = useSearchParams();
  const [authed, setAuthed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setAuthed(isAdminAuthenticated());
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    restoreSessionFromToken().finally(refresh);
  }, [refresh]);

  useEffect(() => {
    const edit = searchParams.get("edit");
    if (edit) setEditingId(edit);
  }, [searchParams]);

  if (!authed) return <AdminLogin onSuccess={refresh} />;

  const db = loadDb();
  void tick;

  if (creating || editingId) {
    return (
      <DashboardLayout role="admin">
        <div className="p-6 lg:p-10">
          <WorkOrderForm
            orderId={editingId}
            onClose={() => {
              setCreating(false);
              setEditingId(null);
            }}
            onSaved={() => {
              setCreating(false);
              setEditingId(null);
              refresh();
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 lg:p-10 space-y-8">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <Link href="/crm" className="text-sm text-bm-muted hover:text-bm-red">
              ← CRM
            </Link>
            <h1 className="font-display text-2xl font-bold uppercase text-glow mt-2">
              {w.ordersTitle}
            </h1>
            <p className="text-sm text-bm-muted mt-1">{w.adminOnly}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} /> {c.createOrder}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                logoutAdmin();
                refresh();
              }}
            >
              <LogOut size={16} /> {c.logout}
            </Button>
          </div>
        </div>

        <div className="glass-red rounded-xl overflow-hidden neon-border">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{c.status}</th>
                <th>{c.date}</th>
                <th>{c.client}</th>
                <th>Auto</th>
                <th>{c.total}</th>
                <th>{sig.adminSigned}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...db.workOrders].reverse().map((order) => {
                const client = db.users.find((u) => u.id === order.userId);
                const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
                return (
                  <tr key={order.id} className="hover:bg-white/5">
                    <td className="font-mono text-bm-red">{order.number}</td>
                    <td>
                      <span className="status-pill bg-bm-red/20 text-bm-red text-[10px]">
                        {t.repairStatus[order.status]}
                      </span>
                    </td>
                    <td>{order.createdAt}</td>
                    <td>{client?.name ?? "—"}</td>
                    <td>
                      {vehicle ? `${vehicle.make} ${vehicle.model}` : "—"}
                    </td>
                    <td className="font-mono">{calcClientTotal(order).toFixed(2)} zł</td>
                    <td>
                      {order.confirmationStatus === "confirmed" ? (
                        <span className="text-[10px] text-green-400">
                          {sig.confirmed}
                          {order.signature?.signedAt && (
                            <span className="block text-bm-muted">
                              {new Date(order.signature.signedAt).toLocaleString()}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400">{sig.awaiting}</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setEditingId(order.id)}
                        className="text-bm-red hover:text-white p-2"
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<div className="pt-28 text-center text-bm-muted">...</div>}>
      <WorkOrdersPageContent />
    </Suspense>
  );
}
