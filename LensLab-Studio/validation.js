// Member 4 — Prasanna
// Responsibility: Request validation and camera-kind search functionality

const { getDB } = require('./database/database');

// Validation middleware for adding and updating cameras
const validateCamera = (req, res, next) => {
  const { name, kind } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Camera name is required' });
  }

  if (!kind || typeof kind !== 'string' || kind.trim() === '') {
    return res.status(400).json({ error: 'Camera kind is required' });
  }

  next();
};

// Search cameras by kind query parameter, or return all cameras if kind is not specified
const searchCameras = async (req, res) => {
  try {
    const db = getDB();
    const { kind } = req.query;

    if (kind) {
      // Parameterized query to avoid SQL injection
      const query = `SELECT * FROM cameras WHERE kind = ?;`;
      const cameras = await db.all(query, [kind]);
      return res.status(200).json(cameras);
    }

    const query = `SELECT * FROM cameras;`;
    const cameras = await db.all(query);
    return res.status(200).json(cameras);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to search cameras' });
  }
};

module.exports = {
  validateCamera,
  searchCameras,
};
