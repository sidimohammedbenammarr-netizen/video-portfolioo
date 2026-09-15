"use client";

import { useState } from "react";
import type { Video } from "@/lib/types";

export default function VideoCard({
  video,
  onPlay,
  index,
}: {
  video: Video;
  onPlay: (video: Video) => void;
  index: number;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onPlay(video)}
      className="group relative flex flex-col overflow-hidden rounded-sm border border-line/70 bg-panel text-left transition-colors hover:border-bronze/60"
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
      aria-label={`Play ${video.title}`}
    >
      <span className="relative block aspect-video w-full overflow-hidden bg-panel2">
        {!imgError && video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail_url}
            alt=""
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs text-muted">
            No thumbnail
          </span>
        )}

        <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/60 text-bone ring-1 ring-bone/30 backdrop-blur transition-all group-hover:scale-110 group-hover:bg-bronze group-hover:text-ink group-hover:ring-bronze">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>

        {video.duration && (
          <span className="absolute bottom-2 right-2 rounded-sm bg-ink/75 px-1.5 py-0.5 text-[11px] text-bone/90">
            {video.duration}
          </span>
        )}
      </span>

      <span className="flex flex-1 flex-col gap-1.5 px-4 py-4">
        <span className="text-[11px] text-bronze2">{video.category}</span>
        <span className="font-display text-lg leading-snug text-bone">
          {video.title}
        </span>
        {video.description && (
          <span className="line-clamp-2 text-sm text-muted">
            {video.description}
          </span>
        )}
        {video.client && (
          <span className="mt-1 text-xs text-muted/70">for {video.client}</span>
        )}
      </span>
    </button>
  );
}
