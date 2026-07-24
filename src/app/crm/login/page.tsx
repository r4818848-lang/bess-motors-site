"use client";

import { Suspense } from "react";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";

function CrmLoginForm() {
  return (
    <div className="pt-28 pb-24 min-h-[70vh] flex items-center justify-center px-4">
      <PhoneAuthForm staffCrm />
    </div>
  );
}

export default function CrmLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-28 pb-24 min-h-[70vh] flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-bm-red border-t-transparent animate-spin" />
        </div>
      }
    >
      <CrmLoginForm />
    </Suspense>
  );
}
