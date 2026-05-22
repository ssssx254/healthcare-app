const { pool } = require("../config/database");

async function replaceForBooking(bookingId, labTestIds) {
  await pool.execute(`DELETE FROM booking_lab_tests WHERE booking_id = ?`, [bookingId]);
  if (!labTestIds?.length) return;
  const values = labTestIds.map((labTestId) => [bookingId, labTestId]);
  await pool.query(`INSERT INTO booking_lab_tests (booking_id, lab_test_id) VALUES ?`, [values]);
}

async function listLabTestIdsForBooking(bookingId) {
  const [rows] = await pool.execute(
    `SELECT lab_test_id FROM booking_lab_tests WHERE booking_id = ? ORDER BY shared_at ASC`,
    [bookingId],
  );
  return rows.map((r) => Number(r.lab_test_id));
}

async function isSharedWithProvider(labTestId, providerUserId) {
  const [rows] = await pool.execute(
    `SELECT 1
     FROM booking_lab_tests blt
     INNER JOIN bookings b ON b.id = blt.booking_id
     INNER JOIN clinics c ON c.id = b.clinic_id
     WHERE blt.lab_test_id = ? AND c.owner_user_id = ?
     LIMIT 1`,
    [labTestId, providerUserId],
  );
  return Boolean(rows[0]);
}

module.exports = {
  replaceForBooking,
  listLabTestIdsForBooking,
  isSharedWithProvider,
};
