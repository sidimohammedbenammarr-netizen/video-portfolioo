import { createClient } from "@/lib/supabase/server";
import PortfolioBrowser from "@/components/PortfolioBrowser";
import type { Video } from "@/lib/types";

export const revalidate = 0;
export const metadata = { title: "Work — Sidi Mohammed" };

export default async function WorkPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("published", true)
    .order("order", { ascending: true });

  const videos = (data ?? []) as Video[];

  return (
    <section className="mx-auto max-w-content px-6 py-20 md:px-10 md:py-28">
      <div className="mb-14 max-w-2xl">
        <p className="text-sm text-bronze2">Portfolio</p>
        <h1 className="mt-3 font-display text-4xl font-light text-bone md:text-5xl">
          Selected work
        </h1>
        <p className="mt-4 text-muted">
          A running edit of reels, ads, motion graphics and long-form videos.
          Filter by category, click any thumbnail to watch it in full.
        </p>
      </div>

      <PortfolioBrowser videos={videos} />
    </section>
  );
}
