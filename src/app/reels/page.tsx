import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";
import { TOOLS } from "@/lib/site";

const tool = TOOLS.reels;

export const metadata: Metadata = {
  title: { absolute: tool.metaTitle },
  description: tool.metaDescription,
  keywords: tool.keywords,
  alternates: { canonical: tool.path },
};

export default function ReelsPage() {
  return <ToolPage tool={tool} />;
}
