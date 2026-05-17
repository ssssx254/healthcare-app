const { buildMeta } = require("./listQuery");

/** Frontend / хувилбар — ирээдүйд breaking өөрчлөлтийг ялгахад ашиглана. */
const API_VERSION = "1";

/**
 * Нэг мөр / объект — `data` шууд агуулгаар.
 */
function ok(res, data = null, message = "Амжилттай") {
  return res.status(200).json({ success: true, message, data, apiVersion: API_VERSION });
}

/**
 * Жагсаалт — `data.items` + `data.meta` (хуудаслалт).
 */
function okPaginated(res, { items, total, page, pageSize }, message = "Амжилттай") {
  const meta = buildMeta({ total: Number(total) || 0, page, pageSize });
  return res.status(200).json({
    success: true,
    message,
    data: { items, meta },
    apiVersion: API_VERSION,
  });
}

function created(res, data = null, message = "Үүссэн") {
  return res.status(201).json({ success: true, message, data, apiVersion: API_VERSION });
}

function noContent(res) {
  return res.status(204).send();
}

function fail(res, statusCode, message, errors = null) {
  const body = { success: false, message, apiVersion: API_VERSION };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { ok, okPaginated, created, noContent, fail, API_VERSION };
