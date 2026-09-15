"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  uploadToStorage,
  deleteFromStorageIfOwned,
  validateFile,
} from "@/lib/storage";
import { CATEGORIES, type Category, type Video } from "@/lib/types";

type Mode = "url" | "upload";

export default function VideoForm({
  video,
  nextOrder,
}: {
  video?: Video;
  nextOrder: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(video);

  const [title, setTitle] = useState(video?.title ?? "");
  const [description, setDescription] = useState(video?.description ?? "");
  const [category, setCategory] = useState<Category>(video?.category ?? "Reels");
  const [client, setClient] = useState(video?.client ?? "");
  const [duration, setDuration] = useState(video?.duration ?? "");
  const [order, setOrder] = useState(video?.order ?? nextOrder);
  const [published, setPublished] = useState(video?.published ?? true);

  const [thumbMode, setThumbMode] = useState<Mode>("upload");
  const [videoMode, setVideoMode] = useState<Mode>("upload");

  const [thumbUrl, setThumbUrl] = useState(video?.thumbnail_url ?? "");
  const [videoUrl, setVideoUrl] = useState(video?.video_url ?? "");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbProgress, setThumbProgress] = useState<number | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate both files up front so the admin isn't told about a bad
    // video only after already waiting through a thumbnail upload.
    if (thumbMode === "upload" && thumbFile) {
      const invalid = validateFile("thumbnails", thumbFile);
      if (invalid) return setError(invalid);
    }
    if (videoMode === "upload" && videoFile) {
      const invalid = validateFile("videos", videoFile);
      if (invalid) return setError(invalid);
    }

    setSaving(true);
    setThumbProgress(null);
    setVideoProgress(null);

    // Track anything we upload in this attempt so we can clean it up again
    // if a later step (the other upload, or the database write) fails —
    // otherwise a failed save can leave an orphaned file sitting in Storage.
    let uploadedThumbUrl: string | null = null;
    let uploadedVideoUrl: string | null = null;

    try {
      let finalThumbUrl = thumbUrl;
      let finalVideoUrl = videoUrl;
      let thumbReplaced = false;
      let videoReplaced = false;

      if (thumbMode === "upload") {
        if (thumbFile) {
          setThumbProgress(0);
          finalThumbUrl = await uploadToStorage(supabase, "thumbnails", thumbFile, setThumbProgress);
          uploadedThumbUrl = finalThumbUrl;
          thumbReplaced = true;
        } else if (!isEdit) {
          throw new Error("Please choose a thumbnail image.");
        }
      }

      if (videoMode === "upload") {
        if (videoFile) {
          setVideoProgress(0);
          finalVideoUrl = await uploadToStorage(supabase, "videos", videoFile, setVideoProgress);
          uploadedVideoUrl = finalVideoUrl;
          videoReplaced = true;
        } else if (!isEdit) {
          throw new Error("Please choose a video file, or switch to Paste URL.");
        }
      } else if (!finalVideoUrl) {
        throw new Error("Please provide a video URL.");
      }

      const payload = {
        title,
        description,
        category,
        client,
        duration,
        order: Number(order) || 0,
        published,
        thumbnail_url: finalThumbUrl,
        video_url: finalVideoUrl,
      };

      const { error: dbError } = isEdit
        ? await supabase.from("videos").update(payload).eq("id", video!.id)
        : await supabase.from("videos").insert(payload);

      if (dbError) {
        throw new Error(
          /duplicate key/i.test(dbError.message)
            ? "A video with that identifier already exists."
            : `Could not save video info: ${dbError.message}`
        );
      }

      // Once the new file is safely saved and the database row updated,
      // clean up the old file it replaced (only if it lived in our own
      // storage — external URLs are left alone). Best-effort: a cleanup
      // failure here shouldn't block the save that already succeeded.
      if (isEdit) {
        if (thumbReplaced) {
          deleteFromStorageIfOwned(supabase, video!.thumbnail_url).catch(() => {});
        }
        if (videoReplaced) {
          deleteFromStorageIfOwned(supabase, video!.video_url).catch(() => {});
        }
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      // The database write (or a later upload) failed after we'd already
      // uploaded one or both files this attempt — remove them so nothing is
      // left orphaned in Storage. Best-effort; doesn't block the error below.
      if (uploadedThumbUrl) deleteFromStorageIfOwned(supabase, uploadedThumbUrl).catch(() => {});
      if (uploadedVideoUrl) deleteFromStorageIfOwned(supabase, uploadedVideoUrl).catch(() => {});
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
      setThumbProgress(null);
      setVideoProgress(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="text-muted">Title</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-sm border border-line bg-panel2 px-3 py-2.5 text-bone outline-none focus:border-bronze"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="text-muted">Description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-sm border border-line bg-panel2 px-3 py-2.5 text-bone outline-none focus:border-bronze"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="rounded-sm border border-line bg-panel2 px-3 py-2.5 text-bone outline-none focus:border-bronze"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Client / project</span>
          <input
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="rounded-sm border border-line bg-panel2 px-3 py-2.5 text-bone outline-none focus:border-bronze"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Duration (e.g. 01:24)</span>
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="rounded-sm border border-line bg-panel2 px-3 py-2.5 text-bone outline-none focus:border-bronze"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Display order (lower shows first)</span>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="rounded-sm border border-line bg-panel2 px-3 py-2.5 text-bone outline-none focus:border-bronze"
          />
        </label>
      </div>

      {/* Thumbnail */}
      <fieldset className="rounded-sm border border-line p-4">
        <legend className="px-1 text-sm text-muted">Thumbnail</legend>
        <ModeToggle mode={thumbMode} setMode={setThumbMode} />
        {thumbMode === "upload" ? (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
            className="mt-3 block w-full text-sm text-muted file:mr-4 file:rounded-sm file:border-0 file:bg-panel2 file:px-3 file:py-2 file:text-bone"
          />
        ) : (
          <input
            type="url"
            placeholder="https://…"
            value={thumbUrl}
            onChange={(e) => setThumbUrl(e.target.value)}
            className="mt-3 w-full rounded-sm border border-line bg-panel2 px-3 py-2.5 text-sm text-bone outline-none focus:border-bronze"
          />
        )}
        {isEdit && thumbUrl && !thumbFile && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt="" className="mt-3 h-20 rounded-sm border border-line object-cover" />
        )}
        {thumbProgress !== null && <ProgressBar percent={thumbProgress} />}
      </fieldset>

      {/* Video */}
      <fieldset className="rounded-sm border border-line p-4">
        <legend className="px-1 text-sm text-muted">Video</legend>
        <ModeToggle mode={videoMode} setMode={setVideoMode} />
        {videoMode === "upload" ? (
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            className="mt-3 block w-full text-sm text-muted file:mr-4 file:rounded-sm file:border-0 file:bg-panel2 file:px-3 file:py-2 file:text-bone"
          />
        ) : (
          <input
            type="url"
            placeholder="https://… (Cloudinary, Supabase Storage, etc.)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="mt-3 w-full rounded-sm border border-line bg-panel2 px-3 py-2.5 text-sm text-bone outline-none focus:border-bronze"
          />
        )}
        {videoProgress !== null && <ProgressBar percent={videoProgress} />}
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-bone">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 accent-bronze"
        />
        Published (visible on the public site)
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-bronze px-6 py-2.5 text-sm font-medium text-ink hover:bg-bronze2 disabled:opacity-60"
        >
          {saving
            ? uploadLabel(thumbProgress, videoProgress)
            : isEdit
            ? "Save changes"
            : "Publish"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-sm border border-line px-6 py-2.5 text-sm text-muted hover:text-bone"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/** What the submit button reads while an upload is in flight. */
function uploadLabel(thumbProgress: number | null, videoProgress: number | null) {
  if (videoProgress !== null && videoProgress < 100) return `Uploading video… ${videoProgress}%`;
  if (thumbProgress !== null && thumbProgress < 100) return `Uploading thumbnail… ${thumbProgress}%`;
  return "Saving…";
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="mt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel2">
        <div
          className="h-full rounded-full bg-bronze transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">{percent}%</p>
    </div>
  );
}

function ModeToggle({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  return (
    <div className="flex gap-2 text-xs">
      {(["upload", "url"] as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`rounded-sm border px-2.5 py-1 ${
            mode === m
              ? "border-bronze text-bronze2"
              : "border-line text-muted hover:text-bone"
          }`}
        >
          {m === "upload" ? "Upload file" : "Paste URL"}
        </button>
      ))}
    </div>
  );
}
