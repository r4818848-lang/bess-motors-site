"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { AddClientModal } from "./AddClientModal";
import { Button } from "@/components/ui/Button";

interface NewClientFormProps {
  onCreated: (userId: string, vehicleId: string) => void;
  onCancel?: () => void;
  compact?: boolean;
}

/** Opens Motowarsztat-style add client modal */
export function NewClientForm({ onCreated, onCancel, compact }: NewClientFormProps) {
  const { t } = useI18n();
  const c = t.crm;
  const [open, setOpen] = useState(!compact);

  return (
    <>
      {compact ? (
        <Button type="button" className="text-xs w-full" onClick={() => setOpen(true)}>
          <UserPlus size={16} /> {c.addNewClient}
        </Button>
      ) : (
        <div className="crm-mw-card p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-sm uppercase text-bm-red flex items-center gap-2">
              <UserPlus size={16} /> {c.newClientTitle}
            </h3>
            <p className="text-xs text-bm-muted mt-1 max-w-lg">{c.newClientHint}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={() => setOpen(true)}>
              {c.addNewClient}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t.common.cancel}
              </Button>
            )}
          </div>
        </div>
      )}
      <AddClientModal
        open={open}
        onClose={() => {
          setOpen(false);
          onCancel?.();
        }}
        onCreated={(uid, vid) => {
          setOpen(false);
          onCreated(uid, vid);
        }}
      />
    </>
  );
}
