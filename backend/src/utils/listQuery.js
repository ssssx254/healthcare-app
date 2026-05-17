const { AppError } = require("./appError");

/**
 * @param {Record<string, unknown>} query - req.query
 * @param {{ defaultPageSize?: number, maxPageSize?: number }} [opts]
 */
function parsePagination(query, opts = {}) {
  const defaultPageSize = opts.defaultPageSize ?? 20;
  const maxPageSize = opts.maxPageSize ?? 100;
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const raw = parseInt(String(query.page_size ?? query.pageSize ?? defaultPageSize), 10);
  const pageSize = Math.min(Math.max(Number.isFinite(raw) && raw > 0 ? raw : defaultPageSize, 1), maxPageSize);
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

/**
 * @param {Record<string, unknown>} query
 * @param {string[]} allowedFields — SQL column names (caller maps to table alias)
 * @param {string} defaultField
 * @param {'asc'|'desc'} defaultDir
 * @returns {{ sortBy: string, sortDir: 'ASC'|'DESC' }}
 */
function parseSort(query, allowedFields, defaultField, defaultDir = "desc") {
  const rawField = String(query.sort_by ?? query.sortBy ?? defaultField).trim();
  const sortBy = allowedFields.includes(rawField) ? rawField : defaultField;
  let dir = String(query.sort_order ?? query.sortOrder ?? defaultDir).toLowerCase();
  if (dir !== "asc" && dir !== "desc") dir = defaultDir;
  return { sortBy, sortDir: dir.toUpperCase() };
}

/** YYYY-MM-DD эсвэл хоосон */
function optionalDateString(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === "") return undefined;
  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new AppError(400, `${fieldName} нь YYYY-MM-DD форматтай байна.`);
  }
  return s;
}

function optionalTrimmedQueryString(value, maxLen, fieldName) {
  if (value === undefined || value === null || String(value).trim() === "") return undefined;
  const t = String(value).trim();
  if (t.length > maxLen) {
    throw new AppError(400, `${fieldName} хэт урт байна.`);
  }
  return t;
}

function buildMeta({ total, page, pageSize }) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1 && total > 0,
  };
}

module.exports = {
  parsePagination,
  parseSort,
  optionalDateString,
  optionalTrimmedQueryString,
  buildMeta,
};
