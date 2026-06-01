export type AdminQuickTemplate = {
  id: string;
  label: string;
  pl: string;
  ru: string;
};

export const adminQuickTemplates: AdminQuickTemplate[] = [
  {
    id: "ready",
    label: "Gotowe",
    pl: "✅ Państwa auto jest gotowe do odbioru. Prosimy o odbiór w godzinach pracy.",
    ru: "✅ Ваш автомобиль готов к выдаче. Заберите в часы работы сервиса.",
  },
  {
    id: "parts",
    label: "Części",
    pl: "📦 Części zamówione — informujemy gdy dotrą i rozpoczniemy montaż.",
    ru: "📦 Запчасти заказаны — сообщим, когда приедут и начнём работы.",
  },
  {
    id: "delay",
    label: "Opóźnienie",
    pl: "⏳ Naprawa trwa dłużej z powodu dodatkowych usterek — skontaktujemy się dziś.",
    ru: "⏳ Ремонт затягивается из‑за дополнительных неисправностей — свяжемся сегодня.",
  },
  {
    id: "sign",
    label: "Podpis",
    pl: "✍️ Prosimy o podpis dokumentu w kabinecie lub przez link (WhatsApp / SMS).",
    ru: "✍️ Пожалуйста, подпишите документ в кабинете или по ссылке (WhatsApp / SMS).",
  },
];

export function formatTemplatesList(): string {
  return adminQuickTemplates
    .map((t, i) => `${i + 1}. <b>${t.label}</b> — /tpl ${t.id}`)
    .join("\n");
}

export function getTemplateById(id: string): AdminQuickTemplate | undefined {
  return adminQuickTemplates.find((t) => t.id === id);
}
