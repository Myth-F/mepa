-- Discovery: taxonomy, featured curation, and denormalized search document.
-- unaccent powers accent-insensitive French full-text search.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "module" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "featuredRank" INTEGER;

-- AlterTable
ALTER TABLE "module_version" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "estimatedMinutes" INTEGER,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'fr',
ADD COLUMN     "level" "CourseLevel",
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_search_document" (
    "moduleId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "categoryId" TEXT,
    "categorySlug" TEXT,
    "categoryName" TEXT,
    "level" "CourseLevel",
    "estimatedMinutes" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "searchVector" tsvector,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_search_document_pkey" PRIMARY KEY ("moduleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "module_search_document_slug_key" ON "module_search_document"("slug");

-- CreateIndex
CREATE INDEX "module_search_document_publishedAt_idx" ON "module_search_document"("publishedAt");

-- CreateIndex
CREATE INDEX "module_search_document_categoryId_idx" ON "module_search_document"("categoryId");

-- CreateIndex
CREATE INDEX "module_search_document_level_idx" ON "module_search_document"("level");

-- CreateIndex
CREATE INDEX "module_search_document_popularity_idx" ON "module_search_document"("popularity");

-- CreateIndex
CREATE INDEX "module_featured_featuredRank_idx" ON "module"("featured", "featuredRank");

-- CreateIndex
CREATE INDEX "module_version_categoryId_idx" ON "module_version"("categoryId");

-- AddForeignKey
ALTER TABLE "module_version" ADD CONSTRAINT "module_version_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_search_document" ADD CONSTRAINT "module_search_document_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- GIN index on the tsvector (not expressible in Prisma schema).
CREATE INDEX "module_search_document_search_vector_idx" ON "module_search_document" USING GIN ("searchVector");
