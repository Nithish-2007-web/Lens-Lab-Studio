// Member 5 — Anshu
// Responsibility: Special twist rule — Summary of cameras grouped by kind

const { getDB } = require('./database/database');

// GET /cameras/summary
// Aggregates cameras by their kind using SQLite GROUP BY
const getCameraSummary = async (req, res) => {
  try {
    const db = getDB();

    // SQLite GROUP BY performs the aggregation at database level
    const summaryQuery = `
      SELECT kind, COUNT(*) AS count 
      FROM cameras 
      GROUP BY kind;
    `;

    const summary = await db.all(summaryQuery);

    // Returns an array of objects: [ { kind: 'DSLR', count: 4 }, ... ]
    // When the cameras table is empty, SQLite returns an empty array [] with status 200
    res.status(200).json(summary || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve camera summary' });
  }
};

module.exports = {
  getCameraSummary,
};
