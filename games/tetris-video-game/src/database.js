// Server-based database for Tetris scores
export class ScoreDatabase {
  constructor() {
    // Use environment-aware API URL
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname === '';
    
    if (isDevelopment) {
      // Development: Use localhost with port 3001
      this.baseUrl = 'http://localhost:3001/api';
    } else {
      // Production: Use Vercel serverless functions or same origin
      // This will work with Vercel's /api directory structure
      this.baseUrl = `${window.location.origin}/api`;
    }
    
    this.maxScores = 10;
    console.log(`🌐 ScoreDatabase initialized with API URL: ${this.baseUrl}`);
    console.log(`🔧 Environment: ${isDevelopment ? 'Development' : 'Production'}`);
  }

  // Helper method to make API requests
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ API request failed for ${this.baseUrl}${endpoint}:`, error);
      
      // If server is not available, fall back to localStorage
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        console.warn(`⚠️  Server unavailable at ${this.baseUrl}, falling back to localStorage`);
        return this.fallbackToLocalStorage(endpoint, options);
      }
      
      // Network or CORS errors
      if (error.name === 'TypeError' || error.message.includes('NetworkError') || error.message.includes('CORS')) {
        console.warn(`🌐 Network/CORS error connecting to ${this.baseUrl}, falling back to localStorage`);
        return this.fallbackToLocalStorage(endpoint, options);
      }
      
      throw error;
    }
  }

  // Fallback to localStorage when server is unavailable
  fallbackToLocalStorage(endpoint, options) {
    const storageKey = 'tetris-scores-backup';
    
    if (endpoint === '/leaderboard' && options.method !== 'POST') {
      // Get scores from localStorage
      try {
        const scores = localStorage.getItem(storageKey);
        const parsedScores = scores ? JSON.parse(scores) : [];
        return {
          success: true,
          data: parsedScores.slice(0, this.maxScores).map((score, index) => ({
            ...score,
            rank: index + 1
          }))
        };
      } catch (error) {
        return { success: true, data: [] };
      }
    }
    
    if (endpoint === '/scores' && options.method === 'POST') {
      // Add score to localStorage
      try {
        const scores = localStorage.getItem(storageKey);
        const parsedScores = scores ? JSON.parse(scores) : [];
        const newScore = JSON.parse(options.body);
        
        parsedScores.push({
          ...newScore,
          date: new Date().toISOString(),
          id: Date.now()
        });
        
        // Sort and limit
        parsedScores.sort((a, b) => b.score - a.score);
        const topScores = parsedScores.slice(0, this.maxScores);
        
        localStorage.setItem(storageKey, JSON.stringify(topScores));
        
        const rank = topScores.findIndex(s => s.name === newScore.name && s.score === newScore.score);
        
        return {
          success: true,
          data: {
            rank: rank >= 0 ? rank + 1 : -1,
            madeLeaderboard: rank >= 0,
            isNewRecord: rank === 0,
            leaderboard: topScores.map((score, index) => ({
              ...score,
              rank: index + 1
            }))
          }
        };
      } catch (error) {
        console.error('localStorage fallback failed:', error);
        throw error;
      }
    }
    
    return { success: false, error: 'Operation not supported in fallback mode' };
  }

  // Get all scores from server
  async getLeaderboard() {
    try {
      const response = await this.makeRequest('/leaderboard');
      return response.data || [];
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      return [];
    }
  }

  // Add a new score and return the updated leaderboard
  async addScore(playerName, score) {
    try {
      const response = await this.makeRequest('/scores', {
        method: 'POST',
        body: JSON.stringify({
          name: playerName.trim() || 'Anonymous',
          score: score
        })
      });

      return response.data || {
        rank: -1,
        madeLeaderboard: false,
        isNewRecord: false,
        leaderboard: []
      };
    } catch (error) {
      console.error('Error adding score:', error);
      // Return default values on error
      return {
        rank: -1,
        madeLeaderboard: false,
        isNewRecord: false,
        leaderboard: []
      };
    }
  }

  // Get player statistics from server
  async getPlayerStats(playerName) {
    try {
      const response = await this.makeRequest(`/player/${encodeURIComponent(playerName)}`);
      return response.data || {
        name: playerName,
        bestScore: 0,
        totalGames: 0,
        averageScore: 0
      };
    } catch (error) {
      console.error('Error loading player stats:', error);
      return {
        name: playerName,
        bestScore: 0,
        totalGames: 0,
        averageScore: 0
      };
    }
  }

  // Check if a score would make it to the leaderboard
  async wouldMakeLeaderboard(score) {
    try {
      const leaderboard = await this.getLeaderboard();
      if (leaderboard.length < this.maxScores) {
        return true;
      }
      return score > leaderboard[leaderboard.length - 1].score;
    } catch (error) {
      console.error('Error checking leaderboard eligibility:', error);
      return true; // Assume it would make it on error
    }
  }

  // Clear all scores (admin function)
  async clearScores() {
    try {
      const response = await this.makeRequest('/scores', {
        method: 'DELETE'
      });
      return response.success;
    } catch (error) {
      console.error('Error clearing scores:', error);
      return false;
    }
  }

  // Get player's best score
  async getPlayerBestScore(playerName) {
    try {
      const stats = await this.getPlayerStats(playerName);
      return stats.bestScore;
    } catch (error) {
      console.error('Error getting player best score:', error);
      return 0;
    }
  }

  // Check server health
  async checkServerHealth() {
    try {
      const response = await this.makeRequest('/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }
}
