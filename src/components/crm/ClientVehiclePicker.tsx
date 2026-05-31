"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, UserPlus, Car, User } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { useDbSync } from "@/hooks/useDbSync";
import {
  searchClientsAndVehicles,
  searchClientsOnly,
  searchVehiclesOnly,
} from "@/lib/workorder-search";
import { NewClientForm } from "./NewClientForm";

type Props = {
  userId: string;
  vehicleId: string;
  onSelect: (userId: string, vehicleId: string) => void;
  onAddNewClient?: () => void;
};

export function ClientVehiclePicker({ userId, vehicleId, onSelect, onAddNewClient }: Props) {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const dbTick = useDbSync();
  const db = useMemo(() => loadDb(), [dbTick]);

  const [vehicleQ, setVehicleQ] = useState("");
  const [clientQ, setClientQ] = useState("");
  const [showVehicleList, setShowVehicleList] = useState(false);
  const [showClientList, setShowClientList] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const vehicleRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<HTMLDivElement>(null);

  const selectedUser = db.users.find((u) => u.id === userId);
  const selectedVehicle = db.vehicles.find((v) => v.id === vehicleId);
  const clientVehicles = userId
    ? db.vehicles.filter((v) => v.userId === userId)
    : [];

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
            <ul className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto glass-red rounded-lg border border-bm-border shadow-lg">
              {(vehicleQ.length >= 2 ? combinedResults : vehicleResults).map(({ user, vehicle }) =>
                vehicle ? (
                  <li key={`${user.id}-${vehicle.id}`}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-bm-red/10 text-sm border-b border-bm-border/50 last:border-0"
                      onClick={() => pickVehicle(user.id, vehicle.id)}
                    >
                      <span className="font-semibold">
                        {vehicle.make} {vehicle.model}
                        {vehicle.year ? ` ${vehicle.year}` : ""}
                      </span>
                      <span className="block font-mono text-xs text-bm-red mt-0.5">
                        {vehicle.plate} · {vehicle.vin || "—"}
                      </span>
                      <span className="block text-[10px] text-bm-muted mt-0.5">{user.name}</span>
                    </button>
                  </li>
                ) : null
              )}
            </ul>
          )}
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
                    ? `${selectedUser.name} · ${selectedUser.phone}`
                    : clientQ
              }
              onChange={(e) => {
                setClientQ(e.target.value);
                setShowClientList(true);
              }}
              onFocus={() => setShowClientList(true)}
            />
          </div>
          {showClientList && (
            <ul className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto glass-red rounded-lg border border-bm-border shadow-lg">
              <li>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-bm-red font-semibold hover:bg-bm-red/10"
                  onClick={() => {
                    setShowNewClient(true);
                    setShowClientList(false);
                    onAddNewClient?.();
                  }}
                >
                  <UserPlus size={14} className="inline mr-2" />
                  {c.addNewClient}
                </button>
              </li>
              {clientResults.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-bm-red/10 text-sm border-b border-bm-border/50"
                    onClick={() => pickClient(user.id)}
                  >
                    <span className="font-semibold">{user.name || "—"}</span>
                    <span className="block font-mono text-xs text-bm-red">{user.phone}</span>
                    {user.email && (
                      <span className="block text-[10px] text-bm-muted">{user.email}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showNewClient && (
        <NewClientForm
          compact
          onCreated={(uid, vid) => {
            onSelect(uid, vid);
            setShowNewClient(false);
          }}
          onCancel={() => setShowNewClient(false)}
        />
      )}

      {!userId && !showNewClient && (
        <p className="text-xs text-bm-muted">{w.selectClientVehicle}</p>
      )}
    </div>
  );
}
