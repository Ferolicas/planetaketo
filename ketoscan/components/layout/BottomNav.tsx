"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, CalendarDays, CalendarRange, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/alimentos", label: "Alimentos", icon: Apple },
  { href: "/menu-dia", label: "Menu dia", icon: CalendarDays },
  { href: "/menu-semanal", label: "Semana", icon: CalendarRange },
  { href: "/yo", label: "Yo", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t bg-background/95 backdrop-blur">
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
