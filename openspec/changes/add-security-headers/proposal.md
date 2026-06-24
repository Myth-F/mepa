## Why

L'absence d'en-têtes de sécurité HTTP expose le site à des risques d'injection XSS, de clickjacking et d'interception. Ces en-têtes sont des mesures de sécurité de base attendues sur toute plateforme publique, notamment dans un contexte CNIL.

## What Changes

- Ajout de l'en-tête `Content-Security-Policy` (CSP) limitant les sources de scripts et styles
- Ajout de `X-Content-Type-Options: nosniff`
- Ajout de `X-Frame-Options: DENY` (anti-clickjacking)
- Ajout de `Strict-Transport-Security` (HSTS) avec preload
- Ajout de `Referrer-Policy: strict-origin-when-cross-origin`
- Retrait de la propriété CSS dépréciée `clip` en faveur de `clip-path`

## Capabilities

### New Capabilities
- `http-security-headers`: En-têtes de sécurité HTTP configurés dans le middleware Next.js / config serveur

### Modified Capabilities
_(aucune)_

## Impact

- `next.config.ts` : section headers()
- Middleware Next.js (si applicable)
- CSS global (remplacement de `clip` par `clip-path`)
