"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, type Database, type User, type Vehicle, type WorkOrder } from "@/lib/store";
import type { ClientPortalSlice } from "@/lib/client-sign";
import { restoreSessionFromToken } from "@/lib/auth";
import { hasSignOrderAccess, setSignOrderAccess } from "@/lib/sign-order-access";
import { SignOrderGuestForm } from "@/components/sign/SignOrderGuestForm";
import { WorkOrderSignatureFlow } from "@/components/cabinet/WorkOrderSignatureFlow";
import { ClientWorkOrderDetail } from "@/components/cabinet/ClientWorkOrderDetail";
import { TelegramOpenButton } from "@/components/shared/TelegramOpenButton";
import { DocumentLocalePicker } from "@/components/work-order/DocumentLocalePicker";
import {
  resolveOrderDocumentLocale,
  type DocLocale,
} from "@/lib/work-order-locale";

type SignMode = "local" | "cloud" | null;

type CloudSignState = {
  order: WorkOrder;
  client: User;
  vehicle: Vehicle | null;
  phone: string;
  plate: string;
  portal?: ClientPortalSlice;
};

export default function SignWorkOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="pt-28 pb-20 min-h-[70vh] flex items-center justify-center">
          <p className="text-bm-muted">…</p>
        </div>
      }
    >
      <SignWorkOrderContent params={params} />
    </Suspense>
  );
}

function SignWorkOrderContent({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const searchParams = useSearchParams();
  const urlLang = searchParams.get("lang");
  const { t, locale } = useI18n();
  const [viewLang, setViewLang] = useState<DocLocale | null>(null);
  const [ready, setReady] = useState(false);
  const [db, setDb] = useState(loadDb());
  const [showSign, setShowSign] = useState(false);
  const [signMode, setSignMode] = useState<SignMode>(null);
  const [cloudSign, setCloudSign] = useState<CloudSignState | null>(null);
  const [signed, setSigned] = useState(false);
  const [resolvedOrder, setResolvedOrder] = useState<WorkOrder | null>(null);
  const [guestVerified, setGuestVerified] = useState(() => hasSignOrderAccess(orderId));

  useEffect(() => {
    restoreSessionFromToken()
      .catch(() => null)
      .finally(() => {
        setDb(loadDb());
        setReady(true);
      });
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      const tg = (
        window as unknown as {
          Telegram?: { WebApp?: { ready: () => void; expand: () => void } };
        }
      ).Telegram?.WebApp;
      tg?.ready();
      tg?.expand();
    };
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  const localOrder = db.workOrders.find((o) => o.id === orderId);
  const user = db.currentUserId
    ? db.users.find((u) => u.id === db.currentUserId && u.role === "client")
    : null;
  const isOwner = Boolean(user && localOrder && localOrder.userId === user.id);

  const order = cloudSign?.order ?? resolvedOrder ?? localOrder;
  const docLocale =
    viewLang ?? resolveOrderDocumentLocale(order ?? {}, locale, urlLang);

  const signDb: Database = db;

  const canAccess =
    Boolean(order) &&
    (isOwner || guestVerified || (order ? hasSignOrderAccess(order.id) : false));

  const handleGuestVerified = (
    verifiedOrder: WorkOrder,
    mode: "local" | "cloud",
    cloud?: {
      client: User;
      vehicle: Vehicle | null;
      phone: string;
      plate: string;
      portal?: ClientPortalSlice;
    }
  ) => {
    setSignMode(mode);
    setGuestVerified(true);
    setResolvedOrder(verifiedOrder);
    setSignOrderAccess(verifiedOrder.id);
    setDb(loadDb());
    if (mode === "cloud" && cloud) {
      setCloudSign({
        order: verifiedOrder,
        client: cloud.client,
        vehicle: cloud.vehicle,
        phone: cloud.phone,
        plate: cloud.plate,
        portal: cloud.portal,
      });
    }
    if (verifiedOrder.confirmationStatus !== "confirmed") {
      setShowSign(true);
    }
  };

  if (!ready) {
    return (
      <div className="pt-28 pb-20 min-h-[70vh] flex items-center justify-center">
        <p className="text-bm-muted">{t.common.loading}</p>
      </div>
    );
  }

  if (signed || order?.confirmationStatus === "confirmed") {
    return (
      <div className="pt-28 pb-20 px-4 text-center max-w-lg mx-auto">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="font-display text-xl uppercase text-glow">{t.document.signDoneTitle}</h1>
        <p className="text-bm-muted mt-2">{t.document.signDoneHint}</p>
        {order && (
          <p className="text-sm font-mono text-bm-muted mt-4">{order.number}</p>
        )}
        <Link href="/" className="btn-primary mt-8 inline-block">
          {t.nav.home}
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-28 pb-20 px-4">
        <SignOrderGuestForm
          orderId={orderId}
          orderNumber={orderId}
          onVerified={handleGuestVerified}
        />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="pt-28 pb-20 px-4">
        <SignOrderGuestForm
          orderId={orderId}
          orderNumber={order.number}
          onVerified={handleGuestVerified}
        />
      </div>
    );
  }

  if (showSign) {
    return (
      <WorkOrderSignatureFlow
        order={order}
        db={signDb}
        documentLocale={docLocale}
        urlLang={urlLang}
        cloudSign={
          signMode === "cloud" && cloudSign
            ? { phone: cloudSign.phone, plate: cloudSign.plate }
            : undefined
        }
        onDone={() => {
          setSigned(true);
          setShowSign(false);
          if (signMode === "local") setDb(loadDb());
        }}
        onCancel={() => setShowSign(false)}
      />
    );
  }

  return (
    <div className="pt-28 pb-20 px-4 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch sm:items-center">
        <DocumentLocalePicker
          value={docLocale}
          onChange={setViewLang}
          className="sm:mr-auto"
        />
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={() => setShowSign(true)}
        >
          {t.signature.signNow}
        </button>
        <TelegramOpenButton startParam={`sign_${orderId}`} />
      </div>
      {!isOwner && (
        <p className="text-xs text-bm-muted text-center mb-4">{t.document.signGuestHint}</p>
      )}
      <ClientWorkOrderDetail
        order={order}
        db={signDb}
        documentLocale={docLocale}
        onBack={() => {}}
      />
    </div>
  );
}
