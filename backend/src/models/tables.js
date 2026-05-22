/**
 * MySQL хүснэгтийн нэрс — SQL-тай нийцүүлсэн.
 */
const tables = {
  users: "users",
  clinics: "clinics",
  doctors: "doctors",
  services: "services",
  doctorWeeklySchedules: "doctor_weekly_schedules",
  scheduleSlots: "schedule_slots",
  bookings: "bookings",
  wallets: "wallets",
  userPaymentMethods: "user_payment_methods",
  paymentMethods: "payment_methods",
  walletTransactions: "wallet_transactions",
  contentReports: "content_reports",
  platformFeaturedItems: "platform_featured_items",
  medicalNotes: "medical_notes",
  prescriptions: "prescriptions",
  labTestResults: "lab_test_results",
  chatConversations: "chat_conversations",
  chatMessages: "chat_messages",
  chatParticipantReads: "chat_participant_reads",
  consultationRequests: "consultation_requests",
  questionnaires: "questionnaires",
  notifications: "notifications",
  reviews: "reviews",
  doctorReviews: "doctor_reviews",
  labTests: "lab_tests",
  bookingLabTests: "booking_lab_tests",
};

module.exports = { tables };
