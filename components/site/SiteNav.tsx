import Link from "next/link";

const links = [
  ["Platform","/platform"],
  ["How it works","/how-it-works"],
  ["Intelligence","/intelligence"],
  ["Security","/ai-agent-security"],
  ["Discovery","/agent-discovery"],
  ["Demo","/demo"],
];

export function SiteNav() {
  return (
    <header className="site-nav">
      <Link href="/" className="site-wordmark">ARBYTER<span>/OS</span></Link>
      <nav>
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <Link href="/login" className="site-enter">ENTER</Link>
    </header>
  );
}
