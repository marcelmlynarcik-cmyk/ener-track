"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, Layers, BarChart2 } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Prehľad" },
  { href: "/electricity", icon: Zap, label: "Elektrina" },
  { href: "/pellets", icon: Layers, label: "Pelety" },
  { href: "/statistics", icon: BarChart2, label: "Štatistiky" },
];

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white shadow-sm md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="mx-auto flex max-w-6xl justify-around md:justify-start md:gap-2 md:px-6">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              href={href}
              key={href}
              className={`flex w-full flex-col items-center justify-center px-3 pt-2 pb-1 text-sm transition-colors md:w-auto md:flex-row md:gap-2 md:py-4 md:font-medium ${
                isActive
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="mb-1 h-6 w-6 md:mb-0 md:h-4 md:w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
