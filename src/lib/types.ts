export type Category =
  | "Reels"
  | "Social Media"
  | "Ads"
  | "Motion Graphics"
  | "YouTube"
  | "Other";

export const CATEGORIES: Category[] = [
  "Reels",
  "Social Media",
  "Ads",
  "Motion Graphics",
  "YouTube",
  "Other",
];

export interface Video {
  id: string;
  title: string;
  description: string;
  category: Category;
  video_url: string;
  thumbnail_url: string;
  client: string;
  duration: string;
  order: number;
  published: boolean;
  created_at: string;
}
