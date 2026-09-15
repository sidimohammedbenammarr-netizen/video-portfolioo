import { createClient } from "@/lib/supabase/server";
import VideoForm from "@/components/VideoForm";

export const revalidate = 0;

export default async function NewVideoPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("videos")
    .select("order")
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = data ? data.order + 1 : 0;

  return (
    <div>
      <h1 className="mb-8 font-display text-2xl text-bone">Add a video</h1>
      <VideoForm nextOrder={nextOrder} />
    </div>
  );
}
