"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  if (isLogin) {
    return <div className="min-h-screen bg-ink">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-line/60">
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-display text-lg text-bone">
              Admin<span className="text-bronze">.</span>
            </Link>
            <nav className="flex gap-5 text-sm">
              <Link href="/admin" className="text-muted hover:text-bronze2">
                Dashboard
              </Link>
              <Link href="/admin/new" className="text-muted hover:text-bronze2">
                Add video
              </Link>
              <Link href="/" className="text-muted hover:text-bronze2">
                View site
              </Link>
            </nav>
          </div>
          <button
            onClick={signOut}
            className="rounded-sm border border-line px-3.5 py-1.5 text-sm text-muted hover:border-bronze/60 hover:text-bronze2"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-content px-6 py-10 md:px-10">{children}</main>
    </div>
  );
}
