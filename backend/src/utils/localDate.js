/** Өнөөдрийн огноо (YYYY-MM-DD) — default Asia/Ulaanbaatar. */
function todayDateString(timeZone = "Asia/Ulaanbaatar") {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

module.exports = { todayDateString };
