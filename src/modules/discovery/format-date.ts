const FRENCH_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPublishedDate(date: Date): string {
  return `Publié le ${FRENCH_DATE.format(date)}`;
}

export function dateInputValue(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}
