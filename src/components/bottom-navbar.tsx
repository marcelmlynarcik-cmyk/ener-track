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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden">
      <div className="flex justify-around">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              href={href}
              key={href}
              className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
