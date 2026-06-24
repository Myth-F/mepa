import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/shared/db/prisma";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { formatPublishedDate } from "@/modules/discovery/format-date";
import type { CourseLevel } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

async function getCategory(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Thème introuvable", robots: { index: false } };
  return {
    title: category.name,
    description:
      category.description ?? `Modules pédagogiques MEPA consacrés au thème ${category.name}.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [category, modules] = await Promise.all([
    getCategory(slug),
    prisma.moduleSearchDocument.findMany({
      where: { categorySlug: slug },
      orderBy: [{ popularity: "desc" }, { publishedAt: "desc" }],
    }),
  ]);
  if (!category) notFound();

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Comprendre l’IA", href: "/modules" },
          { label: category.name },
        ]}
      />
      <header className="page-heading">
        <p className="eyebrow">Thème pédagogique</p>
        <h1>{category.name}</h1>
        <p>
          {category.description ??
            "Explorez les modules de ce thème, à votre rythme et sans compte obligatoire."}
        </p>
      </header>

      {modules.length === 0 ? (
        <div className="empty-state">
          <h2>Aucun module publié pour le moment</h2>
          <p>D’autres thèmes restent disponibles dans le catalogue.</p>
          <Link className="text-link" href="/modules">
            Voir tous les modules
          </Link>
        </div>
      ) : (
        <section aria-labelledby="category-modules">
          <h2 id="category-modules">
            {modules.length} module{modules.length > 1 ? "s" : ""} à découvrir
          </h2>
          <ul className="module-list" aria-label={`Modules du thème ${category.name}`}>
            {modules.map((module) => (
              <li key={module.moduleId}>
                <article className="module-card">
                  <div className="module-card__content">
                    <p className="module-card__meta">
                      {module.level ? LEVEL_LABELS[module.level] : "Tous niveaux"}
                      {module.estimatedMinutes ? ` · ${module.estimatedMinutes} min` : ""}
                    </p>
                    <p className="module-card__date">
                      <time dateTime={module.publishedAt.toISOString()}>
                        {formatPublishedDate(module.publishedAt)}
                      </time>
                    </p>
                    <h3>
                      <Link href={`/modules/${module.slug}`}>{module.title}</Link>
                    </h3>
                    {module.summary && <p>{module.summary}</p>}
                  </div>
                  <Link className="module-card__link" href={`/modules/${module.slug}`}>
                    Commencer <span aria-hidden="true">→</span>
                    <span className="sr-only"> le module « {module.title} »</span>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
