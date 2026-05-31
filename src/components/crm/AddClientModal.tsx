"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, Building2, User } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb, type ClientType, type PaymentMethod } from "@/lib/store";
import { createCrmClientWithVehicle } from "@/lib/crm-create-client";
import { PAYMENT_METHODS } from "@/lib/payment";
import { CrmModalShell } from "./CrmModalShell";
import { CrmFormField } from "./CrmFormField";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (userId: string, vehicleId: string) => void;
  initialClientType?: ClientType;
};

const PAYMENT_DAYS = ["0", "7", "14", "30", "60"] as const;

export function AddClientModal({
  open,
  onClose,
  onCreated,
  initialClientType = "person",
}: Props) {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const pm = t.paymentMethods;

  const [clientType, setClientType] = useState<ClientType>(initialClientType);

  useEffect(() => {
    if (open) setClientType(initialClientType);
  }, [open, initialClientType]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [nip, setNip] = useState("");
  const [regon, setRegon] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [country, setCountry] = useState("PL");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentDays, setPaymentDays] = useState<string>("14");
  const [discountServices, setDiscountServices] = useState("");
  const [discountParts, setDiscountParts] = useState("");
  const [clientDescription, setClientDescription] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [nipLoading, setNipLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);

  const lookupNip = async () => {
    const digits = nip.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError(c.nipInvalid);
      return;
    }
    setNipLoading(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch(`/api/nip/lookup?nip=${digits}`, { cache: "no-store" });
      const data = (await res.json()) as {
        found?: boolean;
        name?: string;
        regon?: string;
        street?: string;
        city?: string;
        postalCode?: string;
        country?: string;
        source?: "vat" | "regon";
        error?: string;
      };
      if (!data.found) {
        setError(
          data.error === "invalid_checksum"
            ? c.nipInvalid
            : data.error === "network_error"
              ? c.nipLookupFailed
              : c.nipNotFound
        );
        return;
      }
      if (data.name) setCompanyName(data.name);
      if (data.regon) setRegon(data.regon);
      if (data.street) setStreet(data.street);
      if (data.city) setCity(data.city);
      if (data.postalCode) setPostalCode(data.postalCode);
      if (data.country) setCountry(data.country);
      setInfo(data.source === "regon" ? c.nipDecodedRegon : c.nipDecoded);
    } catch {
      setError(c.nipLookupFailed);
    } finally {
      setNipLoading(false);
    }
  };

  const submit = async () => {
    setError("");
    setInfo("");
    setSaving(true);
    try {
      const displayName =
        clientType === "company"
          ? companyName.trim()
          : `${firstName.trim()} ${lastName.trim()}`.trim();

      const db = loadDb();
      const result = await createCrmClientWithVehicle(db, {
        clientType,
        name: displayName,
        companyName: clientType === "company" ? companyName.trim() : undefined,
        nip: clientType === "company" ? nip : undefined,
        regon: clientType === "company" ? regon : undefined,
        contactFirstName: firstName.trim() || undefined,
        contactLastName: lastName.trim() || undefined,
        phone,
        email,
        postalCode,
        city,
        street,
        country,
        clientPaymentMethod: paymentMethod || undefined,
        clientPaymentDays: paymentDays as "0" | "7" | "14" | "30" | "60",
        discountServicesPercent: discountServices ? Number(discountServices) : undefined,
        discountPartsPercent: discountParts ? Number(discountParts) : undefined,
        clientDescription,
        marketingConsent,
        plate,
        make,
        model,
        vin,
        mileage: mileage ? Number(mileage) : undefined,
      });

      if (!result.ok) {
        setError(
          result.error === "phone_required"
            ? c.phoneRequired
            : result.error === "company_required"
              ? c.companyNameRequired
              : c.nameRequired
        );
        return;
      }
      saveDb(db);
      if (!result.createdUser) setInfo(c.existingClientLinked);
      onCreated(result.userId, result.vehicleId);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrmModalShell
      open={open}
      onClose={onClose}
      wide
      title={c.newClientTitle}
      icon={<UserPlus className="text-bm-red shrink-0" size={22} />}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? c.savingClient : c.createClient}
          </Button>
        </>
      }
    >
      <div className="crm-client-type-toggle flex justify-center gap-0 mb-6 rounded-lg border border-bm-border overflow-hidden max-w-md mx-auto">
        <button
          type="button"
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
            clientType === "person"
              ? "bg-bm-red text-white"
              : "bg-bm-graphite text-bm-muted hover:text-white"
          }`}
          onClick={() => setClientType("person")}
        >
          <User size={14} className="inline mr-1.5" />
          {c.clientTypePerson}
        </button>
        <button
          type="button"
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
            clientType === "company"
              ? "bg-bm-red text-white"
              : "bg-bm-graphite text-bm-muted hover:text-white"
          }`}
          onClick={() => setClientType("company")}
        >
          <Building2 size={14} className="inline mr-1.5" />
          {c.clientTypeCompany}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          {clientType === "company" && (
            <>
              <CrmFormField label={c.companyName} required>
                <input
                  className="input-premium"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </CrmFormField>
              <CrmFormField label={c.nipLabel}>
                <div className="flex gap-2">
                  <input
                    className="input-premium flex-1 font-mono"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void lookupNip();
                      }
                    }}
                    placeholder="0000000000"
                  />
                  <button
                    type="button"
                    className="btn-primary px-3 shrink-0"
                    onClick={() => void lookupNip()}
                    disabled={nipLoading}
                    title={c.nipLookup}
                  >
                    <Search size={18} />
                  </button>
                </div>
              </CrmFormField>
            </>
          )}
          <CrmFormField label={w.clientName.split(" ")[0] || c.firstName}>
            <input
              className="input-premium"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </CrmFormField>
          <CrmFormField label={c.lastName}>
            <input
              className="input-premium"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </CrmFormField>
          <div className="grid grid-cols-2 gap-3">
            <CrmFormField label={c.postalCode}>
              <input
                className="input-premium"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </CrmFormField>
            <CrmFormField label={c.city}>
              <input
                className="input-premium"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </CrmFormField>
          </div>
          <CrmFormField label={c.street}>
            <input
              className="input-premium"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </CrmFormField>
          <CrmFormField label={c.country}>
            <input
              className="input-premium"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </CrmFormField>
        </div>

        <div className="space-y-4">
          {clientType === "company" && regon && (
            <CrmFormField label="REGON">
              <input className="input-premium font-mono" value={regon} readOnly />
            </CrmFormField>
          )}
          <CrmFormField label={w.clientPhone} required>
            <input
              className="input-premium"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </CrmFormField>
          <CrmFormField label={c.email}>
            <input
              className="input-premium"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </CrmFormField>
          <CrmFormField label={w.paymentMethodLabel}>
            <select
              className="input-premium"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod((e.target.value || "") as PaymentMethod | "")}
            >
              <option value="">—</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {pm[m]}
                </option>
              ))}
            </select>
          </CrmFormField>
          <CrmFormField label={c.paymentTerms}>
            <select
              className="input-premium"
              value={paymentDays}
              onChange={(e) => setPaymentDays(e.target.value)}
            >
              {PAYMENT_DAYS.map((d) => (
                <option key={d} value={d}>
                  {d === "0" ? c.paymentImmediate : `${d} ${c.days}`}
                </option>
              ))}
            </select>
          </CrmFormField>
          <div className="grid grid-cols-2 gap-3">
            <CrmFormField label={c.discountServices}>
              <input
                className="input-premium"
                type="number"
                min={0}
                max={100}
                value={discountServices}
                onChange={(e) => setDiscountServices(e.target.value)}
              />
            </CrmFormField>
            <CrmFormField label={c.discountParts}>
              <input
                className="input-premium"
                type="number"
                min={0}
                max={100}
                value={discountParts}
                onChange={(e) => setDiscountParts(e.target.value)}
              />
            </CrmFormField>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-bm-red font-bold">
            {c.mainVehicleSection}
          </p>
          <CrmFormField label={w.plate}>
            <input
              className="input-premium"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
            />
          </CrmFormField>
          <CrmFormField label={w.make}>
            <input className="input-premium" value={make} onChange={(e) => setMake(e.target.value)} />
          </CrmFormField>
          <CrmFormField label={w.model}>
            <input className="input-premium" value={model} onChange={(e) => setModel(e.target.value)} />
          </CrmFormField>
          <CrmFormField label="VIN">
            <input
              className="input-premium font-mono"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              maxLength={17}
            />
          </CrmFormField>
          <CrmFormField label={w.mileage}>
            <input
              className="input-premium"
              type="number"
              min={0}
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
            />
          </CrmFormField>
          <CrmFormField label={c.clientDescriptionLabel}>
            <textarea
              className="input-premium min-h-[100px]"
              value={clientDescription}
              onChange={(e) => setClientDescription(e.target.value)}
            />
          </CrmFormField>
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="accent-bm-red w-4 h-4"
            />
            <span className="text-bm-muted">{c.marketingConsent}</span>
          </label>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {info && (
        <p className="mt-4 text-sm text-green-400/90 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
          {info}
        </p>
      )}
    </CrmModalShell>
  );
}
