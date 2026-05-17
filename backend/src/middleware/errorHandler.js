const { AppError } = require("../utils/appError");
const { fail } = require("../utils/apiResponse");

function mapMysqlDriverError(err) {
  const code = err.code || err.errno;
  if (code === "ER_DATA_TOO_LONG" || err.errno === 1406) {
    const devHint =
      process.env.NODE_ENV !== "production"
        ? " Өгөгдлийн санд logo_url MEDIUMTEXT болгосон эсэхийг шалгана уу (backend/sql/alter_provider_onboarding_logo_url.sql)."
        : "";
    return new AppError(
      413,
      `Лого эсвэл талбарын урт серверийн хязгаараас хэтэрсэн байна. Жижиг зураг сонгоно уу.${devHint}`,
      {
        code: "DATA_TOO_LONG",
        details: process.env.NODE_ENV !== "production" ? { sqlMessage: err.sqlMessage } : undefined,
      },
    );
  }
  if (code === "ER_DUP_ENTRY" || err.errno === 1062) {
    return new AppError(409, "Энэ мэдээлэл аль хэдийн бүртгэгдсэн байна.", {
      code: "DUPLICATE_ENTRY",
      details: process.env.NODE_ENV !== "production" ? { sqlMessage: err.sqlMessage } : undefined,
    });
  }
  if (code === "ER_NO_REFERENCED_ROW_2" || err.errno === 1452) {
    return new AppError(400, "Холбоотой бүртгэл олдсонгүй эсвэл устгагдсан байна.", { code: "FK_VIOLATION" });
  }
  if (code === "ER_ROW_IS_REFERENCED_2" || err.errno === 1451) {
    return new AppError(409, "Энэ бүртгэлийг устгах боломжгүй — хамааралтай өгөгдөл байна.", { code: "FK_BLOCK" });
  }
  if (code === "ER_BAD_FIELD_ERROR" || err.errno === 1054) {
    return new AppError(
      500,
      "Өгөгдлийн сангийн бүтэц API-тай таарахгүй байна. Backend хавтаснаас `npm run db:migrate:catchup` ажиллуулна уу (эсвэл `sql/migrations` доторх 003–006-г ганцаарчлан).",
      {
        code: "SCHEMA_BAD_FIELD",
        details: process.env.NODE_ENV !== "production" ? { sqlMessage: err.sqlMessage } : undefined,
      },
    );
  }
  if (code === "ER_NO_SUCH_TABLE" || err.errno === 1146) {
    return new AppError(
      500,
      "Өгөгдлийн санд шаардлагатай хүснэгт байхгүй байна. Backend дээр `npm run db:migrate:catchup` эсвэл `sql/schema.sql` ашиглана уу.",
      {
        code: "SCHEMA_NO_TABLE",
        details: process.env.NODE_ENV !== "production" ? { sqlMessage: err.sqlMessage } : undefined,
      },
    );
  }
  return null;
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const tooLarge =
    err?.type === "entity.too.large" ||
    err?.status === 413 ||
    err?.statusCode === 413 ||
    (typeof err?.message === "string" && /entity too large|request entity too large|payload too large/i.test(err.message));
  if (tooLarge) {
    return fail(
      res,
      413,
      "Илгээх өгөгдөл хэт том байна (ихэвчлэн лого). Зургийг илүү жижиг сонго эсвэл дахин оролдоно уу.",
    );
  }

  let outgoing = err;
  if (!(err instanceof AppError) && err && (err.code || err.errno)) {
    const mapped = mapMysqlDriverError(err);
    if (mapped) outgoing = mapped;
  }

  const status =
    outgoing instanceof AppError ? outgoing.statusCode : Number(outgoing.statusCode || outgoing.status) || 500;
  const message =
    status === 500 && !(outgoing instanceof AppError)
      ? "Серверийн алдаа гарлаа. Дараа дахин оролдоно уу."
      : outgoing.message || "Алдаа";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  let errors = null;
  if (outgoing instanceof AppError && (outgoing.code || outgoing.details)) {
    errors = { code: outgoing.code, details: outgoing.details };
  } else if (!(outgoing instanceof AppError) && status === 500) {
    errors = { code: "INTERNAL" };
  }

  return fail(res, status, message, errors);
}

module.exports = { errorHandler };
