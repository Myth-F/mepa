# Vérification RGAA — gamification

Date : 2026-06-10

- Le classement utilise un vrai tableau de données avec `caption`, en-têtes de
  colonnes `th scope="col"` et pseudonyme en en-tête de ligne `th scope="row"`.
- Le rang est écrit sous la forme « Rang N » et n'est jamais transmis uniquement
  par une couleur ou une position.
- Le tableau est placé dans une zone défilable horizontalement sur petit écran,
  sans supprimer de colonne.
- Le consentement au classement est un champ `checkbox` étiqueté et utilisable au
  clavier. Il est désactivé par défaut.
- Les changements de participation et les gains de points sont annoncés dans une
  région `role="status"`.
- Les liens de pagination sont nommés et regroupés dans une navigation étiquetée.
- Aucun e-mail ni identifiant interne n'est affiché.

Une validation manuelle avec NVDA/VoiceOver, zoom 200 % et reflow 320 px reste à
réaliser avant une déclaration de conformité.
