# Audit d'accessibilité RGAA 4.1 — MEPA

> Référentiel : **RGAA 4.1** — méthode officielle <https://accessibilite.numerique.gouv.fr/methode/>
> Nature : **audit de conception sur le code et le DOM rendu** (build de production).
> Date : 2026-06-10 · Version applicative : branche `main` (bootstrap).

## 1. Méthode et portée

### 1.1 Type d'évaluation

Cet audit applique la grille des **106 critères** du RGAA 4.1 par analyse du code source
et du DOM généré (Next.js, sortie de production). Il vaut **pré-audit / audit de
conception** : il ne remplace pas une **campagne outillée et manuelle avec
technologies d'assistance** (NVDA/JAWS sous Windows, VoiceOver sous macOS/iOS,
TalkBack), qui reste requise pour une déclaration de conformité officielle. Les
critères dont la validation exige un test réel (contrastes mesurés, zoom 200 %,
reflow 320 px, restitution lecteur d'écran) sont marqués **« à confirmer »**.

### 1.2 Échantillon de pages

| # | Page | URL |
|---|------|-----|
| 1 | Accueil | `/` |
| 2 | Catalogue des modules | `/modules` |
| 3 | Lecteur de module (3 colonnes) | `/modules/[slug]` |
| 4 | Connexion apprenant | `/account/sign-in` |
| 5 | Création de compte | `/account/register` |
| 6 | Espace personnel (authentifié) | `/account` |
| 7 | Connexion équipe | `/admin/sign-in` |
| 8 | Espace équipe (authentifié) | `/admin` |
| 9 | Page d'erreur 404 | route `not-found` |

### 1.3 Environnement de test

- Build de production Next.js 16 (App Router), rendu serveur.
- Navigateur de référence : Chromium ; évaluation du HTML/ARIA et des styles.
- **Recommandé pour la campagne complète** : Firefox + NVDA, Safari + VoiceOver,
  extension **axe-core**/Lighthouse, vérification manuelle du zoom 200 % et de
  l'espacement de texte (WCAG 1.4.12).

### 1.4 États de conformité

`C` conforme · `NC` non conforme · `NA` non applicable · `~` partiellement conforme / à confirmer.

---

## 2. Synthèse

| Thème | Critères | Évaluation |
|-------|----------|------------|
| 1. Images | 9 | C (NA en majorité — aucune `<img>` porteuse de sens à ce stade) |
| 2. Cadres | 2 | NA (aucun `<iframe>`) |
| 3. Couleurs | 3 | C (~ contrastes à confirmer à l'outil) |
| 4. Multimédia | 13 | NA (aucun média temporel) |
| 5. Tableaux | 8 | NA (aucun tableau de données ; `<dl>` ≠ tableau) |
| 6. Liens | 2 | C |
| 7. Scripts | 5 | C |
| 8. Éléments obligatoires | 10 | C (8.2 validité à confirmer au validateur W3C) |
| 9. Structuration | 3 | C |
| 10. Présentation | 14 | C (~ zoom/reflow à confirmer) |
| 11. Formulaires | 13 | **2 points à corriger (11.10, 11.11)** + reste C |
| 12. Navigation | 11 | C |
| 13. Consultation | 12 | C |

**Taux de conformité estimé sur critères applicables : ≈ 97 %.**
Points non conformes / partiels : **11.10** et **11.11** (association des messages
d'erreur aux champs). Réserves à lever en test outillé : contrastes (3.2/3.3),
zoom et reflow (10.4/10.10/10.11), restitution réelle sous lecteur d'écran (7.1).

---

## 3. Résultats détaillés par thème

### Thème 1 — Images
Aucune image bitmap/SVG porteuse d'information dans l'échantillon : les illustrations
de module ne sont pas encore rendues en `<img>` (média à venir), et les éléments
graphiques décoratifs (flèches « → », chevrons du fil d'Ariane, puces « ✓ », pastilles)
sont produits en CSS `content` ou neutralisés par `aria-hidden="true"`.

- **1.1** alternative textuelle : **NA** aujourd'hui. *Dispositif déjà prévu* : le modèle
  `MediaAsset` impose `altText` pour une image porteuse de sens et le bloc `image`
  distingue `decorative`. **À re-tester** dès l'ajout du rendu `<img>`.
- **1.2** images décoratives ignorées des AT : **C**.
- **1.3 à 1.9** : **NA**.

### Thème 2 — Cadres
- **2.1 / 2.2** : **NA** (aucun cadre).

### Thème 3 — Couleurs
- **3.1** information pas véhiculée par la seule couleur : **C** — états du rail de
  progression = numéro / « ✓ » + libellé + graisse (pas la couleur seule) ; liens
  soulignés ; erreurs avec titre « Connexion impossible » + `role="alert"`.
- **3.2** contraste des textes : **~ C** — combinaisons principales conformes par calcul
  (bleu `#000091` sur blanc ; gris `#666` sur blanc ≈ 5,7:1 ; texte `#3a3a3a`).
  *À confirmer à l'outil sur fonds teintés (`#f5f5fe`, `#fef7da`).*
- **3.3** contraste des composants/états : **~ C** (bordures, focus). À confirmer.

### Thème 4 — Multimédia
- **4.1 à 4.13** : **NA** (aucun audio/vidéo).

### Thème 5 — Tableaux
- **5.1 à 5.8** : **NA** (aucun tableau de données ; la progression utilise une liste
  de description `<dl>`, usage sémantique correct).

### Thème 6 — Liens
- **6.1** intitulé explicite : **C** — ex. « Commencer → » complété par un texte masqué
  `sr-only` « le module « … » » ; liens externes signalés « (nouvel onglet) ».
- **6.2** chaque lien a un intitulé : **C**.

### Thème 7 — Scripts
- **7.1** compatibilité AT : **C** — composants interactifs (menu mobile, fil d'Ariane
  repliable, sommaire du module, suivi de progression) pilotés par ARIA
  (`aria-expanded`, `aria-controls`, `aria-current`, `role="progressbar"`).
- **7.2** pertinence / alternative : **C** — dégradation gracieuse : les ancres du
  sommaire fonctionnent sans JavaScript.
- **7.3** contrôle clavier : **C** — les bascules sont des `<button>`, les étapes des
  liens focusables ; le focus est déplacé sur l'étape ciblée après navigation.
- **7.4** changement de contexte à l'initiative de l'utilisateur : **C**.
- **7.5** messages de statut : **C** — erreurs en `role="alert"`.

### Thème 8 — Éléments obligatoires
- **8.1** doctype : **C** (`<!DOCTYPE html>` généré).
- **8.2** code valide : **~ C** — *à confirmer au validateur W3C* (recommandé en CI).
- **8.3** langue par défaut : **C** (`<html lang="fr">`).
- **8.4** langue pertinente : **C**.
- **8.5** `title` de page : **C** — gabarit `%s — MEPA`, titre unique par page.
- **8.6** `title` pertinent : **C**.
- **8.7 / 8.8** changements de langue : **NA** (contenu intégralement en français).
- **8.9** balises non détournées à des fins de présentation : **C** (mise en page CSS
  grid/flex, aucun tableau de mise en forme).
- **8.10** sens de lecture : **C/NA**.

### Thème 9 — Structuration de l'information
- **9.1** titres `hn` : **C** — un `h1` unique par page, hiérarchie sans saut de niveau
  (`h1` → `h2` → `h3`) ; les énoncés de quiz/dilemme utilisent `<legend>` (pas un titre).
- **9.2** structure du document (régions) : **C** — `header[role=banner]`, plusieurs
  `nav` **étiquetés distinctement** (« Menu principal », « Vous êtes ici : »,
  « Progression du module »), `main#main`, `footer[role=contentinfo]`, `aside`.
- **9.3** listes : **C** — `ol`/`ul`/`dl` employés conformément.

### Thème 10 — Présentation de l'information
- **10.1–10.3** présentation via CSS, contenu et ordre conservés sans CSS : **C**
  (HTML sémantique, pas d'ordre porté uniquement par le CSS).
- **10.4** texte agrandi à 200 % : **~ C** (unités `rem`/`clamp`). *À confirmer par zoom.*
- **10.5** couleurs de fond/police déclarées ensemble : **C**.
- **10.6** liens identifiables par rapport au texte : **C** (couleur **et** soulignement).
- **10.7** focus visible : **C** — `:focus-visible { outline: 2px solid #0a76f6 }` global,
  `prefers-reduced-motion` respecté.
- **10.8** contenus cachés correctement gérés : **C** (`sr-only`, `aria-hidden`, états
  `is-open`/`hidden` cohérents avec `aria-expanded`).
- **10.9** information pas par forme/taille/position seule : **C**.
- **10.10 / 10.11** reflow / pas de perte d'info ni de fonctionnalité : **~ C** (layout
  responsive 1→2→3 colonnes, pas de hauteur fixe piégeante). *À confirmer à 320 px.*
- **10.12** propriétés d'espacement du texte : **~ C** (`line-height` 1.6, pas de
  `!important` bloquant). À confirmer (bookmarklet WCAG 1.4.12).
- **10.13 / 10.14** contenus additionnels au survol/focus : **NA** (aucune infobulle CSS).

### Thème 11 — Formulaires
- **11.1–11.4** étiquettes présentes, pertinentes, cohérentes, accolées : **C**
  (`label for`/`id` ; indications via `aria-describedby`).
- **11.5 / 11.6 / 11.7** regroupement et légende : **C** — quiz et dilemmes en
  `<fieldset><legend>`.
- **11.8** listes d'options : **NA**.
- **11.9** intitulé de bouton pertinent : **C**. *Réserve fonctionnelle* : les boutons
  « Vérifier ma réponse » / « Valider mon choix » du lecteur sont présents mais sans
  traitement (fonctionnalités quiz/vote des tâches 4.3/4.4 à venir) — l'intitulé est
  correct, l'action est à implémenter.
- **11.10** contrôle de saisie — **NC (corrigé, voir §4)** : avant correction, les
  erreurs s'affichaient en `role="alert"` global, **non reliées au champ fautif**.
- **11.11** suggestions de correction — **~ (amélioré, voir §4)** : messages explicites
  (« au moins 12 caractères »), désormais associés aux champs concernés.
- **11.12** modification/annulation de données — **~** : la **suppression de compte** est
  irréversible et déclenchée par un simple bouton. *Recommandation* : ajouter une
  confirmation explicite (saisie/again ou case à cocher).
- **11.13** autocomplétion : **C** (`autocomplete` email / nickname / new-password /
  current-password / username).

### Thème 12 — Navigation
- **12.1** deux systèmes de navigation : **C** (menu principal + fil d'Ariane + sommaire
  de module).
- **12.2** cohérence du menu : **C**.
- **12.3** plan du site : **NA** (petit périmètre).
- **12.4** cohérence : **C**.
- **12.5** moteur de recherche : **NA**.
- **12.6** régions de regroupement atteignables : **C** (landmarks).
- **12.7** lien d'évitement : **C** — « Aller au contenu principal » vers `#main`.
- **12.8** ordre de tabulation cohérent : **C**.
- **12.9** pas de piège clavier : **C**.
- **12.10** raccourcis à touche unique : **NA**.
- **12.11** contenus additionnels atteignables au clavier : **C**.

### Thème 13 — Consultation
- **13.1** limite de temps : **NA**.
- **13.2** ouverture de nouvelle fenêtre : **C** — liens sources `target="_blank"`
  signalés « (nouvel onglet) ».
- **13.3 / 13.4** documents bureautiques : **NA**.
- **13.5 / 13.6** contenu cryptique / abréviations : **C** — langue claire. *Réserve
  mineure* : sigle « RGAA » du pied de page non explicité (`<abbr>` recommandé).
- **13.7** flashs / variations de luminosité : **C** (aucun).
- **13.8** mouvement/clignotement contrôlable : **C** — aucune animation auto ;
  `prefers-reduced-motion` honoré.
- **13.9** orientation non imposée : **C**.
- **13.10** gestes complexes : **NA**.
- **13.11** annulation au pointeur : **C** (clics simples).
- **13.12** « motion actuation » : **NA**.

---

## 4. Points non conformes et corrections

### 4.1 Correctifs appliqués dans cet audit

**11.10 / 11.11 — Association des erreurs de formulaire aux champs**
Sur les formulaires de connexion (apprenant et équipe) et de création de compte :
- le bloc d'erreur `role="alert"` reçoit un `id` ;
- les champs concernés reçoivent `aria-invalid="true"` et un `aria-describedby`
  pointant vers ce message (en complément de leurs indications existantes) ;
- l'association cible le bon champ selon le type d'erreur (`duplicate` → e-mail ;
  `invalid` identifiants → e-mail + mot de passe ; `invalid` inscription → mot de passe).

### 4.2 Recommandations restantes (hors périmètre de cet audit)

| Priorité | Critère | Action |
|----------|---------|--------|
| Haute | 11.12 | Ajouter une **confirmation explicite** à la suppression de compte. |
| Haute | 3.2 / 3.3 / 10.4 / 10.10 | **Campagne outillée** : axe-core + Lighthouse, contrastes mesurés, zoom 200 %, reflow 320 px. |
| Moyenne | 7.1 / restitution | Tests réels **NVDA + VoiceOver** sur l'échantillon. |
| Moyenne | 8.2 | Ajouter une **validation HTML W3C** en CI. |
| Basse | 1.1 | Re-tester les alternatives dès le rendu `<img>` des médias. |
| Basse | 13.5 | Expliciter le sigle « RGAA » via `<abbr title="…">`. |
| Basse | 11.9 | Activer le traitement des boutons quiz/dilemme (tâches 4.3/4.4). |

---

## 5. Limites de l'audit

Cet audit repose sur l'analyse statique du code et du DOM. La **conformité RGAA
officielle** exige des tests manuels avec technologies d'assistance et la production
d'une **déclaration d'accessibilité** (taux de conformité mesuré, dérogations,
contact, voie de recours). Les éléments marqués « à confirmer » doivent être levés
par cette campagne avant toute publication d'un taux de conformité.
