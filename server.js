const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/matches", async (req, res) => {
  try {
    // 1. Conexión segura a la API externa
    const response = await fetch("https://free-api-live-football-data.p.rapidapi.com/football-current-live", {
      method: "GET",
      headers: {
        "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com",
        "x-rapidapi-key": process.env.API_KEY // Tu clave secreta protegida en Render
      }
    });

    if (!response.ok) throw new Error("Fallo en la respuesta de la API");

    const datosCrudos = await response.json();

    // 2. Mapeo: Traducir los datos de la API a tu propio formato
    // Nota: Los nombres exactos (home_team, etc.) dependen de la API, este es el estándar.
    const partidosFormateados = datosCrudos.response.live.map(partido => {
      return {
        homeTeam: partido.home_team || "Local",
        awayTeam: partido.away_team || "Visitante",
        homeScore: partido.home_score || 0,
        awayScore: partido.away_score || 0,
        status: partido.status || "En juego",
        time: partido.time || "90'"
      };
    });

    res.json(partidosFormateados);

  } catch (error) {
    console.error("Usando datos de respaldo. Motivo:", error.message);
    // 3. Sistema anticaídas: Si la API falla, cargamos tus datos manuales.
    const datosRespaldo = require("./public/data.json");
    res.json(datosRespaldo);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});