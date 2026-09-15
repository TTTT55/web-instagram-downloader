import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";
import { TOOLS } from "@/lib/site";

const tool = TOOLS.stories;

export const metadata: Metadata = {
  title: { absolute: tool.metaTitle },
  description: tool.metaDescription,
  keywords: tool.keywords,
  alternates: { canonical: tool.path },
};

export default function StoriesPage() {
  return <ToolPage tool={tool} />;
}
