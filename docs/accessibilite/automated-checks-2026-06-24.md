# Contrôles automatisés d’accessibilité — 24 juin 2026

Périmètre : accueil, catalogue, module pédagogique, inscription et déclaration d’accessibilité.

- axe-core : aucune violation WCAG 2 A/AA ou WCAG 2.1 A/AA sur les cinq pages.
- Reflow : aucun défilement horizontal à 320 pixels CSS.
- Clavier : recherche, sélection d’un mot-clé et validation du filtre vérifiées sans pointeur.
- Suppression de compte : confirmation explicite avant l’action irréversible.
- Images éditoriales : texte alternatif obligatoire sauf image déclarée décorative.

Ces contrôles sont exécutés par Playwright dans `accessibility-audit.spec.ts`, `course-discovery.spec.ts`, `account-features.spec.ts` et `admin-media.spec.ts`. Une campagne manuelle avec NVDA ou VoiceOver reste nécessaire pour clôturer l’audit humain.
