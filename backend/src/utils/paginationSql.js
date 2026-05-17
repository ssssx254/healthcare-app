/**
 * LIMIT/OFFSET-ийг placeholder-оор биш аюулгүй бүхэл тоогоор SQL-д оруулна.
 * Зарим MariaDB + mysql2 (`ER_WRONG_ARGUMENTS`) хослолд `LIMIT ?` эвдэрдэг.
 *
 * @param {{ pageSize?: unknown, offset?: unknown }} listQuery — ихэвчлэн `validate*ListQuery` үр дүн
 * @param {{ max?: number }} [opts] — анхдагч max 500 (validator-ууд аль хэдийн хязгаарласан)
 */
function sqlLimitOffset(listQuery, opts = {}) {
  const max = opts.max ?? 500;
  const lim = Math.max(1, Math.min(max, Math.floor(Number(listQuery?.pageSize)) || 20));
  const off = Math.max(0, Math.floor(Number(listQuery?.offset)) || 0);
  return ` LIMIT ${lim} OFFSET ${off}`;
}

/** Жагсаалтын функцэд `{ pageSize, offset }` тусдаа дамжих үед */
function sqlLimitOffsetPair(pageSize, offset, opts = {}) {
  return sqlLimitOffset({ pageSize, offset }, opts);
}

module.exports = { sqlLimitOffset, sqlLimitOffsetPair };
