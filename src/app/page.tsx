import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";
import { TOOLS } from "@/lib/site";

const tool = TOOLS.video;

export const metadata: Metadata = {
  title: { absolute: tool.metaTitle },
  description: tool.metaDescription,
  keywords: tool.keywords,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <ToolPage tool={tool} />;
}
