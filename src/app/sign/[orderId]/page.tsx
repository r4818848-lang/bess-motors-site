"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { restoreSessionFromToken, isClientAuthenticated } from "@/lib/auth";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";
import { WorkOrderSignatureFlow } from "@/components/cabinet/WorkOrderSignatureFlow";
import { ClientWorkOrderDetail } from "@/components/cabinet/ClientWorkOrderDetail";

export default function SignWorkOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { t } = useI18n();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [db, setDb] = useState(loadDb());
  const [showSign, setShowSign] = useState(false);

  useEffect(() => {
    restoreSessionFromToken()
      .catch(() => null)
      .finally(() => {
        setDb(loadDb());
        setReady(true);
      });
  }, []);

  const order = db.workOrders.find((o) => o.id === orderId);
  const user = db.currentUserId
    ? db.users.find((u) => u.id === db.currentUserId && u.role === "client")
    : null;
  const isOwner = user && order && order.userId === user.id;

  if (!ready) {
    return (
      <div className="pt-28 pb-20 min-h-[70vh] flex items-center justify-center">
        <p className="text-bm-muted">{t.common.loading}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-28 pb-20 px-4 text-center max-w-lg mx-auto">
        <p className="text-bm-muted">{t.document.orderNotFound}</p>
        <Link href="/cabinet" className="btn-primary mt-6 inline-block">
          {t.cabinet.title}
        </Link>
      </div>
    );
  }

  if (!isClientAuthenticated() || !isOwner) {
    return (
      <div className="pt-28 pb-20 px-4">
        <div className="max-w-md mx-auto text-center mb-8">
          <Shield className="w-12 h-12 text-bm-red mx-auto mb-4" />
          <h1 className="font-display text-xl uppercase text-glow">{t.document.signLoginTitle}</h1>
          <p className="text-sm text-bm-muted mt-2 font-mono">{order.number}</p>
        </div>
        <PhoneAuthForm
          onSuccess={() => {
            const fresh = loadDb();
            setDb(fresh);
            const u = fresh.users.find(
              (x) => x.id === fresh.currentUserId && x.role === "client"
            );
            if (u && order.userId === u.id) {
              setShowSign(order.confirmationStatus !== "confirmed");
            } else {
              router.push("/cabinet");
            }
          }}
        />
      </div>
    );
  }

  if (showSign && order.confirmationStatus !== "confirmed") {
    return (
      <WorkOrderSignatureFlow
        order={order}
        db={db}
        onDone={() => {
          setDb(loadDb());
          setShowSign(false);
        }}
        onCancel={() => setShowSign(false)}
      />
    );
  }

  return (
    <div className="pt-28 pb-20 px-4 max-w-3xl mx-auto">
      {order.confirmationStatus !== "confirmed" && (
        <button
          type="button"
          className="btn-primary w-full mb-6"
          onClick={() => setShowSign(true)}
        >
          {t.signature.signNow}
        </button>
      )}
      <ClientWorkOrderDetail
        order={order}
        db={db}
        onBack={() => router.push("/cabinet?tab=history")}
      />
    </div>
  );
}
