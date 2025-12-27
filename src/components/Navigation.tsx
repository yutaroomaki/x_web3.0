"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  Settings,
  History,
  Database,
  LayoutTemplate,
} from "lucide-react";

const navItems = [
  { href: "/drafts", label: "Drafts", icon: FileText },
  { href: "/sources", label: "Sources", icon: Database },
  { href: "/jobs", label: "Jobs", icon: History },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">GXVIS</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <Link
            href="/settings"
            className="p-2 text-gray-300 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
