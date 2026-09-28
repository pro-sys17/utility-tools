import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllTools, getToolBySlug } from "@/lib/registry/tools";
import { ToolDispatcher } from "@/components/tools/ToolDispatcher";

interface ToolPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {
      title: "Tool Not Found — UtilityHub",
    };
  }

  return {
    title: `${tool.name} — UtilityHub`,
    description: tool.description,
    keywords: tool.keywords,
    openGraph: {
      title: `${tool.name} — UtilityHub`,
      description: tool.description,
      type: "website",
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return <ToolDispatcher tool={tool} />;
}
