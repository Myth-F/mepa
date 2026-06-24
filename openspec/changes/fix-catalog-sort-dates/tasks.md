## 1. Diagnostic du tri

- [x] 1.1 Analyser la requête Prisma du tri « Plus récents » et identifier pourquoi l'ordre est identique au tri pertinence
- [x] 1.2 Vérifier si les champs de date (`publishedAt`, `createdAt`) sont bien renseignés en base

## 2. Correction du tri

- [x] 2.1 Corriger la requête du tri « Plus récents » pour trier par `publishedAt DESC` (ou `updatedAt` si plus pertinent)
- [x] 2.2 S'assurer que les modules sans date de publication sont placés en fin de liste
- [x] 2.3 Tester que l'ordre observé change bien par rapport au tri par défaut

## 3. Affichage des dates sur les cartes modules

- [x] 3.1 Ajouter la date de publication / mise à jour sur les cartes du catalogue
- [x] 3.2 Formater la date en français (ex: « Publié le 12 juin 2025 »)
- [x] 3.3 Afficher aussi la date sur la page de détail du module

## 4. Interface d'administration

- [x] 4.1 Vérifier que les champs de date sont éditables dans /admin
- [x] 4.2 Renseigner les dates manquantes pour les modules existants

## 5. Tests

- [x] 5.1 Test : tri « Plus récents » → module le plus récent apparaît en premier
- [x] 5.2 Test : les dates affichées correspondent aux données en base
