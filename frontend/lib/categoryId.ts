/**
 * Үйлчилгээний ангиллын React key / categoryId — монгол үсэг хадгална, давхардлыг засна.
 */
export function categoryIdFromName(name: string): string {
  const trimmed = name.trim();
  const slug = trimmed
    .toLowerCase()
    .normalize("NFC")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0400-\u04FF_-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  if (slug.length > 0) return `cat-${slug}`;

  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return `cat-h${hash.toString(36)}`;
}

/** Ижил id-тэй ангиллуудын key давхардахаас сэргийлнэ. */
export function dedupeCategoryIds<T extends { id: string; name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.map((item) => {
    let id = item.id;
    let n = 0;
    while (seen.has(id)) {
      n += 1;
      id = `${item.id}-${n}`;
    }
    seen.add(id);
    return id === item.id ? item : { ...item, id };
  });
}
