import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());

// Cargamos credenciales del Service Account desde variables de entorno
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

// ID de tu hoja
const SPREADSHEET_ID = "1qE0yfx6Gcr2ID_EfAlhmk_CNXvexLiRDHdeMVUGdCi0";

// ✅ Obtener datos del invitado por ID
app.get("/invitado", async (req, res) => {
  const id = req.query.id;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Invitados!A2:D"
  });

  const rows = response.data.values || [];
  const row = rows.find(r => r[0] === id);

  if (!row) return res.json({ error: true });

  res.json({
    id: row[0],
    familia: row[1],
    personas: Number(row[2]),
    nombres: row[3].split(";").map(n => n.trim())
  });
});

// ✅ Registrar confirmación
app.post("/confirmar", async (req, res) => {
  const { id, familia, personas, nombres, respuesta, asistentes, nombres_confirmados } = req.body;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Confirmaciones!A:H",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [new Date().toISOString(), id, familia, personas, nombres, respuesta, asistentes, nombres_confirmados]
      ]
    }
  });

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ API lista en Render"));
