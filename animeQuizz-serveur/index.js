const express = require("express");
const { addUser, checkUsername, registrePLayerScore } = require("./database");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const app = express();

// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', 'http://localhost:4173'); // Autoriser l'accès depuis localhost:3000
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Méthodes autorisées
//     res.header('Access-Control-Allow-Headers', 'Content-Type'); // En-têtes autorisés
//     next();
// });
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || origin?.includes("http://localhost")) {
    console.log("connection autoriser a : ", origin);
    res.header("Access-Control-Allow-Origin", origin);
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  } else {
    console.log("connection refuser a : ", origin);
    res
      .status(403)
      .send("Vous n'avez pas d'autorisation pour accéder à cette ressource.");
  }
});

app.get(`/`, (req, res) => {
  res.send("Serveur Working Successfully");
});

app.get(`/register`, async (req, res) => {
  const username = req.query?.username;
  const name = req.query?.name;

  if (!username || !name) {
    return res.json({ status: "error", message: "aucune Information fournis" });
  }

  try {
    await addUser(username, name);
    res.json({ status: 200, registered: true });
  } catch (e) {
    res.json({ status: 200, registered: false, message: e.message });
  }
});

app.get(`/allquizz`, async (req, res) => {
  const quizztext = fs.readFileSync(path.join(__dirname, "quizzData.json"), {
    encoding: "utf-8",
  });

  quizzJson = JSON.parse(quizztext);

  const sortedQuizzJson = Object.keys(quizzJson)
    .sort()
    .reduce((acc, key) => {
      acc[key] = quizzJson[key];
      return acc;
    }, {});

  res.json(sortedQuizzJson);
});

app.get("/login", async (req, res) => {
  const username = req.query.username;
  if (!username)
    return res.json({ status: 404, message: "aucun parametre envoyez" });

  try {
    const result = await checkUsername(username);
    res.json(result);
  } catch (error) {
    res.json({ status: 404, message: error.message });
  }
});

app.get("/getquizz", async (req, res) => {
  const id = req.query.id;

  const quizztext = fs.readFileSync("quizzData.json", { encoding: "utf-8" });

  const quizzJson = JSON.parse(quizztext);

  let quizz = quizzJson[id];
  if (!quizz) {
    return res.json({ status: 404 });
  }

  for (let i = quizz.qr.length - 1; i > 0; i--) {
    // Choisir un index aléatoire entre 0 et i (inclus)
    const j = Math.floor(Math.random() * (i + 1));
    // Échanger les éléments array[i] et array[j]
    [quizz.qr[i], quizz.qr[j]] = [quizz.qr[j], quizz.qr[i]];
  }

  res.json({ status: 200, ...quizz });
});

app.get("/savedata", async (req, res) => {
  const id = req.query.id;
  const score = req.query.score;
  const qid = req.query.qid;

  await registrePLayerScore(id, qid, score)
    .catch((e) => {
      return res.json({ status: 200, issave: false, message: e.message });
    })
    .then(() => {
      res.json({ status: 200, issave: true });
    });
});

app.listen(PORT, () => {
  console.log(`Serveur started on port : ${PORT}`);
});

module.exports = app;
