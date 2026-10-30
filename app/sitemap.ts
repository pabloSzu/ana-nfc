import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  return [
    {
      url: origin,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${origin}/mascotas`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
