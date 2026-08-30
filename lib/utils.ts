export function ft(n: number): string {
  return Math.round(n).toLocaleString("hu-HU") + " Ft";
}
export function num(n: number): string {
  return Math.round(n).toLocaleString("hu-HU");
}
export function pct(n: number): string {
  return n.toFixed(2) + "%";
}
