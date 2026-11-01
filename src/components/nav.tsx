"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contacts", label: "Contacts" },
  { href: "/tasks", label: "Tasks" },
  { href: "/outreach", label: "Outreach" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/settings", label: "Settings" },
] as const;

/** Navigation links; highlights the one matching `pathname`. */
export function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto md:flex-col">
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
              active ? "bg-white/15 text-white" : "text-indigo-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Primary navigation bound to the current URL. */
export function Nav() {
  return <NavLinks pathname={usePathname()} />;
}
