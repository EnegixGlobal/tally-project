const express = require("express");
const router = express.Router();
const multer = require("multer");

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/extract-bank-statement",
  upload.single("statementFile"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const base64Data = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Extract detailed bank statement data from the provided image/pdf. Return ONLY a JSON object exactly structured as follows: { "bankName": string, "rows": [{ "Date": string (DD-MM-YYYY or DD/MM/YYYY), "Particulars": string, "Voucher": string (can be \'payment\', \'receipt\', \'contra\', \'journal\' or null), "Debit": number, "Credit": number, "Balance": string, "Narration": string, "Reference number": string }] }. If any field is not found, use null or 0 (for numbers). Do not include markdown formatting like ```json. The \'bankName\' should be the name of the bank found at the top.',
                  },
                  { inlineData: { mimeType: mimeType, data: base64Data } },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        console.error(`Gemini API Error: ${response.status}`);
        const errorData = await response.text();

        let errorMsg = "Failed to extract data from Gemini API.";
        if (response.status === 429) {
          errorMsg =
            "AI Quota Exceeded. You have reached the limit for AI extractions. Please try again later or check your API key billing.";
        } else if (response.status === 503) {
          errorMsg =
            "AI Service is temporarily unavailable or overloaded. Please wait a moment and try again.";
        } else if (response.status === 400) {
          errorMsg =
            "Bad Request to AI Service. The image or PDF might be corrupted or unsupported.";
        } else if (response.status === 403) {
          errorMsg =
            "API Key is invalid or does not have permission to access the Gemini API.";
        }

        return res.status(response.status).json({
          error: errorMsg,
          details: errorData,
          isQuotaError: response.status === 429,
        });
      }

      const data = await response.json();
      const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!extractedText) {
        return res
          .status(500)
          .json({ error: "No extraction content returned from AI." });
      }

      let parsedData;
      try {
        const cleanJson = extractedText
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        parsedData = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("Failed to parse Gemini output:", extractedText);
        return res.status(500).json({
          error: "AI did not return valid JSON data. Please try again.",
          details: extractedText,
        });
      }

      return res.status(200).json(parsedData);
    } catch (error) {
      console.error("Extraction Error:", error);
      return res.status(500).json({
        error: "Internal server error during statement extraction.",
        details: error.message || String(error),
      });
    }
  }
);

module.exports = router;
