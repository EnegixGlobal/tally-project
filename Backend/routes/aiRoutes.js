const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post('/extract-bill', upload.single('billImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Extract detailed bill data. Return ONLY a JSON object exactly structured as follows: { \"invoiceNumber\": string, \"date\": string (YYYY-MM-DD), \"supplierName\": string, \"totalTaxableValue\": number, \"totalIgst\": number, \"totalCgst\": number, \"totalSgst\": number, \"tdsAmount\": number, \"discountAmount\": number, \"items\": [{ \"name\": string, \"hsnSac\": string, \"quantity\": number, \"unit\": string, \"rate\": number, \"taxableValue\": number, \"igstAmount\": number, \"cgstAmount\": number, \"sgstAmount\": number, \"discount\": number, \"purchaseLedgerHint\": string }] }. If any field is not found, use null or 0. Do not include markdown formatting like ```json." },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }]
      })
    });

    if (!response.ok) {
       console.error(`Gemini API Error: ${response.status}`);
       const errorData = await response.text();
       return res.status(response.status).json({ error: 'Failed to extract data from Gemini API', details: errorData });
    }

    const data = await response.json();
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      return res.status(500).json({ error: 'No extraction content returned from AI.' });
    }

    const cleanJson = extractedText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);
    console.log('data', parsedData);

    return res.status(200).json(parsedData);

  } catch (error) {
    console.error('Extraction Error:', error);
    return res.status(500).json({ error: 'Internal server error during bill extraction.' });
  }
});

module.exports = router;
