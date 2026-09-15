import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKETS = ["thumbnails", "videos"] as const;
export type StorageBucket = (typeof BUCKETS)[number];

// Keep these in sync with the "File size limit" set on each bucket in the
// Supabase dashboard (Storage -> bucket -> Configuration). Supabase rejects
// anything over that limit server-side regardless of what we check here —
// this is just so the admin gets a clear message before waiting on a big
// upload that was always going to fail.
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB
export const MAX_THUMBNAIL_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * If `url` points at one of our own Supabase Storage buckets, return which
 * bucket and object path it is. Returns null for anything else (an external
 * URL like Cloudinary/YouTube) — those are never touched by delete/replace.
 */
export function parseStorageUrl(
  url: string
): { bucket: StorageBucket; path: string } | null {
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  const rest = url.slice(idx + marker.length); // e.g. "thumbnails/uuid.jpg"
  const [bucket, ...pathParts] = rest.split("/");
  const path = pathParts.join("/");
  if (!path || !(BUCKETS as readonly string[]).includes(bucket)) return null;

  return { bucket: bucket as StorageBucket, path };
}

/**
 * Client-side sanity checks before we ever hit the network. Doesn't replace
 * the bucket's own file-size limit or the DB's category check — just gives a
 * fast, friendly error instead of a failed upload after a long wait.
 */
export function validateFile(
  bucket: StorageBucket,
  file: File
): string | null {
  const isVideo = bucket === "videos";
  const expectedPrefix = isVideo ? "video/" : "image/";
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_THUMBNAIL_BYTES;

  if (file.type && !file.type.startsWith(expectedPrefix)) {
    return isVideo
      ? `"${file.name}" doesn't look like a video file (got ${file.type || "unknown type"}).`
      : `"${file.name}" doesn't look like an image file (got ${file.type || "unknown type"}).`;
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    const fileMb = Math.round(file.size / (1024 * 1024));
    return `"${file.name}" is ${fileMb} MB, which is over the ${maxMb} MB limit. Raise the bucket's file size limit in Supabase (Storage → ${bucket} → Configuration) if you need more room.`;
  }

  return null;
}

/** Turn a raw upload error into a message worth showing an admin. */
function friendlyUploadError(bucket: StorageBucket, err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);

  if (/bucket not found/i.test(raw)) {
    return new Error(
      `Storage bucket "${bucket}" doesn't exist yet. Run supabase/storage_setup.sql once in the Supabase SQL editor, then try again.`
    );
  }
  if (/exceeded the maximum allowed size|payload too large/i.test(raw)) {
    return new Error(
      `That file is larger than the limit configured on the "${bucket}" bucket in Supabase. Raise it under Storage → ${bucket} → Configuration.`
    );
  }
  if (/row-level security|not authorized|permission denied/i.test(raw)) {
    return new Error(
      "You're not authorized to upload. Try signing out and back in — your session may have expired."
    );
  }
  if (/Failed to fetch|NetworkError|network/i.test(raw)) {
    return new Error(
      "Upload failed — looks like a network interruption. Check your connection and try again."
    );
  }
  return new Error(raw || "Upload failed for an unknown reason.");
}

/**
 * Upload a file to one of our buckets with live progress, and return its
 * public URL. Uses a raw XHR request (instead of supabase-js's fetch-based
 * upload) purely so we get upload progress events to show the admin.
 */
export async function uploadToStorage(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const invalid = validateFile(bucket, file);
  if (invalid) throw new Error(invalid);

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  // Random, collision-free path — two admins uploading "final_v2.mp4" at the
  // same time never overwrite each other.
  const path = `${crypto.randomUUID()}.${ext}`;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Your session has expired. Please sign in again.");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const endpoint = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  try {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      xhr.setRequestHeader("apikey", anonKey);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.setRequestHeader("x-upsert", "false");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve();
        } else {
          let message = xhr.responseText || `Upload failed (HTTP ${xhr.status})`;
          try {
            const parsed = JSON.parse(xhr.responseText);
            message = parsed.message || parsed.error || message;
          } catch {
            // response wasn't JSON — use the raw text above
          }
          reject(new Error(message));
        }
      };

      xhr.onerror = () => reject(new Error("Failed to fetch — network error during upload"));
      xhr.ontimeout = () => reject(new Error("Upload timed out — network may be too slow or unstable"));

      xhr.send(file);
    });
  } catch (err) {
    throw friendlyUploadError(bucket, err);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete whatever file `url` points to, but only if it lives in one of our
 * own buckets. Silently does nothing for external URLs. Never throws —
 * cleanup is best-effort so it never blocks a delete/replace action.
 */
export async function deleteFromStorageIfOwned(
  supabase: SupabaseClient,
  url: string | null | undefined
) {
  if (!url) return;
  const parsed = parseStorageUrl(url);
  if (!parsed) return;
  try {
    await supabase.storage.from(parsed.bucket).remove([parsed.path]);
  } catch {
    // Best-effort — a failed cleanup shouldn't surface as an error to the
    // admin, since the primary action (delete/replace) already succeeded.
  }
}
