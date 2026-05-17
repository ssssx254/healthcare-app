const { AppError } = require("../utils/appError");
const { parsePagination } = require("../utils/listQuery");
const { assertPositiveIntId, optionalTrimmedString } = require("../utils/validation");

function validateCreateConversationBody(body) {
  const clinic_id = assertPositiveIntId(body.clinic_id, "clinic_id");
  let customer_user_id;
  if (body.customer_user_id !== undefined && body.customer_user_id !== null && String(body.customer_user_id).trim() !== "") {
    customer_user_id = assertPositiveIntId(body.customer_user_id, "customer_user_id");
  }
  return { clinic_id, customer_user_id };
}

function validateListConversationsQuery(q) {
  const { page, pageSize, offset } = parsePagination(q, { defaultPageSize: 20, maxPageSize: 100 });
  return { page, pageSize, offset };
}

function validateListMessagesQuery(q) {
  const { page, pageSize, offset } = parsePagination(q, { defaultPageSize: 50, maxPageSize: 100 });
  return { page, pageSize, offset };
}

function validateSendMessageBody(body) {
  const message = optionalTrimmedString(body.message ?? body.body, 8000);
  if (!message) {
    throw new AppError(400, "Мессежийн агуулга оруулна уу.");
  }
  return { message };
}

function validateMarkReadBody(body) {
  let up_to_message_id;
  if (body.up_to_message_id !== undefined && body.up_to_message_id !== null && String(body.up_to_message_id).trim() !== "") {
    up_to_message_id = assertPositiveIntId(body.up_to_message_id, "up_to_message_id");
  }
  return { up_to_message_id };
}

module.exports = {
  validateCreateConversationBody,
  validateListConversationsQuery,
  validateListMessagesQuery,
  validateSendMessageBody,
  validateMarkReadBody,
};

