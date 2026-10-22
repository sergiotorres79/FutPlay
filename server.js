const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Sirve carpeta pública
app.use(express.static(path.join(__dirname, "public")));

// Endpoint API (opcional) para devolver datos
app.get("/api/matches", (req, res) => {
  const data = require("./public/data.json");
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});