"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto flex max-w-content flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center md:px-10">
        <p className="font-display text-lg text-bone">
          SM<span className="text-bronze">.</span>
          <span className="ml-2 text-sm text-muted">Video Editor</span>
        </p>
        <div className="flex gap-6 text-sm text-muted">
          <Link href="/work" className="hover:text-bronze2">
            Work
          </Link>
          <Link href="/contact" className="hover:text-bronze2">
            Contact
          </Link>
          <Link href="/admin/login" className="hover:text-bronze2">
            Admin
          </Link>
        </div>
        <p className="text-xs text-muted/70">
          &copy; {new Date().getFullYear()} Sidi Mohammed. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
