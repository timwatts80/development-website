import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const SCORES_FILE = path.join(__dirname, 'scores.json');
const MAX_SCORES = 10;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize scores file if it doesn't exist
async function initializeScoresFile() {
  try {
    await fs.access(SCORES_FILE);
  } catch (error) {
    // File doesn't exist, create it with empty array
    await fs.writeFile(SCORES_FILE, JSON.stringify([]));
    console.log('Created scores.json file');
  }
}

// Read scores from file
async function readScores() {
  try {
    const data = await fs.readFile(SCORES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading scores:', error);
    return [];
  }
}

// Write scores to file
async function writeScores(scores) {
  try {
    await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing scores:', error);
    return false;
  }
}

// Validate score data
function validateScoreData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const { name, score } = data;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return false;
  }
  
  if (!score || typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
    return false;
  }
  
  return true;
}

// API Routes

// GET /api/leaderboard - Get top 10 scores
app.get('/api/leaderboard', async (req, res) => {
  try {
    const scores = await readScores();
    res.json({
      success: true,
      data: scores.slice(0, MAX_SCORES).map((score, index) => ({
        ...score,
        rank: index + 1
      }))
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve leaderboard'
    });
  }
});

// POST /api/scores - Add a new score
app.post('/api/scores', async (req, res) => {
  try {
    if (!validateScoreData(req.body)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid score data. Name must be a non-empty string and score must be a positive integer.'
      });
    }

    const { name, score } = req.body;
    const scores = await readScores();

    // Create new score entry
    const newScore = {
      name: name.trim().substring(0, 20), // Limit name length
      score: score,
      date: new Date().toISOString(),
      id: Date.now() + Math.random() // Simple unique ID
    };

    // Add to scores array
    scores.push(newScore);

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    // Keep only top scores (a bit more than MAX_SCORES to handle ties)
    const topScores = scores.slice(0, MAX_SCORES * 2);

    // Save updated scores
    const saved = await writeScores(topScores);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save score'
      });
    }

    // Find the rank of the new score
    const finalTopScores = topScores.slice(0, MAX_SCORES);
    const rank = finalTopScores.findIndex(s => s.id === newScore.id);

    res.json({
      success: true,
      data: {
        rank: rank >= 0 ? rank + 1 : -1,
        madeLeaderboard: rank >= 0,
        isNewRecord: rank === 0,
        leaderboard: finalTopScores.map((score, index) => ({
          ...score,
          rank: index + 1
        }))
      }
    });

  } catch (error) {
    console.error('Error adding score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add score'
    });
  }
});

// GET /api/player/:name - Get player's best score
app.get('/api/player/:name', async (req, res) => {
  try {
    const playerName = req.params.name.trim().toLowerCase();
    if (!playerName) {
      return res.status(400).json({
        success: false,
        error: 'Player name is required'
      });
    }

    const scores = await readScores();
    const playerScores = scores.filter(s => 
      s.name.toLowerCase() === playerName
    );

    if (playerScores.length === 0) {
      return res.json({
        success: true,
        data: {
          name: req.params.name,
          bestScore: 0,
          totalGames: 0,
          averageScore: 0
        }
      });
    }

    const bestScore = Math.max(...playerScores.map(s => s.score));
    const totalGames = playerScores.length;
    const averageScore = Math.round(
      playerScores.reduce((sum, s) => sum + s.score, 0) / totalGames
    );

    res.json({
      success: true,
      data: {
        name: req.params.name,
        bestScore,
        totalGames,
        averageScore
      }
    });

  } catch (error) {
    console.error('Error getting player stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve player stats'
    });
  }
});

// DELETE /api/scores - Clear all scores (admin endpoint)
app.delete('/api/scores', async (req, res) => {
  try {
    const success = await writeScores([]);
    if (success) {
      res.json({
        success: true,
        message: 'All scores cleared'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to clear scores'
      });
    }
  } catch (error) {
    console.error('Error clearing scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear scores'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Tetris Leaderboard Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
async function startServer() {
  try {
    await initializeScoresFile();
    
    app.listen(PORT, () => {
      console.log(`🎮 Tetris Leaderboard Server running on port ${PORT}`);
      console.log(`📊 API endpoints:`);
      console.log(`   GET  /api/leaderboard     - Get top 10 scores`);
      console.log(`   POST /api/scores          - Add new score`);
      console.log(`   GET  /api/player/:name    - Get player stats`);
      console.log(`   GET  /api/health          - Health check`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
