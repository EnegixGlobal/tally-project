const express = require("express");
const router = express.Router();
const db = require("../db");

// POST: create a new Form 26Q return with data
router.post("/api/tds26q", async (req, res) => {
  const {
    deductorDetails,
    challanDetails,
    deducteeDetails,
    verification,
    assessmentYear,
  } = req.body;

  try {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      // 0. Check for existing PAN and TAN
      const [existing] = await conn.query(
        "SELECT id FROM tds_26q_returns WHERE tan = ? AND pan_of_deductor = ?",
        [deductorDetails.tan, deductorDetails.panOfDeductor]
      );

      if (existing.length > 0) {
        await conn.rollback();
        conn.release();
        return res.status(409).json({ error: "An entry with this PAN and TAN already exists. Duplicate entries are not allowed." });
      }

      // 1. Insert returns main info
      const [result] = await conn.query(
        `INSERT INTO tds_26q_returns (
          tan, assessment_year, pan_of_deductor, deductor_category, deductor_name, branch_serial_no,
          deductor_flat_no, deductor_premises_name, deductor_road_street, deductor_area, deductor_town_city, deductor_state,
          deductor_country, deductor_pin_code, deductor_std_code, deductor_telephone, deductor_email,
          resp_status, resp_designation, resp_name, resp_father_name, resp_pan,
          verification_capacity, verification_place, verification_date, verification_full_name, verification_designation, verification_signature
        ) VALUES (?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        )`,
        [
          deductorDetails.tan,
          assessmentYear,
          deductorDetails.panOfDeductor,
          deductorDetails.category,
          deductorDetails.deductorName,
          deductorDetails.branchSrlNo || null,
          deductorDetails.address.flatNo,
          deductorDetails.address.premisesName,
          deductorDetails.address.roadStreet,
          deductorDetails.address.area,
          deductorDetails.address.town,
          deductorDetails.address.state,
          deductorDetails.address.country,
          deductorDetails.address.pinCode,
          deductorDetails.stdCodeNo,
          deductorDetails.telephoneNo,
          deductorDetails.email,
          deductorDetails.responsiblePerson.status,
          deductorDetails.responsiblePerson.designation,
          deductorDetails.responsiblePerson.name,
          deductorDetails.responsiblePerson.fatherName,
          deductorDetails.responsiblePerson.pan,
          verification.capacity,
          verification.declarationPlace,
          verification.declarationDate,
          verification.fullName,
          verification.designation,
          verification.signature
        ]
      );

      const returnId = result.insertId;

      // 2. Insert challan details
      if (challanDetails && challanDetails.length) {
        const placeholders = challanDetails.map(() =>
          "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).join(",");

        // Map fields in the same order as columns (15 per row including return_id)
        const values = challanDetails.flatMap((ch, index) => [
          returnId, // 1
          ch.serialNo || index + 1, // 2
          ch.bsrCode || '', // 3
          ch.dateOfDeposit, // 4
          ch.challanSerialNo || '', // 5
          ch.tax || 0, // 6
          ch.surcharge || 0, // 7
          ch.educationCess || 0, // 8
          ch.other || 0, // 9 (other_charges)
          ch.interest || 0, // 10
          ch.penalty || 0, // 11
          ch.fee || 0, // 12
          ch.total || 0, // 13 (total_amount)
          ch.transferVoucherNo || null, // 14
          ch.status || 'Deposited' // 15
        ]);

        const insertChallansSql = `
          INSERT INTO tds_26q_challans (
            return_id, serial_no, bsr_code, date_of_deposit, challan_serial_no, tax, surcharge, education_cess,
            other_charges, interest, penalty, fee, total_amount, transfer_voucher_no, status
          ) VALUES ${placeholders}
        `;
        await conn.query(insertChallansSql, values);
      }

      // 3. Insert deductee details
      if (deducteeDetails && deducteeDetails.length) {
        const placeholders = deducteeDetails.map(() =>
          "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).join(",");

        // Map fields in the same order as columns (16 per row including return_id)
        const values = deducteeDetails.flatMap((de, index) => [
          returnId, // 1
          de.serialNo || index + 1, // 2
          de.panOfDeductee || '', // 3
          de.nameOfDeductee || '', // 4
          de.amountPaid || 0, // 5
          de.amountOfTax || 0, // 6 (tax_deducted)
          de.taxDeposited || 0, // 7
          de.dateOfPayment || null, // 8
          de.natureOfPayment || null, // 9
          de.sectionUnderDeducted || '', // 10
          de.rateOfDeduction || 0, // 11
          de.certSerialNo || null, // 12
          de.dateOfTDSCertificate || null, // 13
          de.amountPaidCredited || 0, // 14
          de.gstIdentificationNo || null, // 15
          de.remarkCode || null // 16
        ]);

        const insertDeducteesSql = `
          INSERT INTO tds_26q_deductees (
            return_id, serial_no, pan_of_deductee, name_of_deductee, amount_paid, tax_deducted, tax_deposited,
            date_of_payment, nature_of_payment, section_deducted, rate_of_deduction, certificate_no, date_of_certificate,
            amount_paid_credited, gst_no, remark_code
          ) VALUES ${placeholders}
        `;
        await conn.query(insertDeducteesSql, values);
      }

      await conn.commit();
      conn.release();
      res.json({ success: true, message: "Form 26Q saved successfully.", returnId });
    } catch (err) {
      await conn.rollback();
      conn.release();
      console.error("Error inserting Form 26Q:", err);
      res.status(500).json({ error: "Failed to save Form 26Q", details: err.message });
    }
  } catch (connErr) {
    console.error("Database connection error:", connErr);
    res.status(500).json({ error: "Database connection error", details: connErr.message });
  }
});

// GET: List all returns by assessment year with summary
router.get("/api/tds26q", async (req, res) => {
  const year = req.query.year;
  if (!year) return res.status(400).json({ error: "'year' query parameter is required" });

  try {
    const sql = `
      SELECT
        r.*,
        r.assessment_year AS assessmentYear,
        r.tan,
        r.pan_of_deductor AS panOfDeductor,
        r.deductor_name AS deductorName,
        r.deductor_category AS category,
        COUNT(d.id) AS totalDeductees,
        COALESCE(SUM(d.tax_deducted), 0) AS totalTaxDeducted,
        COALESCE(SUM(c.total_amount), 0) AS totalTaxDeposited,
        MAX(r.created_at) AS createdAt
      FROM tds_26q_returns r
      LEFT JOIN tds_26q_deductees d ON r.id = d.return_id
      LEFT JOIN tds_26q_challans c ON r.id = c.return_id
      WHERE r.assessment_year = ?
      GROUP BY r.id
      ORDER BY createdAt DESC
    `;
    const [rows] = await db.query(sql, [year]);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching Form 26Q returns:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET: Fetch a single Form 26Q return by ID
router.get("/api/tds26q/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `
      SELECT
        r.*,
        r.assessment_year AS assessmentYear,
        r.tan,
        r.pan_of_deductor AS panOfDeductor,
        r.deductor_name AS deductorName,
        r.deductor_category AS category
      FROM tds_26q_returns r
      WHERE r.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Form 26Q return not found." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching Form 26Q return:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST: create or update Challans for a specific returnId
router.post("/api/tds26q_challan", async (req, res) => {
  const { returnId, challans } = req.body;
  if (!returnId || !challans) return res.status(400).json({ error: "Missing returnId or challans" });

  try {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      
      // Delete existing challans for this returnId
      await conn.query("DELETE FROM tds_26q_challans WHERE return_id = ?", [returnId]);

      if (challans.length > 0) {
        const placeholders = challans.map(() =>
          "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).join(",");

        const values = challans.flatMap((ch, index) => [
          returnId,
          ch.serialNo || index + 1,
          ch.bsrCode || '',
          ch.dateOfDeposit || null,
          ch.challanSerialNo || '',
          ch.tax || 0,
          ch.surcharge || 0,
          ch.educationCess || 0,
          ch.other || 0,
          ch.interest || 0,
          ch.penalty || 0,
          ch.fee || 0,
          ch.total || 0,
          ch.transferVoucherNo || null,
          ch.status || 'Deposited'
        ]);

        const insertChallansSql = `
          INSERT INTO tds_26q_challans (
            return_id, serial_no, bsr_code, date_of_deposit, challan_serial_no, tax, surcharge, education_cess,
            other_charges, interest, penalty, fee, total_amount, transfer_voucher_no, status
          ) VALUES ${placeholders}
        `;
        await conn.query(insertChallansSql, values);
      }

      await conn.commit();
      conn.release();
      res.json({ success: true, message: "Challans saved successfully." });
    } catch (err) {
      await conn.rollback();
      conn.release();
      console.error("Error saving challans:", err);
      res.status(500).json({ error: "Failed to save Challans", details: err.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// POST: create or update Deductees (Annexure) for a specific returnId
router.post("/api/tds26q_deductee", async (req, res) => {
  const { returnId, deductees } = req.body;
  if (!returnId || !deductees) return res.status(400).json({ error: "Missing returnId or deductees" });

  try {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      
      // Delete existing deductees for this returnId
      await conn.query("DELETE FROM tds_26q_deductees WHERE return_id = ?", [returnId]);

      if (deductees.length > 0) {
        const placeholders = deductees.map(() =>
          "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).join(",");

        const values = deductees.flatMap((de, index) => [
          returnId,
          de.serialNo || index + 1,
          de.panOfDeductee || '',
          de.nameOfDeductee || '',
          de.amountPaid || 0,
          de.amountOfTax || 0,
          de.taxDeposited || 0,
          de.dateOfPayment || null,
          de.natureOfPayment || null,
          de.sectionUnderDeducted || '',
          de.rateOfDeduction || 0,
          de.certSerialNo || null,
          de.dateOfTDSCertificate || null,
          de.amountPaidCredited || 0,
          de.gstIdentificationNo || null,
          de.remarkCode || null
        ]);

        const insertDeducteesSql = `
          INSERT INTO tds_26q_deductees (
            return_id, serial_no, pan_of_deductee, name_of_deductee, amount_paid, tax_deducted, tax_deposited,
            date_of_payment, nature_of_payment, section_deducted, rate_of_deduction, certificate_no, date_of_certificate,
            amount_paid_credited, gst_no, remark_code
          ) VALUES ${placeholders}
        `;
        await conn.query(insertDeducteesSql, values);
      }

      await conn.commit();
      conn.release();
      res.json({ success: true, message: "Annexure details saved successfully." });
    } catch (err) {
      await conn.rollback();
      conn.release();
      console.error("Error saving annexure:", err);
      res.status(500).json({ error: "Failed to save Annexure details", details: err.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// DELETE: Delete a specific Form 26Q return
router.delete("/api/tds26q/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await db.getConnection();
    await conn.query("DELETE FROM tds_26q_returns WHERE id = ?", [id]);
    conn.release();
    res.json({ success: true, message: "Form 26Q deleted successfully" });
  } catch (err) {
    console.error("Error deleting Form 26Q:", err);
    res.status(500).json({ error: "Failed to delete Form 26Q", details: err.message });
  }
});

// PUT: Update an existing Form 26Q return
router.put("/api/tds26q/:id", async (req, res) => {
  const { id } = req.params;
  const { deductorDetails, assessmentYear, verification } = req.body;

  if (!deductorDetails || !assessmentYear || !verification) {
    return res.status(400).json({ error: "Missing required fields for update." });
  }

  try {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const updateSql = `
        UPDATE tds_26q_returns SET
          tan = ?, assessment_year = ?, pan_of_deductor = ?, deductor_category = ?, deductor_name = ?, branch_serial_no = ?,
          deductor_flat_no = ?, deductor_premises_name = ?, deductor_road_street = ?, deductor_area = ?, deductor_town_city = ?, deductor_state = ?,
          deductor_country = ?, deductor_pin_code = ?, deductor_std_code = ?, deductor_telephone = ?, deductor_email = ?,
          resp_status = ?, resp_designation = ?, resp_name = ?, resp_father_name = ?, resp_pan = ?,
          verification_capacity = ?, verification_place = ?, verification_date = ?, verification_full_name = ?, verification_designation = ?
        WHERE id = ?
      `;

      await conn.query(updateSql, [
        deductorDetails.tan, assessmentYear, deductorDetails.panOfDeductor, deductorDetails.category, deductorDetails.deductorName, deductorDetails.branchSrlNo || null,
        deductorDetails.address.flatNo, deductorDetails.address.premisesName, deductorDetails.address.roadStreet, deductorDetails.address.area, deductorDetails.address.town, deductorDetails.address.state,
        deductorDetails.address.country, deductorDetails.address.pinCode, deductorDetails.stdCodeNo, deductorDetails.telephoneNo, deductorDetails.email,
        deductorDetails.respPerson.status, deductorDetails.respPerson.designation, deductorDetails.respPerson.name, deductorDetails.respPerson.fatherName, deductorDetails.respPerson.pan,
        verification.capacity, verification.place, verification.date, verification.fullName, verification.designation,
        id
      ]);

      await conn.commit();
      conn.release();
      res.json({ success: true, message: "Form 26Q updated successfully.", returnId: id });
    } catch (err) {
      await conn.rollback();
      conn.release();
      console.error("Error updating Form 26Q:", err);
      res.status(500).json({ error: "Failed to update Form 26Q", details: err.message });
    }
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ error: "Database connection error", details: err.message });
  }
});

module.exports = router;
