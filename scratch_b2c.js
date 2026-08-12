const db = require('./Backend/db');

async function test() {
  const [vouchers] = await db.execute(`
    SELECT sv.id, sv.number, sv.partyId, sv.date, l.name, l.gst_number 
    FROM sales_vouchers sv
    LEFT JOIN ledgers l ON sv.partyId = l.id
    ORDER BY sv.date DESC LIMIT 10
  `);
  console.log('Recent Vouchers:', vouchers);
  process.exit(0);
}
test();
