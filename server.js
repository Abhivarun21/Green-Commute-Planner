const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = 3001;

/* Middleware */
app.use(cors());
app.use(express.json());

/* Root route */
app.get("/", (req, res) => {
  res.send("API WORKING");
});

/* ============================= */
/*  Carbon Emission API */
/* ============================= */
app.post("/api/emission", async (req, res) => {
  try {
    const distance = req.body.distance;

    if (!distance) {
      return res.status(400).json({ error: "Distance is required" });
    }

    const result = await pool.query("SELECT * FROM transport_modes");

    const carRow = result.rows.find(row => row.mode_name === "Car");
    const carEmission = distance * carRow.carbon_per_km;

    const emissions = result.rows.map(row => {
      const emission = distance * row.carbon_per_km;

      return {
        mode: row.mode_name,
        carbon: emission.toFixed(2),
        carbon_saved: (carEmission - emission).toFixed(2)
      };
    });

    res.json(emissions);

  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ============================= */
/*  Commute Cost API */
/* ============================= */
app.post("/api/cost", async (req, res) => {
  try {
    const distance = req.body.distance;

    if (!distance) {
      return res.status(400).json({ error: "Distance is required" });
    }

    const result = await pool.query("SELECT * FROM transport_modes");

    const costs = result.rows.map(row => {
      const cost = distance * row.cost_per_km;

      return {
        mode: row.mode_name,
        cost: cost.toFixed(2)
      };
    });

    res.json(costs);

  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});


/*  SAVE TRIP API (NEW) */
app.post("/api/save-trip", async (req, res) => {
  try {
    const { email, from, to, mode, co2, cost } = req.body;

    await pool.query(
      `INSERT INTO trips 
      (user_email, from_location, to_location, mode, co2_saved, cost) 
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, from, to, mode, co2, cost]
    );

    res.json({ message: "Trip saved successfully" });

  } catch (err) {
    console.error("Save trip error:", err);
    res.status(500).json({ error: "Error saving trip" });
  }
});


/*  GET TRIPS API (NEW) */
app.get("/api/trips/:email", async (req, res) => {
  try {
    const email = req.params.email;

    const result = await pool.query(
      "SELECT * FROM trips WHERE user_email=$1 ORDER BY date DESC",
      [email]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Fetch trips error:", err);
    res.status(500).json({ error: "Error fetching trips" });
  }
});


/* Start Server */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});