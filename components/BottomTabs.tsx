"use client";
// components/BottomTabs.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library } from "lucide-react";

const TABS = [
  { href: "/",        label: "Home",        Icon: Home },
  { href: "/search",  label: "Search",      Icon: Search },
  { href: "/library", label: "Your Library", Icon: Library },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="bottom-tabs" aria-label="Main navigation">
      {TABS.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            id={`tab-${label.toLowerCase().replace(/\s/g, "-")}`}
            className={`tab-item${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={24} strokeWidth={active ? 2.5 : 1.75} />
            <span className="text-xs">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
