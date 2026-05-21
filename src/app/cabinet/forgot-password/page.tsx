"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Password reset removed — clients use registration plate */
export default function ForgotPasswordPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/cabinet");
  }, [router]);
  return null;
}
