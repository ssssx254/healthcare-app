const LAB_TEST_STATUS = Object.freeze({
  SUBMITTED: "submitted",
  COMPLETED: "completed",
  REVIEWED: "reviewed",
});

const LAB_UPLOADED_BY = Object.freeze({
  CUSTOMER: "customer",
  CLINIC: "clinic",
});

const LAB_FILE_TYPES = Object.freeze(["pdf", "image", "none"]);

function isLabTestStatus(v) {
  return Object.values(LAB_TEST_STATUS).includes(v);
}

function isLabUploadedBy(v) {
  return Object.values(LAB_UPLOADED_BY).includes(v);
}

function isLabFileType(v) {
  return v == null || v === "none" || LAB_FILE_TYPES.includes(v);
}

module.exports = {
  LAB_TEST_STATUS,
  LAB_UPLOADED_BY,
  LAB_FILE_TYPES,
  isLabTestStatus,
  isLabUploadedBy,
  isLabFileType,
};
