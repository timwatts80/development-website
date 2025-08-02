// Vercel serverless function for leaderboard
let scores = [];

export default function handler(req, res) {
  // Enhanced CORS headers for iOS compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Cache-Control, Pragma, Expires');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // iOS-specific headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const MAX_SCORES = 10;

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

  if (req.method === 'GET') {
    // GET /api/leaderboard - Return top scores
    try {
      res.status(200).json({
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
  } else if (req.method === 'POST') {
    // POST /api/leaderboard - Add new score
    try {
      if (!validateScoreData(req.body)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid score data. Name must be a non-empty string and score must be a positive integer.'
        });
      }

      const { name, score } = req.body;

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

      // Keep only top scores
      scores = scores.slice(0, MAX_SCORES * 2);

      // Find the rank of the new score
      const finalTopScores = scores.slice(0, MAX_SCORES);
      const rank = finalTopScores.findIndex(s => s.id === newScore.id);

      res.status(200).json({
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
  } else if (req.method === 'DELETE') {
    // DELETE /api/leaderboard - Clear all scores (admin)
    try {
      scores = [];
      res.status(200).json({
        success: true,
        message: 'All scores cleared'
      });
    } catch (error) {
      console.error('Error clearing scores:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear scores'
      });
    }
  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}
