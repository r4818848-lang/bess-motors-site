import { redirect } from "next/navigation";

/** Gallery removed — redirect old links to home */
export default function GalleryPage() {
  redirect("/");
}
