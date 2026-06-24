UPDATE "module_version"
SET "publishedAt" = "createdAt"
WHERE status = 'PUBLISHED' AND "publishedAt" IS NULL;

UPDATE "module_search_document" AS document
SET "publishedAt" = version."publishedAt"
FROM "module_version" AS version
WHERE document."moduleId" = version."moduleId"
  AND version.status = 'PUBLISHED'
  AND version."publishedAt" IS NOT NULL;
