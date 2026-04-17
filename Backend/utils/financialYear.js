function getFinancialYear(date) {
  let d = new Date(date);
  if (isNaN(d.getTime())) {
    d = new Date(); // Fallback to current date if invalid
  }
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  if (month >= 4) {
    return `${String(year).slice(2)}-${String(year + 1).slice(2)}`;
  } else {
    return `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
  }
}

module.exports = { getFinancialYear };
