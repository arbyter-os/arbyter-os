"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  ["Platform", "/platform"],
  ["How It Works", "/how-it-works"],
  ["Use Cases", "/use-cases"],
  ["Resources", "/resources"],
  ["Pricing", "/pricing"],
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className={open ? "site-nav is-open" : "site-nav"}>
      <Link href="/" className="site-wordmark" onClick={() => setOpen(false)}>
        ARBYTER<span>/OS</span>
      </Link>

      <nav className="site-nav-links">
        {links.map(([label, href]) => (
          <Link key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="site-nav-actions">
        <Link href="/login" className="site-nav-auth" onClick={() => setOpen(false)}>
          SIGN IN
        </Link>
        <Link href="/sign-up" className="site-nav-auth" onClick={() => setOpen(false)}>
          SIGN UP
        </Link>
        <Link href="/demo" className="site-enter" onClick={() => setOpen(false)}>
          BOOK YOUR SLOT
        </Link>
        <button
          type="button"
          className="site-menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-site-nav"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </div>

      <nav id="mobile-site-nav" className="site-mobile-nav" aria-hidden={!open}>
        {links.map(([label, href], index) => (
          <Link key={href} href={href} onClick={() => setOpen(false)}>
            <span>0{index + 1}</span>
            {label}
          </Link>
        ))}
        <Link href="/pricing" onClick={() => setOpen(false)}>
          <span>06</span>
          Pricing
        </Link>
        <Link href="/login" onClick={() => setOpen(false)}>
          <span>07</span>
          Sign In
        </Link>
        <Link href="/sign-up" onClick={() => setOpen(false)}>
          <span>08</span>
          Sign Up
        </Link>
        <Link href="/demo" onClick={() => setOpen(false)}>
          <span>09</span>
          Book Your Slot
        </Link>
      </nav>
    </header>
  );
}
