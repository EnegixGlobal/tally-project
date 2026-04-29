function getFinancialYear(date) {
  // If date is a string like "2025-03-31", parsing it with new Date() 
  // can result in different dates based on local timezone.
  // We should parse it as a simple YYYY-MM-DD string.
  
  let year, month;
  
  if (typeof date === 'string' && date.includes('-')) {
    const parts = date.split('T')[0].split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
    }
  }
  
  if (!year || !month) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    } else {
      year = d.getFullYear();
      month = d.getMonth() + 1;
    }
  }

  if (month >= 4) {
    return `${String(year).slice(2)}-${String(year + 1).slice(2)}`;
  } else {
    return `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
  }
}

module.exports = { getFinancialYear };
