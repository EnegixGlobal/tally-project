const express = require("express");
const router = express.Router();
const multer = require("multer");

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post("/extract-bill", upload.single("billImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded." });
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
                  text: `Extract the transaction tabular data from the attached document.
Return the data STRICTLY as a JSON array of objects with these exact keys:
[
  {
    "date": "YYYY-MM-DD or DD/MM/YYYY",
    "particulars": "String (Name/Description)",
    "voucherType": "String",
    "voucherNo": "String",
    "debit": number (0 if empty),
    "credit": number (0 if empty),
    "amount": number (Total amount if debit/credit not explicitly split)
  }
]
Do not include any markdown formatting like \`\`\`json.`,
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
      return res
        .status(response.status)
        .json({
          error: "Failed to extract data from Gemini API",
          details: errorData,
        });
    }

    const data = await response.json();
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      return res
        .status(500)
        .json({ error: "No extraction content returned from AI." });
    }

    const cleanJson = extractedText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const parsedData = JSON.parse(cleanJson);

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error("Extraction Error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error during bill extraction." });
  }
});

module.exports = router;
