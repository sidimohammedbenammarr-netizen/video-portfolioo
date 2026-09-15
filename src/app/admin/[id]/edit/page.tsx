import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VideoForm from "@/components/VideoForm";
import type { Video } from "@/lib/types";

export const revalidate = 0;

export default async function EditVideoPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <div>
      <h1 className="mb-8 font-display text-2xl text-bone">Edit video</h1>
      <VideoForm video={data as Video} nextOrder={(data as Video).order} />
    </div>
  );
}
