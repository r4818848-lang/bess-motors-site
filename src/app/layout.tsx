import type { Metadata } from "next";

import { Inter, Orbitron } from "next/font/google";

import "./globals.css";

import { Providers } from "./providers";

import { Header } from "@/components/layout/Header";

import { Footer } from "@/components/layout/Footer";
import { GoogleAdsTag } from "@/components/analytics/GoogleAdsTag";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { StickyContactBar } from "@/components/layout/StickyContactBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl, googleSiteVerification } from "@/lib/seo";



const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });



const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BESS MOTORS — Serwis samochodowy Warszawa",
    template: "%s | BESS MOTORS",
  },
  description:
    "BESS MOTORS — serwis samochodowy Warszawa, Aleja Krakowska. Szynomontaż, klimatyzacja, wymiana oleju, chip tuning, mechanika. Online booking i konto klienta.",
  keywords: [
    "BESS MOTORS",
    "serwis samochodowy Warszawa",
    "warsztat samochodowy",
    "szynomontaż Warszawa",
    "chip tuning",
    "wymiana oleju",
  ],
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: siteUrl,
    siteName: "BESS MOTORS",
    title: "BESS MOTORS — Serwis samochodowy Warszawa",
    description:
      "Szybko, profesjonalnie, najlepsze ceny — serwis i tuning w Warszawie.",
    images: [{ url: "/images/banner.png", width: 1200, height: 630, alt: "BESS MOTORS" }],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: siteUrl },
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
};



/** Fallback styles when Tailwind chunk fails to load in dev */

const criticalCss = `

  *,*::before,*::after{box-sizing:border-box}

  html,body{margin:0;min-height:100%;background:#0a0a0a!important;color:#fff!important;font-family:system-ui,sans-serif}

  main{min-height:60vh}

  header{position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(20,20,20,.92);border-bottom:1px solid #2a2a2a;backdrop-filter:blur(12px)}

  header>div{max-width:80rem;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem 1rem}

  header nav{display:none;flex-wrap:wrap;gap:.25rem}

  @media(min-width:1280px){header nav{display:flex}}

  header a,nav a{color:#888;text-decoration:none;font-size:.875rem;padding:.5rem .75rem;border-radius:.5rem}

  header a:hover,nav a:hover{color:#e10600}

  .btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.5rem 1rem;background:linear-gradient(135deg,#e10600,#a00400);color:#fff;font-weight:600;text-transform:uppercase;font-size:.75rem;border-radius:.5rem;border:none;cursor:pointer;text-decoration:none}

  .btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.5rem 1rem;border:1px solid rgba(225,6,0,.5);color:#fff;border-radius:.5rem;text-decoration:none}

  .input-premium{width:100%;padding:.75rem 1rem;background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;color:#fff;margin-bottom:1rem}

  .glass-red,.card-premium{background:rgba(26,26,26,.9);border:1px solid rgba(225,6,0,.25);border-radius:.75rem;padding:1.5rem}

  footer{border-top:1px solid rgba(225,6,0,.3);background:#141414;margin-top:5rem;padding:3rem 1rem}

  footer>div{max-width:80rem;margin:0 auto}

  img{max-width:100%;height:auto}
  .text-bm-red{color:#e10600!important}
  .text-bm-muted{color:#888!important}
  .font-display{font-weight:700;letter-spacing:.05em}
`;



export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (

    <html lang="pl" className={`${inter.variable} ${orbitron.variable}`} suppressHydrationWarning>

      <head>
        <GoogleAdsTag />
        <MetaPixel />
        <style dangerouslySetInnerHTML={{ __html: criticalCss }} />
      </head>

      <body

        className="min-h-screen bg-bm-black text-white font-body antialiased"

        style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}

        suppressHydrationWarning

      >
        <JsonLd />
        <GoogleAnalytics />
        <Providers>
          <Header />
          <main className="min-h-screen pb-16 md:pb-0">{children}</main>
          <Footer />
          <StickyContactBar />
        </Providers>

      </body>

    </html>

  );

}


