/** Монгол төгрөгийн дүн харуулах (UI). */
export function formatMnt(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "—";
  return `${new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 }).format(n)} ₮`;
}
