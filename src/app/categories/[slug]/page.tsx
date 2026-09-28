import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategoryBySlug } from "@/lib/registry/categories";
import { getToolsByCategory } from "@/lib/registry/tools";
import { ToolGrid } from "@/components/tool/ToolGrid";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found — UtilityHub",
    };
  }

  return {
    title: `${category.name} — UtilityHub`,
    description: category.description,
    openGraph: {
      title: `${category.name} — UtilityHub`,
      description: category.description,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const tools = getToolsByCategory(category.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <Breadcrumb
        items={[
          { label: "Categories", href: "/#categories" },
          { label: category.name },
        ]}
      />

      <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          {category.name}
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          {category.description}
        </p>
      </div>

      <ToolGrid
        tools={tools}
        title={`All ${category.name} (${tools.length})`}
        subtitle="Select a utility to launch immediately in your browser."
        showFilters={true}
      />
    </div>
  );
}
