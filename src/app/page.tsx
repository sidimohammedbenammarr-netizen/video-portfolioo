import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import VideoGrid from "@/components/VideoGrid";
import type { Video } from "@/lib/types";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("published", true)
    .order("order", { ascending: true })
    .limit(4);

  const featured = (data ?? []) as Video[];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="relative mx-auto flex max-w-content flex-col px-6 py-24 md:px-10 md:py-36">
          <p className="animate-reveal text-sm text-bronze2">Video Editor</p>
          <h1 className="animate-reveal mt-5 max-w-3xl font-display text-5xl font-light leading-[1.05] text-bone md:text-7xl">
            Sidi Mohammed edits footage into
            <em className="italic text-bronze2"> films people actually finish watching.</em>
          </h1>
          <p className="animate-reveal mt-7 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            I cut reels, ads, motion graphics and YouTube videos for brands and
            creators who need pace, clarity and a look that holds up on any
            screen — from a six-second hook to a ten-minute story.
          </p>
          <div className="animate-reveal mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/work"
              className="rounded-sm bg-bronze px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02] hover:bg-bronze2"
            >
              View My Work
            </Link>
            <Link
              href="/contact"
              className="rounded-sm border border-line px-7 py-3.5 text-sm text-bone transition-colors hover:border-bronze/70 hover:text-bronze2"
            >
              Contact Me
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED WORK PREVIEW */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-content px-6 py-20 md:px-10 md:py-28">
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-light text-bone md:text-4xl">
              Recent work
            </h2>
            <Link
              href="/work"
              className="whitespace-nowrap text-sm text-muted transition-colors hover:text-bronze2"
            >
              See full portfolio
            </Link>
          </div>
          <VideoGrid videos={featured} />
        </section>
      )}
    </>
  );
}
