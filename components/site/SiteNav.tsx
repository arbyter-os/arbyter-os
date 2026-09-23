"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  ["Platform", "/platform"],
  ["How it works", "/how-it-works"],
  ["Intelligence", "/ai-agent-command"],
  ["Security", "/ai-agent-security"],
  ["Discovery", "/agent-discovery"],
  ["Pricing", "/pricing"],
  ["Demo", "/demo"],
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
        <Link href="/login" className="site-enter" onClick={() => setOpen(false)}>
          ENTER
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
      </nav>
    </header>
  );
}
