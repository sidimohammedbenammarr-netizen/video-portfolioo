"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { deleteFromStorageIfOwned } from "@/lib/storage";
import type { Video } from "@/lib/types";

export default function AdminVideoList({ initialVideos }: { initialVideos: Video[] }) {
  const [videos, setVideos] = useState(
    [...initialVideos].sort((a, b) => a.order - b.order)
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  async function togglePublished(video: Video) {
    setBusyId(video.id);
    const { error } = await supabase
      .from("videos")
      .update({ published: !video.published })
      .eq("id", video.id);
    if (!error) {
      setVideos((v) =>
        v.map((x) => (x.id === video.id ? { ...x, published: !x.published } : x))
      );
    }
    setBusyId(null);
  }

  async function remove(video: Video) {
    if (!confirm(`Delete "${video.title}"? This can't be undone.`)) return;
    setBusyId(video.id);
    const { error } = await supabase.from("videos").delete().eq("id", video.id);
    if (!error) {
      setVideos((v) => v.filter((x) => x.id !== video.id));
      // Best-effort cleanup — removes the video/thumbnail files from
      // storage too, so nothing is left behind. Only touches files that
      // actually live in our own buckets; external URLs are untouched.
      deleteFromStorageIfOwned(supabase, video.video_url).catch(() => {});
      deleteFromStorageIfOwned(supabase, video.thumbnail_url).catch(() => {});
    }
    setBusyId(null);
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= videos.length) return;

    const next = [...videos];
    [next[index], next[target]] = [next[target], next[index]];
    setVideos(next);

    // Persist new order values (0-based, in array order).
    setBusyId(next[index].id);
    await Promise.all(
      next.map((v, i) =>
        supabase.from("videos").update({ order: i }).eq("id", v.id)
      )
    );
    setBusyId(null);
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-line py-16 text-center">
        <p className="text-muted">No videos yet.</p>
        <Link href="/admin/new" className="mt-3 inline-block text-sm text-bronze2 hover:underline">
          Add your first video
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-line/70 border-y border-line/70">
      {videos.map((video, i) => (
        <li key={video.id} className="flex items-center gap-4 py-4">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0 || busyId === video.id}
              aria-label="Move up"
              className="text-muted hover:text-bronze2 disabled:opacity-30"
            >
              ▲
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === videos.length - 1 || busyId === video.id}
              aria-label="Move down"
              className="text-muted hover:text-bronze2 disabled:opacity-30"
            >
              ▼
            </button>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnail_url}
            alt=""
            className="h-14 w-24 shrink-0 rounded-sm border border-line object-cover"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-bone">{video.title}</p>
            <p className="truncate text-xs text-muted">
              {video.category} {video.client && `· ${video.client}`}
            </p>
          </div>

          <span
            className={`hidden shrink-0 rounded-sm px-2.5 py-1 text-xs sm:inline-block ${
              video.published
                ? "bg-bronze/15 text-bronze2"
                : "bg-panel2 text-muted"
            }`}
          >
            {video.published ? "Published" : "Hidden"}
          </span>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => togglePublished(video)}
              disabled={busyId === video.id}
              className="rounded-sm border border-line px-3 py-1.5 text-xs text-bone hover:border-bronze/60 hover:text-bronze2 disabled:opacity-50"
            >
              {video.published ? "Hide" : "Show"}
            </button>
            <Link
              href={`/admin/${video.id}/edit`}
              className="rounded-sm border border-line px-3 py-1.5 text-xs text-bone hover:border-bronze/60 hover:text-bronze2"
            >
              Edit
            </Link>
            <button
              onClick={() => remove(video)}
              disabled={busyId === video.id}
              className="rounded-sm border border-line px-3 py-1.5 text-xs text-red-400/90 hover:border-red-400/60 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
