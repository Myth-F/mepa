export function formatSourceCount(count: number): string {
  return `${count} ${count === 1 ? "source" : "sources"}`;
}
