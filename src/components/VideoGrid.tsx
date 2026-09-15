"use client";

import { useState } from "react";
import type { Video } from "@/lib/types";
import VideoCard from "./VideoCard";
import VideoLightbox from "./VideoLightbox";

export default function VideoGrid({ videos }: { videos: Video[] }) {
  const [active, setActive] = useState<Video | null>(null);

  if (videos.length === 0) {
    return (
      <p className="rounded-sm border border-dashed border-line py-16 text-center text-sm text-muted">
        No videos in this category yet.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, i) => (
          <div key={video.id} className="animate-reveal">
            <VideoCard video={video} onPlay={setActive} index={i} />
          </div>
        ))}
      </div>

      {active && <VideoLightbox video={active} onClose={() => setActive(null)} />}
    </>
  );
}
