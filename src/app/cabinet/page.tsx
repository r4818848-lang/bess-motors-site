import { redirect } from "next/navigation";

/** Client cabinet removed — booking only. Staff login: /crm/login */
export default async function CabinetPage({
  searchParams,
}: {
  searchParams: Promise<{ crm?: string }>;
}) {
  const sp = await searchParams;
  if (sp.crm === "1") {
    redirect("/crm/login");
  }
  redirect("/booking");
}
