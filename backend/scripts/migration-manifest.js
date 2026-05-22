/**
 * Idempotent SQL migrations — catchup болон production deploy ижил жагсаалт.
 * Шинэ migration нэмэхдээ энд нэг удаа бичээд catchup + deploy хоёуланд тусгана.
 */
module.exports.CATCHUP_MIGRATIONS = [
  "002_bookings_meeting_link.sql",
  "003_clinic_approval_and_wallet.sql",
  "004_doctors_list_columns.sql",
  "005_clinics_city_type_email.sql",
  "006_doctors_title_bio.sql",
  "007_safe_catchup_core_columns_wallet_and_stats_indexes.sql",
  "008_chat_api_performance_indexes.sql",
  "009_safe_chat_core_tables.sql",
  "010_doctor_reviews.sql",
  "011_lab_tests.sql",
  "012_booking_lab_tests.sql",
  "013_payment_methods.sql",
  "014_free_consultation_flow.sql",
  "015_social_auth_columns.sql",
  "016_clinic_service_categories.sql",
  "017_clinic_logo_url.sql",
  "018_services_is_free_consultation.sql",
];
