import { redirect } from "next/navigation";

/** Admin CRM entry — separate URL from public client site */
export default function AdminEntryPage() {
  redirect("/crm");
}
