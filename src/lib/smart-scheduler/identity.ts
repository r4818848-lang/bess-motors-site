export type MechanicColumn = {
  id: string;
  crmName: string;
  label: string;
  confirmed: boolean;
  note: string;
};

const SERGEY = /siergiej|sergey|сергей|сергей/i;
const ANDREY = /andrzej|andrey|андрей/i;

/** Synthetic tests may use both mechanics. Live auto-assignment waits for a confirmed identity. */
export function mayAutoAssignMechanic(mechanic: { confirmed: boolean }, source: "live" | "fixture"): boolean {
  if (source === "fixture") return true;
  return mechanic.confirmed;
}

export function mechanicColumn(profile: { id: string; name: string }): MechanicColumn {
  const name = profile.name.trim();
  if (profile.id === "mech-1" && SERGEY.test(name)) {
    return { id: profile.id, crmName: name, label: "Сергей", confirmed: true, note: "ID mech-1 сохранён." };
  }
  if (profile.id === "mech-2" && ANDREY.test(name)) {
    return { id: profile.id, crmName: name, label: "Андрей", confirmed: true, note: "ID mech-2 сохранён." };
  }
  if (profile.id === "mech-2") {
    return {
      id: profile.id,
      crmName: name,
      label: "Механик 2 · имя уточняется",
      confirmed: false,
      note: "Личность mech-2 не подтверждена. ID, учётная запись и история заказов не переименованы. Реальные работы автоматически не назначаются.",
    };
  }
  return {
    id: profile.id,
    crmName: name,
    label: name || profile.id,
    confirmed: false,
    note: "Соответствие имени не подтверждено. ID не переименован.",
  };
}
