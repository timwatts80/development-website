// Server-based database for Tetris scores
export class ScoreDatabase {
  constructor() {
    // Use environment-aware API URL
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname === '';
    
    // Detect iOS for enhanced compatibility (including iOS Chrome)
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                 /CriOS/.test(navigator.userAgent) || // Chrome on iOS
                 /FxiOS/.test(navigator.userAgent) || // Firefox on iOS
                 /EdgiOS/.test(navigator.userAgent);  // Edge on iOS
    
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
    console.log(`📱 iOS detected: ${this.isIOS}`);
    
    if (this.isIOS) {
      console.log(`🍎 iOS optimizations enabled`);
    }
  }

  // Create timeout signal compatible with older iOS versions
  createTimeoutSignal(timeout) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  // Helper method to make API requests
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // iOS-specific fetch configuration
      const fetchOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add cache-busting for iOS
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...options.headers
        },
        // Add timeout and other iOS-friendly options
        signal: this.createTimeoutSignal(this.isIOS ? 8000 : 10000),
        mode: 'cors',
        credentials: 'omit', // iOS sometimes has issues with credentials
        ...options
      };

      console.log(`📡 Making request to: ${url}`, fetchOptions);
      
      const response = await fetch(url, fetchOptions);
      
      console.log(`📨 Response status: ${response.status} for ${url}`);

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ API request failed for ${this.baseUrl}${endpoint}:`, error);
      
      // Enhanced error detection for iOS
      const isNetworkError = error.name === 'TypeError' || 
                           error.message.includes('fetch') || 
                           error.message.includes('Failed to fetch') ||
                           error.message.includes('NetworkError') ||
                           error.message.includes('timeout') ||
                           error.name === 'AbortError';
      
      const isCorsError = error.message.includes('CORS') ||
                         error.message.includes('cors');
      
      // Be more aggressive with fallback on iOS
      const shouldFallback = isNetworkError || isCorsError || this.isIOS;
      
      if (shouldFallback) {
        console.warn(`🍎 iOS/Network error detected, falling back to localStorage`);
        console.warn(`📱 Error details:`, {
          name: error.name,
          message: error.message,
          userAgent: this.isIOS ? 'iOS' : 'Other',
          isIOS: this.isIOS
        });
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
      // iOS: Skip pre-connectivity test for now, just try direct API call
      if (this.isIOS) {
        console.log(`🍎 iOS: Attempting direct API call (Chrome/Safari mode)...`);
      }

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
      
      // Fallback to localStorage if API fails
      if (this.isIOS) {
        console.log(`🍎 iOS: API failed, using localStorage fallback`);
        return this.fallbackToLocalStorage('/scores', {
          method: 'POST',
          body: JSON.stringify({
            name: playerName.trim() || 'Anonymous',
            score: score
          })
        });
      }
      
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

  // Check server health with iOS-specific handling
  async checkServerHealth() {
    try {
      console.log(`🔍 Checking server health${this.isIOS ? ' (iOS mode)' : ''}...`);
      
      // Use shorter timeout for iOS to fail fast and fallback
      const timeout = this.isIOS ? 5000 : 10000;
      
      const response = await Promise.race([
        this.makeRequest('/health'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), timeout)
        )
      ]);
      
      const isHealthy = response.success;
      console.log(`💚 Server health check: ${isHealthy ? 'PASS' : 'FAIL'}`);
      return isHealthy;
    } catch (error) {
      console.warn(`❤️‍🩹 Server health check failed:`, error.message);
      
      if (this.isIOS) {
        console.log(`🍎 iOS fallback mode activated due to health check failure`);
      }
      
      return false;
    }
  }

  // iOS-specific method to test connectivity before operations
  async testConnectivity() {
    if (!this.isIOS) {
      return true; // Skip for non-iOS
    }
    
    try {
      console.log(`🍎 Testing iOS connectivity...`);
      const startTime = Date.now();
      
      const isHealthy = await this.checkServerHealth();
      const duration = Date.now() - startTime;
      
      console.log(`🍎 iOS connectivity test: ${isHealthy ? 'PASS' : 'FAIL'} (${duration}ms)`);
      
      return isHealthy;
    } catch (error) {
      console.warn(`🍎 iOS connectivity test failed:`, error);
      return false;
    }
  }
}
