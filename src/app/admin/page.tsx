import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminVideoList from "@/components/AdminVideoList";
import type { Video } from "@/lib/types";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .order("order", { ascending: true });

  const videos = (data ?? []) as Video[];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-bone">Your videos</h1>
          <p className="mt-1 text-sm text-muted">
            {videos.length} total · use the arrows to reorder, Hide to pull a
            video from the public site without deleting it.
          </p>
        </div>
        <Link
          href="/admin/new"
          className="rounded-sm bg-bronze px-4 py-2.5 text-sm font-medium text-ink hover:bg-bronze2"
        >
          Add video
        </Link>
      </div>

      <AdminVideoList initialVideos={videos} />
    </div>
  );
}
