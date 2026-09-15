"use client";

import { useMemo, useState } from "react";
import type { Video } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import VideoGrid from "./VideoGrid";

const TABS = ["All", ...CATEGORIES] as const;

export default function PortfolioBrowser({ videos }: { videos: Video[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");

  const filtered = useMemo(
    () => (tab === "All" ? videos : videos.filter((v) => v.category === tab)),
    [videos, tab]
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter by category"
        className="mb-10 flex flex-wrap gap-2"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-sm border px-4 py-2 text-sm transition-colors ${
              tab === t
                ? "border-bronze bg-bronze text-ink"
                : "border-line text-muted hover:border-bronze/60 hover:text-bronze2"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <VideoGrid videos={filtered} />
    </div>
  );
}
