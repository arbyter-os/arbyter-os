import type { ReactNode } from "react";
import { SiteNav } from "./SiteNav";

export function PageFrame({ eyebrow, title, intro, children }: { eyebrow:string; title:ReactNode; intro:string; children:ReactNode }) {
 return <main className="site-page"><SiteNav/><section className="page-hero"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{intro}</p></section>{children}</main>;
}
