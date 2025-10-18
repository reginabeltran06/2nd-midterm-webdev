import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));


const ICE_API = "https://www.anapioficeandfire.com/api/characters";
const GOT_API = "https://thronesapi.com/api/v2/Characters";

let currentIndex = 0;
let thronesCharacters = [];

async function loadThronesCharacters() {
  if (thronesCharacters.length === 0) {
    const res = await axios.get(GOT_API);
    thronesCharacters = res.data;
  }
}

async function mergeCharacterData(throneChar) {
  const name = throneChar.fullName || throneChar.firstName || "";
  let iceChar = null;

  try {
    const res = await axios.get(`${ICE_API}?name=${encodeURIComponent(name.trim())}`);
    iceChar = res.data[0] || null;
  } catch (err) {
    console.error("Error fetching from Ice & Fire:", err.message);
  }

  return {
    id: throneChar.id,
    firstName: throneChar.firstName || "Unknown",
    lastName: throneChar.lastName || "",
    fullName: throneChar.fullName,
    title: throneChar.title || "Unknown",
    family: throneChar.family || "Unknown",
    image: throneChar.imageUrl,
    born: iceChar?.born || "Unknown",
    died: iceChar?.died || "Unknown",
    aliases: iceChar?.aliases?.filter((a) => a) || [],
    titles: iceChar?.titles?.filter((t) => t) || [],
    familyCrest: iceChar?.coatOfArms || "Unknown",
  };
}

app.get("/characters/next", async (req, res) => {
  await loadThronesCharacters();
  currentIndex = (currentIndex + 1) % thronesCharacters.length;
  const merged = await mergeCharacterData(thronesCharacters[currentIndex]);
  res.json(merged);
});

app.get("/characters/prev", async (req, res) => {
  await loadThronesCharacters();
  currentIndex =
    (currentIndex - 1 + thronesCharacters.length) % thronesCharacters.length;
  const merged = await mergeCharacterData(thronesCharacters[currentIndex]);
  res.json(merged);
});

app.get("/characters/search", async (req, res) => {
  await loadThronesCharacters();
  const { name } = req.query;
  const foundIndex = thronesCharacters.findIndex((c) =>
    c.fullName.toLowerCase().includes(name.toLowerCase())
  );

  if (foundIndex ===-1 ) {
    return res.status(404).json({
      error: "Character not found",
      message: "Go back to the beginning?",
    });
  }

  currentIndex = foundIndex;


  const merged = await mergeCharacterData(thronesCharacters[currentIndex]);
  res.json(merged);
});

app.get("/characters/reset", async (req, res) => {    //usar este si search falla y necesita volver al inicio
  await loadThronesCharacters();
  currentIndex = 0;
  const merged = await mergeCharacterData(thronesCharacters[currentIndex]);
  res.json(merged);
});

//PRUEBA
app.get("/", (req, res) => {
  res.send("Backend server is running");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
