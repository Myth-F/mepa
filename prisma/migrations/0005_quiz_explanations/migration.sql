UPDATE "module_block" AS block
SET payload = block.payload || jsonb_build_object(
  'explanation',
  'La bonne réponse est « ' || COALESCE(
    (
      SELECT option->>'label'
      FROM jsonb_array_elements(block.payload->'options') AS option
      WHERE COALESCE((option->>'correct')::boolean, false) = true
      LIMIT 1
    ),
    'celle indiquée ci-dessus'
  ) || ' ». Elle correspond au principe expliqué dans le module.'
) || COALESCE(
  (
    SELECT jsonb_build_object(
      'explanationSource',
      jsonb_build_object('title', source.label, 'url', source.url)
    )
    FROM "module_source" AS source
    WHERE source."moduleVersionId" = block."moduleVersionId"
      AND source.url IS NOT NULL
    ORDER BY source.id
    LIMIT 1
  ),
  '{}'::jsonb
)
WHERE block.type = 'quiz'
  AND NULLIF(trim(block.payload->>'explanation'), '') IS NULL;
