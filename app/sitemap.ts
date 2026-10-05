import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getSiteOrigin(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
