"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
import { Logo } from "@/components/brand/Logo";
import { seoFooterServiceLinks } from "@/lib/seo-footer-links";

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-bm-red/30 bg-bm-graphite mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <Logo size="md" />
            <p className="mt-4 text-sm text-bm-muted max-w-xs">{t.footer.desc}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <Link href="/services" className="text-bm-muted hover:text-bm-red transition-colors">
              {t.nav.services}
            </Link>
            <Link href="/cennik" className="text-bm-muted hover:text-bm-red transition-colors">
              {t.nav.priceList}
            </Link>
            <BookingLink trackSource="footer" className="text-bm-muted hover:text-bm-red transition-colors">
              {t.nav.booking}
            </BookingLink>
            <Link href="/about" className="text-bm-muted hover:text-bm-red transition-colors">
              {t.nav.about}
            </Link>
            <Link href="/gallery" className="text-bm-muted hover:text-bm-red transition-colors">
              {t.nav.gallery}
            </Link>
            <Link href="/faq" className="text-bm-muted hover:text-bm-red transition-colors">
              {t.nav.faq}
            </Link>
            <Link href="/blog" className="text-bm-muted hover:text-bm-red transition-colors">
              {t.nav.blog}
            </Link>
            <Link href="/cabinet" className="text-bm-muted hover:text-bm-red transition-colors">
              {t.nav.cabinet}
            </Link>
            <Link href="/status" className="text-bm-muted hover:text-bm-red transition-colors">
              {t.nav.repairStatus}
            </Link>
            <Link href="/referral" className="text-bm-muted hover:text-bm-red transition-colors">
              {t.nav.referral}
            </Link>
            <Link href="/contacts" className="text-bm-muted hover:text-bm-red transition-colors">
              {t.nav.contacts}
            </Link>
          </div>

          <div className="space-y-3 text-sm">
            <PhoneLink
              trackSource="footer"
              className="flex items-center gap-2 text-white font-display text-lg font-bold hover:text-bm-red transition-colors"
            >
              <Phone className="w-5 h-5 text-bm-red" />
              {siteConfig.phone}
            </PhoneLink>
            <p className="flex items-start gap-2 text-bm-muted">
              <MapPin className="w-4 h-4 text-bm-red shrink-0 mt-0.5" />
              {siteConfig.address}
            </p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="flex items-center gap-2 text-bm-muted hover:text-white"
            >
              <Mail className="w-4 h-4 text-bm-red" />
              {siteConfig.email}
            </a>
            <div className="flex flex-wrap gap-4 pt-2">
              <SocialContactLink
                kind="telegram"
                trackSource="footer"
                className="text-bm-muted hover:text-bm-red text-xs uppercase"
              >
                Telegram @bessmotors
              </SocialContactLink>
              <SocialContactLink
                kind="whatsapp"
                trackSource="footer"
                className="text-bm-muted hover:text-bm-red text-xs uppercase"
              >
                WhatsApp
              </SocialContactLink>
              <a
                href={siteConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-bm-muted hover:text-bm-red"
              >
                <Instagram className="w-4 h-4" /> bessmotors.pl
              </a>
              <a
                href={siteConfig.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-bm-muted hover:text-bm-red"
              >
                <Facebook className="w-4 h-4" /> bessmotorss
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-bm-border pt-8">
          <p className="text-xs uppercase text-bm-muted mb-3 tracking-wider">Usługi w Warszawie</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            {seoFooterServiceLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-bm-muted hover:text-bm-red transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-bm-border pt-8 text-xs text-bm-muted sm:flex-row">
          <span>
            © {year} BESS MOTORS — {t.common.allRights}
          </span>
          <Link href="/privacy" className="hover:text-bm-red transition-colors">
            {t.common.privacy}
          </Link>
        </div>
      </div>
    </footer>
  );
}
