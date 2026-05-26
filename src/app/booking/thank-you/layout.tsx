import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Rezerwacja przyjęta",
  robots: { index: false, follow: false },
  alternates: { canonical: `${getSiteUrl()}/booking/thank-you` },
};

/** Schedule + CompleteRegistration in HTML (like PageView) — reliable for Meta Test Events */
export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `if(typeof fbq!=='undefined'){fbq('track','Schedule');fbq('track','CompleteRegistration');}`,
        }}
      />
      {children}
    </>
  );
}
