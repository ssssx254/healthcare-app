/** Шинжилгээний файлын эх үүсвэр */
const LAB_RESULT_SOURCE = Object.freeze({
  CUSTOMER_UPLOADED: "customer_uploaded",
  CLINIC_UPLOADED: "clinic_uploaded",
});

const ALL_LAB_RESULT_SOURCES = Object.freeze(Object.values(LAB_RESULT_SOURCE));

function isLabResultSource(value) {
  return typeof value === "string" && ALL_LAB_RESULT_SOURCES.includes(value);
}

module.exports = { LAB_RESULT_SOURCE, ALL_LAB_RESULT_SOURCES, isLabResultSource };
