import type { MetadataRoute } from "next";
import { SITE_URL, TOOL_LIST } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...TOOL_LIST.map((t) => ({
      url: `${SITE_URL}${t.path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: t.path === "/" ? 1 : 0.8,
    })),
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/dmca`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
