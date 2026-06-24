## 1. Configuration des en-têtes dans Next.js

- [x] 1.1 Lire la configuration actuelle de `next.config.ts` pour la section `headers()`
- [x] 1.2 Ajouter `X-Content-Type-Options: nosniff`
- [x] 1.3 Ajouter `X-Frame-Options: DENY`
- [x] 1.4 Ajouter `Referrer-Policy: strict-origin-when-cross-origin`
- [x] 1.5 Ajouter `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [x] 1.6 Définir une politique CSP de base (self pour scripts/styles, bloquer eval)

## 2. Validation de la CSP

- [x] 2.1 Lancer l'application et vérifier qu'aucune ressource légitime n'est bloquée par la CSP
- [x] 2.2 Ajuster la CSP si des CDN ou fonts externes sont nécessaires (documenter les exceptions)
- [x] 2.3 Vérifier avec les outils navigateur (DevTools → Network → Headers)

## 3. Correction CSS dépréciée

- [x] 3.1 Rechercher toutes les occurrences de la propriété `clip:` dans les fichiers CSS/Tailwind
- [x] 3.2 Remplacer par l'équivalent `clip-path:`
- [x] 3.3 Vérifier le rendu visuel après remplacement

## 4. Vérification avec outils de sécurité

- [ ] 4.1 Tester avec securityheaders.com (ou équivalent) sur l'environnement de staging
- [x] 4.2 Vérifier le score Lighthouse « Bonnes pratiques » (cible ≥ 96 %)
- [x] 4.3 Vérifier que la configuration est appliquée dans Docker Compose (proxy Nginx si présent)
