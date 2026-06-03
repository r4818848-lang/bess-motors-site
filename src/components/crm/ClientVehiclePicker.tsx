"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, UserPlus, Car, User, Building2, History, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { useDbSync } from "@/hooks/useDbSync";
import {
  findClientByQuery,
  searchClientsAndVehicles,
  searchClientsOnly,
  searchVehiclesOnly,
} from "@/lib/workorder-search";
import { getRecentClientVehiclePairs } from "@/lib/crm-recent-history";
import { AddClientModal } from "./AddClientModal";
import { AddVehicleModal } from "./AddVehicleModal";

type Props = {
  userId: string;
  vehicleId: string;
  onSelect: (userId: string, vehicleId: string) => void;
  /** Controlled search fields (quick-create draft persistence) */
  clientQ?: string;
  vehicleQ?: string;
  onClientQChange?: (q: string) => void;
  onVehicleQChange?: (q: string) => void;
};

export function ClientVehiclePicker({
  userId,
  vehicleId,
  onSelect,
  clientQ: clientQProp,
  vehicleQ: vehicleQProp,
  onClientQChange,
  onVehicleQChange,
}: Props) {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const dbTick = useDbSync();
  const db = useMemo(() => loadDb(), [dbTick]);

  const [vehicleQInternal, setVehicleQInternal] = useState("");
  const [clientQInternal, setClientQInternal] = useState("");
  const clientQControlled = clientQProp !== undefined && onClientQChange !== undefined;
  const vehicleQControlled = vehicleQProp !== undefined && onVehicleQChange !== undefined;
  const clientQ = clientQControlled ? clientQProp : clientQInternal;
  const setClientQ = clientQControlled ? onClientQChange : setClientQInternal;
  const vehicleQ = vehicleQControlled ? vehicleQProp : vehicleQInternal;
  const setVehicleQ = vehicleQControlled ? onVehicleQChange : setVehicleQInternal;
  const [showVehicleList, setShowVehicleList] = useState(false);
  const [showClientList, setShowClientList] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleModalUserId, setVehicleModalUserId] = useState<string | undefined>();
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [clientPickHint, setClientPickHint] = useState("");
  const vehicleRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<HTMLDivElement>(null);

  const selectedUser = db.users.find((u) => u.id === userId);
  const selectedVehicle = db.vehicles.find((v) => v.id === vehicleId);
  const clientVehicles = userId ? db.vehicles.filter((v) => v.userId === userId) : [];
  const recent = useMemo(() => getRecentClientVehiclePairs(db, 6), [db]);

  const vehicleResults = useMemo(
    () => (vehicleQ.length >= 1 ? searchVehiclesOnly(db, vehicleQ) : []),
    [vehicleQ, db]
  );

  const clientResults = useMemo(
    () => (clientQ.length >= 1 ? searchClientsOnly(db, clientQ) : []),
    [clientQ, db]
  );

  const combinedResults = useMemo(
    () => (vehicleQ.length >= 2 ? searchClientsAndVehicles(db, vehicleQ) : []),
    [vehicleQ, db]
  );

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (vehicleRef.current && !vehicleRef.current.contains(e.target as Node)) {
        setShowVehicleList(false);
      }
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientList(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pickVehicle = (uid: string, vid: string) => {
    onSelect(uid, vid);
    setShowVehicleList(false);
    setVehicleQ("");
  };

  const pickClient = (uid: string) => {
    const vehicles = db.vehicles.filter((v) => v.userId === uid);
    const vid = vehicles[0]?.id ?? "";
    onSelect(uid, vid);
    setShowClientList(false);
    setClientQ("");
    setClientPickHint("");
  };

  const ensureClientFromQuery = (): string => {
    if (userId) return userId;
    const found = findClientByQuery(db, clientQ);
    if (!found) return "";
    pickClient(found.id);
    return found.id;
  };

  const openAddVehicleModal = () => {
    const uid = ensureClientFromQuery();
    if (!uid) {
      if (clientQ.trim() && searchClientsOnly(db, clientQ).length > 1) {
        setClientPickHint(c.clientAmbiguousPick);
      } else if (clientQ.trim()) {
        setClientPickHint(c.clientConfirmPick);
      } else {
        setClientPickHint(c.clientConfirmPick);
      }
      setShowClientList(true);
      return;
    }
    setVehicleModalUserId(uid);
    setVehicleModalOpen(true);
  };

  const clientLabel = (u: (typeof db.users)[0]) => {
    if (u.clientType === "company") {
      return (
        <span className="inline-flex items-center gap-1">
          <Building2 size={12} className="text-bm-red shrink-0" />
          {u.companyName || u.name}
        </span>
      );
    }
    return u.name || "—";
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div ref={vehicleRef} className="relative">
          <label className="text-xs uppercase text-bm-muted tracking-widest flex items-center gap-2">
            <Car size={14} className="text-bm-red" />
            {c.vehicleLabel}
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
            <input
              className="input-premium pl-10"
              placeholder={c.vehicleSearchPlaceholder}
              value={
                showVehicleList
                  ? vehicleQ
                  : selectedVehicle
                    ? `${selectedVehicle.make} ${selectedVehicle.model} · ${selectedVehicle.plate}`
                    : vehicleQ
              }
              onChange={(e) => {
                setVehicleQ(e.target.value);
                setShowVehicleList(true);
              }}
              onFocus={() => setShowVehicleList(true)}
            />
          </div>
          {showVehicleList && (vehicleResults.length > 0 || combinedResults.length > 0) && (
            <ul className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto crm-mw-card border border-bm-border shadow-lg">
              {(vehicleQ.length >= 2 ? combinedResults : vehicleResults).map(({ user, vehicle }) =>
                vehicle ? (
                  <li key={`${user.id}-${vehicle.id}`}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-bm-red/10 text-sm border-b border-bm-border/50 last:border-0"
                      onClick={() => pickVehicle(user.id, vehicle.id)}
                    >
                      <span className="font-semibold text-white">
                        {vehicle.make} {vehicle.model}
                      </span>
                      <span className="block font-mono text-xs text-bm-red mt-0.5">
                        {vehicle.plate} · {vehicle.vin || "—"}
                      </span>
                      <span className="block text-[10px] text-bm-muted mt-0.5">
                        {clientLabel(user)}
                      </span>
                    </button>
                  </li>
                ) : null
              )}
            </ul>
          )}
          <button
            type="button"
            className="mt-2 text-xs text-bm-red hover:underline inline-flex items-center gap-1"
            onClick={openAddVehicleModal}
          >
            <Plus size={12} /> {c.addNewVehicle}
          </button>
          {userId && clientVehicles.length > 1 && (
            <select
              className="input-premium mt-2 text-sm"
              value={vehicleId}
              onChange={(e) => onSelect(userId, e.target.value)}
            >
              {clientVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} · {v.plate || v.vin || v.id}
                </option>
              ))}
            </select>
          )}
        </div>

        <div ref={clientRef} className="relative">
          <label className="text-xs uppercase text-bm-muted tracking-widest flex items-center gap-2">
            <User size={14} className="text-bm-red" />
            {c.client}
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
            <input
              className="input-premium pl-10"
              placeholder={c.clientSearchPlaceholder}
              value={
                showClientList
                  ? clientQ
                  : selectedUser
                    ? `${selectedUser.clientType === "company" ? selectedUser.companyName || selectedUser.name : selectedUser.name} · ${selectedUser.phone}`
                    : clientQ
              }
              onChange={(e) => {
                setClientQ(e.target.value);
                setClientPickHint("");
                setShowClientList(true);
              }}
              onFocus={() => setShowClientList(true)}
              onBlur={() => {
                setShowClientList(false);
                if (!userId && clientQ.trim()) {
                  const found = findClientByQuery(db, clientQ);
                  if (found) pickClient(found.id);
                }
              }}
            />
          </div>
          {showClientList && (
            <ul className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto crm-mw-card border border-bm-border shadow-lg">
              <li>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-bm-red font-semibold hover:bg-bm-red/10 border-b border-bm-border/50"
                  onClick={() => {
                    setClientModalOpen(true);
                    setShowClientList(false);
                  }}
                >
                  <UserPlus size={14} className="inline mr-2" />
                  {c.addNewClient}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-bm-red font-semibold hover:bg-bm-red/10 border-b border-bm-border/50"
                  onClick={() => {
                    setCompanyModalOpen(true);
                    setShowClientList(false);
                  }}
                >
                  <Building2 size={14} className="inline mr-2" />
                  {c.addNewCompany}
                </button>
              </li>
              {clientResults.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-bm-red/10 text-sm border-b border-bm-border/50"
                    onClick={() => pickClient(user.id)}
                  >
                    <span className="font-semibold text-white">{clientLabel(user)}</span>
                    <span className="block font-mono text-xs text-bm-red">{user.phone}</span>
                    {user.nip && (
                      <span className="block text-[10px] text-bm-muted">NIP {user.nip}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="rounded-lg border border-bm-border bg-bm-graphite/40 p-3">
          <p className="text-[10px] uppercase tracking-widest text-bm-muted flex items-center gap-2 mb-2">
            <History size={12} className="text-bm-red" />
            {c.recentFromHistory}
          </p>
          <div className="flex flex-wrap gap-2">
            {recent.map(({ user, vehicle, orderNumber, lastUsedAt }) => (
              <button
                key={`${user.id}-${vehicle.id}`}
                type="button"
                onClick={() => onSelect(user.id, vehicle.id)}
                className={`text-left text-xs rounded-lg border px-3 py-2 transition-colors max-w-full ${
                  userId === user.id && vehicleId === vehicle.id
                    ? "border-bm-red bg-bm-red/15 text-white"
                    : "border-bm-border hover:border-bm-red/50 text-bm-muted hover:text-white"
                }`}
              >
                <span className="font-semibold text-white block truncate">
                  {vehicle.make} {vehicle.model} · {vehicle.plate}
                </span>
                <span className="block truncate">{clientLabel(user)}</span>
                <span className="block text-[10px] text-bm-red mt-0.5">
                  {orderNumber} · {lastUsedAt.slice(0, 10)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!userId && (
        <p className="text-xs text-bm-muted">{w.selectClientVehicle}</p>
      )}
      {!userId && clientPickHint && (
        <p className="text-xs text-amber-400">{clientPickHint}</p>
      )}

      <AddClientModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onCreated={(uid, vid) => {
          onSelect(uid, vid);
          setClientQ("");
          setClientPickHint("");
          setClientModalOpen(false);
        }}
      />
      <AddClientModal
        open={companyModalOpen}
        initialClientType="company"
        onClose={() => setCompanyModalOpen(false)}
        onCreated={(uid, vid) => {
          onSelect(uid, vid);
          setClientQ("");
          setClientPickHint("");
          setCompanyModalOpen(false);
        }}
      />
      <AddVehicleModal
        open={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        initialUserId={(vehicleModalUserId ?? userId) || undefined}
        onCreated={(vid, uid) => {
          onSelect(uid, vid);
          setClientQ("");
          setVehicleModalOpen(false);
        }}
      />
    </div>
  );
}
