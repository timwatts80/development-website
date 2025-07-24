# Tetris Leaderboard Server

A simple Node.js/Express server that provides a global leaderboard for the Tetris game.

## Features

- **Global Leaderboard**: Store and retrieve top 10 scores from all players
- **Player Statistics**: Track individual player performance
- **Graceful Fallback**: Automatically falls back to localStorage when server is unavailable
- **RESTful API**: Clean API endpoints for score management
- **Data Persistence**: JSON file-based storage for simplicity

## Quick Start

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Server will be running on http://localhost:3001**

## API Endpoints

### GET /api/leaderboard
Get the top 10 scores with player rankings.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1234567890123,
      "name": "Player1",
      "score": 15000,
      "date": "2025-01-01T12:00:00.000Z",
      "rank": 1
    }
  ]
}
```

### POST /api/scores
Add a new score to the leaderboard.

**Request Body:**
```json
{
  "name": "PlayerName",
  "score": 12500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rank": 3,
    "madeLeaderboard": true,
    "isNewRecord": false,
    "leaderboard": [...] 
  }
}
```

### GET /api/player/:name
Get statistics for a specific player.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "PlayerName",
    "bestScore": 15000,
    "totalGames": 25,
    "averageScore": 8500
  }
}
```

### GET /api/health
Check if the server is running.

**Response:**
```json
{
  "success": true,
  "message": "Tetris Leaderboard Server is running",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### DELETE /api/scores
Clear all scores (admin endpoint).

**Response:**
```json
{
  "success": true,
  "message": "All scores cleared"
}
```

## Data Storage

Scores are stored in `scores.json` in the server directory. The file is automatically created on first run.

**Score Entry Format:**
```json
{
  "id": 1234567890123,
  "name": "PlayerName",
  "score": 15000,
  "date": "2025-01-01T12:00:00.000Z"
}
```

## Environment Variables

- `PORT`: Server port (default: 3001)

## Error Handling

The server includes comprehensive error handling:

- **Input Validation**: Validates score data before saving
- **File System Errors**: Gracefully handles file read/write issues
- **CORS Support**: Allows cross-origin requests from the game client
- **404 Handling**: Returns appropriate errors for missing endpoints

## Client Integration

The game client automatically detects server availability:

- **Connected**: Shows "Global Leaderboard" with green indicator
- **Disconnected**: Shows "Local Scores Only" with red indicator and falls back to localStorage

## Development

The server uses ES modules and includes:

- **Auto-restart**: Use `npm run dev` for development
- **CORS enabled**: Allows requests from any origin
- **JSON parsing**: Automatic request body parsing
- **Error logging**: Comprehensive error logging to console

## Production Considerations

For production deployment:

1. Set appropriate CORS origins
2. Add authentication for admin endpoints
3. Consider using a proper database (PostgreSQL, MongoDB)
4. Add rate limiting
5. Set up proper logging
6. Add SSL/HTTPS support
7. Use environment variables for configuration

## Troubleshooting

**Server won't start:**
- Check if port 3001 is available
- Ensure Node.js version 14+ is installed
- Run `npm install` to install dependencies

**Scores not saving:**
- Check server console for errors
- Ensure write permissions in server directory
- Verify scores.json file is writable

**Client shows "Local Scores Only":**
- Ensure server is running on port 3001
- Check for network connectivity
- Look for CORS errors in browser console
