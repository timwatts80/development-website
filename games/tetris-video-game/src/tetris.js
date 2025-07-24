// Tetris game constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

// Speed progression constants
const INITIAL_SPEED = 1000; // Starting drop interval in ms
const SPEED_CURVE = {
  LEVEL_1_TO_10: 100,  // Decrease by 100ms per level for levels 1-10 (more aggressive!)
  LEVEL_11_TO_20: 20,  // Decrease by 20ms per level for levels 11-20
  LEVEL_21_PLUS: 10,   // Decrease by 10ms per level for levels 21+
  MIN_SPEED: 50        // Minimum drop interval
};

// Import database functionality
import { ScoreDatabase } from './database.js';

const COLORS = {
  0: '#000000', // Empty
  1: '#FF0000', // I-piece (Red)
  2: '#00FF00', // O-piece (Green)
  3: '#0000FF', // T-piece (Blue)
  4: '#FFFF00', // S-piece (Yellow)
  5: '#FF00FF', // Z-piece (Magenta)
  6: '#00FFFF', // J-piece (Cyan)
  7: '#FFA500'  // L-piece (Orange)
};

// Color variations for 3D effect
const HIGHLIGHT_COLORS = {
  1: '#FF4444', // I-piece highlight
  2: '#44FF44', // O-piece highlight
  3: '#4444FF', // T-piece highlight
  4: '#FFFF44', // S-piece highlight
  5: '#FF44FF', // Z-piece highlight
  6: '#44FFFF', // J-piece highlight
  7: '#FFB844'  // L-piece highlight
};

const SHADOW_COLORS = {
  1: '#CC0000', // I-piece shadow
  2: '#00CC00', // O-piece shadow
  3: '#0000CC', // T-piece shadow
  4: '#CCCC00', // S-piece shadow
  5: '#CC00CC', // Z-piece shadow
  6: '#00CCCC', // J-piece shadow
  7: '#CC7700'  // L-piece shadow
};

// Tetromino shapes
const TETROMINOES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: 1
  },
  O: {
    shape: [
      [2, 2],
      [2, 2]
    ],
    color: 2
  },
  T: {
    shape: [
      [0, 3, 0],
      [3, 3, 3]
    ],
    color: 3
  },
  S: {
    shape: [
      [0, 4, 4],
      [4, 4, 0]
    ],
    color: 4
  },
  Z: {
    shape: [
      [5, 5, 0],
      [0, 5, 5]
    ],
    color: 5
  },
  J: {
    shape: [
      [6, 0, 0],
      [6, 6, 6]
    ],
    color: 6
  },
  L: {
    shape: [
      [0, 0, 7],
      [7, 7, 7]
    ],
    color: 7
  }
};

export class TetrisGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.nextCanvas = null;
    this.nextCtx = null;
    this.board = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropCounter = 0;
    this.dropInterval = INITIAL_SPEED; // milliseconds
    this.lastTime = 0;
    this.gameRunning = false;
    this.gamePaused = false;
    this.gameStarted = false;
    this.bubbleEffects = []; // Array to store active bubble effects
    this.playerName = '';
    this.database = new ScoreDatabase();
    this.lastScoreResult = null;
    this.serverConnected = false;
    
    // Initialize empty board
    this.initBoard();
    
    // Check server connection on startup
    this.checkServerConnection();
  }

  init() {
    // Get canvas elements
    this.canvas = document.getElementById('game-board');
    this.ctx = this.canvas.getContext('2d');
    this.nextCanvas = document.getElementById('next-piece');
    this.nextCtx = this.nextCanvas.getContext('2d');

    // Set up event listeners
    this.setupEventListeners();
    
    // Initial render
    this.render();
    this.updateUI();
    
    // Show name input modal
    this.showNameModal();
  }

  initBoard() {
    this.board = Array.from({ length: BOARD_HEIGHT }, () => 
      Array.from({ length: BOARD_WIDTH }, () => 0)
    );
  }

  setupEventListeners() {
    // Button event listeners
    document.getElementById('start-btn').addEventListener('click', () => this.startGame().catch(console.error));
    document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
    document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
    document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());

    // Modal event listeners
    document.getElementById('start-game-btn').addEventListener('click', () => this.handleNameSubmit());
    document.getElementById('show-leaderboard-btn').addEventListener('click', () => this.showLeaderboard());
    document.getElementById('close-leaderboard-btn').addEventListener('click', () => this.closeLeaderboard());

    // Player name input enter key
    document.getElementById('player-name').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleNameSubmit();
      }
    });

    // Keyboard event listeners
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));

    // Mobile touch controls
    this.setupMobileControls();
  }

  handleKeyPress(event) {
    if (!this.gameRunning || this.gamePaused) return;

    switch (event.code) {
      case 'ArrowLeft':
        event.preventDefault();
        this.movePiece(-1, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.movePiece(1, 0);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.softDrop();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.rotatePiece();
        break;
      case 'Space':
        event.preventDefault();
        this.hardDrop().catch(console.error);
        break;
      case 'KeyP':
        event.preventDefault();
        this.togglePause();
        break;
    }
  }

  setupMobileControls() {
    const mobileControls = document.getElementById('mobile-controls');
    
    // Prevent default touch behaviors
    document.addEventListener('touchstart', (e) => {
      if (e.target.classList.contains('touch-btn')) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (e.target.classList.contains('touch-btn')) {
        e.preventDefault();
      }
    }, { passive: false });

    // Mobile control buttons
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const downBtn = document.getElementById('down-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const hardDropBtn = document.getElementById('hard-drop-btn');

    // Touch event handlers
    leftBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleMobileInput('left');
    });

    rightBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleMobileInput('right');
    });

    downBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleMobileInput('down');
    });

    rotateBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleMobileInput('rotate');
    });

    hardDropBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleMobileInput('hardDrop');
    });

    // Also handle click events for desktop testing
    leftBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleMobileInput('left');
    });

    rightBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleMobileInput('right');
    });

    downBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleMobileInput('down');
    });

    rotateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleMobileInput('rotate');
    });

    hardDropBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleMobileInput('hardDrop');
    });

    // Add swipe gestures on the game board
    this.setupSwipeGestures();
  }

  handleMobileInput(action) {
    if (!this.gameRunning || this.gamePaused) return;

    switch (action) {
      case 'left':
        this.movePiece(-1, 0);
        break;
      case 'right':
        this.movePiece(1, 0);
        break;
      case 'down':
        this.softDrop();
        break;
      case 'rotate':
        this.rotatePiece();
        break;
      case 'hardDrop':
        this.hardDrop().catch(console.error);
        break;
    }
  }

  setupSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
    }, { passive: false });
  }

  handleSwipe(startX, startY, endX, endY) {
    if (!this.gameRunning || this.gamePaused) return;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const minSwipeDistance = 30;

    // Determine if it's a horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          this.movePiece(1, 0); // Swipe right
        } else {
          this.movePiece(-1, 0); // Swipe left
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          this.softDrop(); // Swipe down
        } else {
          this.rotatePiece(); // Swipe up
        }
      }
    }

    // Tap (no significant movement) rotates the piece
    if (Math.abs(deltaX) <= 10 && Math.abs(deltaY) <= 10) {
      this.rotatePiece();
    }
  }

  async startGame() {
    this.gameRunning = true;
    this.gameStarted = true;
    this.gamePaused = false;
    await this.spawnPiece();
    this.spawnNextPiece();
    this.updateButtons();
    this.gameLoop();
  }

  togglePause() {
    if (!this.gameStarted) return;
    this.gamePaused = !this.gamePaused;
    this.updateButtons();
    if (!this.gamePaused) {
      this.gameLoop();
    }
  }

  resetGame() {
    this.gameRunning = false;
    this.gameStarted = false;
    this.gamePaused = false;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = INITIAL_SPEED;
    this.bubbleEffects = []; // Clear bubble effects
    this.initBoard();
    this.currentPiece = null;
    this.nextPiece = null;
    this.hideGameOver();
    this.updateButtons();
    this.updateUI();
    this.render();
  }

  restartGame() {
    this.resetGame();
    this.hideGameOver();
    this.showNameModal();
  }

  updateButtons() {
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    
    startBtn.disabled = this.gameStarted;
    pauseBtn.disabled = !this.gameStarted;
    pauseBtn.textContent = this.gamePaused ? 'Resume' : 'Pause';

    // Update mobile control buttons
    this.updateMobileControls();
  }

  updateMobileControls() {
    const mobileButtons = [
      'left-btn', 'right-btn', 'down-btn', 'rotate-btn', 'hard-drop-btn'
    ];

    mobileButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.disabled = !this.gameRunning || this.gamePaused;
      }
    });
  }

  async spawnPiece() {
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
    } else {
      this.currentPiece = this.createRandomPiece();
    }
    this.spawnNextPiece();
    
    // Check for game over
    if (this.checkCollision(this.currentPiece, 0, 0)) {
      await this.gameOver();
    }
  }

  spawnNextPiece() {
    this.nextPiece = this.createRandomPiece();
    this.renderNextPiece();
  }

  createRandomPiece() {
    const pieces = Object.keys(TETROMINOES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    const piece = TETROMINOES[randomPiece];
    
    return {
      shape: piece.shape.map(row => [...row]),
      color: piece.color,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2),
      y: 0
    };
  }

  movePiece(dx, dy) {
    if (!this.currentPiece) return;
    
    if (!this.checkCollision(this.currentPiece, dx, dy)) {
      this.currentPiece.x += dx;
      this.currentPiece.y += dy;
      this.render();
    }
  }

  rotatePiece() {
    if (!this.currentPiece) return;
    
    const rotated = this.rotateMatrix(this.currentPiece.shape);
    const originalShape = this.currentPiece.shape;
    const originalX = this.currentPiece.x;
    const originalY = this.currentPiece.y;
    
    // Temporarily apply rotation
    this.currentPiece.shape = rotated;
    
    // Try different wall kick positions
    const wallKicks = this.getWallKicks();
    
    for (const kick of wallKicks) {
      this.currentPiece.x = originalX + kick.x;
      this.currentPiece.y = originalY + kick.y;
      
      if (!this.checkCollision(this.currentPiece, 0, 0)) {
        // Rotation successful with this wall kick
        this.render();
        return;
      }
    }
    
    // All wall kicks failed, revert rotation
    this.currentPiece.shape = originalShape;
    this.currentPiece.x = originalX;
    this.currentPiece.y = originalY;
  }

  rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = matrix[i][j];
      }
    }
    
    return rotated;
  }

  getWallKicks() {
    // Wall kick data - positions to try in order when rotation fails
    // These are the standard Tetris wall kick offsets
    return [
      { x: 0, y: 0 },   // Original position
      { x: -1, y: 0 },  // Left
      { x: 1, y: 0 },   // Right
      { x: -2, y: 0 },  // Far left
      { x: 2, y: 0 },   // Far right
      { x: 0, y: -1 },  // Up
      { x: -1, y: -1 }, // Left + up
      { x: 1, y: -1 },  // Right + up
      { x: 0, y: 1 },   // Down (for edge cases)
    ];
  }

  softDrop() {
    this.movePiece(0, 1);
  }

  async hardDrop() {
    if (!this.currentPiece) return;
    
    while (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
    }
    await this.placePiece();
  }

  checkCollision(piece, dx, dy) {
    const newX = piece.x + dx;
    const newY = piece.y + dy;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;
          
          // Check boundaries
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return true;
          }
          
          // Check existing pieces (only if not above the board)
          if (boardY >= 0 && this.board[boardY][boardX]) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  async placePiece() {
    if (!this.currentPiece) return;
    
    // Place piece on board
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const boardY = this.currentPiece.y + y;
          const boardX = this.currentPiece.x + x;
          if (boardY >= 0) {
            this.board[boardY][boardX] = this.currentPiece.color;
          }
        }
      }
    }
    
    // Check for completed lines
    this.clearLines();
    
    // Spawn new piece
    await this.spawnPiece();
    this.render();
  }

  clearLines() {
    let linesCleared = 0;
    const clearedLinePositions = [];
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell !== 0)) {
        // Store the line position and colors for bubble effects
        clearedLinePositions.push({
          y: y,
          colors: [...this.board[y]]
        });
        
        // Remove completed line
        this.board.splice(y, 1);
        // Add new empty line at top
        this.board.unshift(Array(BOARD_WIDTH).fill(0));
        linesCleared++;
        y++; // Check same line again
      }
    }
    
    if (linesCleared > 0) {
      // Create bubble effects for cleared lines
      this.createBubbleEffects(clearedLinePositions);
      
      this.lines += linesCleared;
      this.updateScore(linesCleared);
      this.updateLevel();
      this.updateUI();
    }
  }

  updateScore(linesCleared) {
    const points = [0, 40, 100, 300, 1200];
    this.score += points[linesCleared] * this.level;
  }

  updateLevel() {
    const newLevel = Math.floor(this.lines / 10) + 1;
    if (newLevel > this.level) {
      const oldLevel = this.level;
      this.level = newLevel;
      
      // Calculate new drop interval with refined speed progression
      let newDropInterval;
      
      if (this.level <= 10) {
        // Levels 1-10: More aggressive speed increase for early game
        newDropInterval = INITIAL_SPEED - (this.level - 1) * SPEED_CURVE.LEVEL_1_TO_10;
      } else if (this.level <= 20) {
        // Levels 11-20: Moderate speed increase for mid game
        const level10Speed = INITIAL_SPEED - 9 * SPEED_CURVE.LEVEL_1_TO_10; // Speed at level 10
        newDropInterval = level10Speed - (this.level - 10) * SPEED_CURVE.LEVEL_11_TO_20;
      } else {
        // Levels 21+: Small speed increase for late game
        const level20Speed = INITIAL_SPEED - 9 * SPEED_CURVE.LEVEL_1_TO_10 - 10 * SPEED_CURVE.LEVEL_11_TO_20;
        newDropInterval = level20Speed - (this.level - 20) * SPEED_CURVE.LEVEL_21_PLUS;
      }
      
      // Ensure minimum speed
      this.dropInterval = Math.max(SPEED_CURVE.MIN_SPEED, newDropInterval);
      
      console.log(`🎉 Level Up! Level ${oldLevel} → ${this.level} (Speed: ${this.dropInterval}ms)`);
      
      // Create visual feedback for level up
      this.createLevelUpEffect();
    }
  }

  // Create visual effect when leveling up
  createLevelUpEffect() {
    // Add a level up bubble effect
    const effect = {
      x: BOARD_WIDTH / 2,
      y: 5,
      text: `LEVEL ${this.level}!`,
      life: 120, // frames
      color: '#00ffff',
      size: 1.5,
      type: 'levelup'
    };
    this.bubbleEffects.push(effect);
  }

  createBubbleEffects(clearedLinePositions) {
    // Create bubble effects for each cleared line
    clearedLinePositions.forEach(lineData => {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const color = lineData.colors[x];
        if (color !== 0) {
          // Create multiple small bubbles for each block
          for (let i = 0; i < 3; i++) {
            this.bubbleEffects.push({
              x: x * CELL_SIZE + CELL_SIZE / 2 + (Math.random() - 0.5) * 10,
              y: lineData.y * CELL_SIZE + CELL_SIZE / 2 + (Math.random() - 0.5) * 10,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4 - 2, // Slight upward bias
              size: Math.random() * 8 + 4,
              color: COLORS[color],
              alpha: 1.0,
              life: 60, // frames
              maxLife: 60
            });
          }
        }
      }
    });
  }

  updateBubbleEffects() {
    // Update and remove expired bubble effects
    this.bubbleEffects = this.bubbleEffects.filter(bubble => {
      if (bubble.type === 'levelup') {
        // Level up effects move upward and fade
        bubble.y -= 0.05;
        bubble.life--;
        bubble.alpha = bubble.life / 120; // 120 frames total
        bubble.size += 0.01; // Grow slightly
        return bubble.life > 0;
      } else {
        // Regular bubble effects
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        bubble.vy += 0.1; // Gravity
        
        // Update life and alpha
        bubble.life--;
        bubble.alpha = bubble.life / bubble.maxLife;
        bubble.size *= 0.98; // Slightly shrink over time
        
        return bubble.life > 0;
      }
    });
  }

  drawBubbleEffects() {
    this.bubbleEffects.forEach(bubble => {
      this.ctx.save();
      this.ctx.globalAlpha = bubble.alpha;
      
      if (bubble.type === 'levelup') {
        // Draw level up text effect
        this.ctx.font = `bold ${bubble.size * 16}px system-ui`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Draw text with glow effect
        this.ctx.shadowColor = bubble.color;
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = bubble.color;
        this.ctx.fillText(
          bubble.text,
          bubble.x * CELL_SIZE + CELL_SIZE / 2,
          bubble.y * CELL_SIZE + CELL_SIZE / 2
        );
        
        // Draw text outline
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(
          bubble.text,
          bubble.x * CELL_SIZE + CELL_SIZE / 2,
          bubble.y * CELL_SIZE + CELL_SIZE / 2
        );
      } else {
        // Draw regular bubble with gradient
        const gradient = this.ctx.createRadialGradient(
          bubble.x, bubble.y, 0,
          bubble.x, bubble.y, bubble.size
        );
        gradient.addColorStop(0, bubble.color + '80'); // Semi-transparent center
        gradient.addColorStop(0.7, bubble.color + '40');
        gradient.addColorStop(1, bubble.color + '00'); // Transparent edge
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add a bright center
        this.ctx.fillStyle = bubble.color + 'FF';
        this.ctx.beginPath();
        this.ctx.arc(bubble.x, bubble.y, bubble.size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
  }

  gameLoop(time = 0) {
    if (!this.gameRunning || this.gamePaused) return;
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += deltaTime;
    
    // Update bubble effects
    this.updateBubbleEffects();
    
    if (this.dropCounter > this.dropInterval) {
      if (this.currentPiece) {
        if (this.checkCollision(this.currentPiece, 0, 1)) {
          // Handle async placePiece without blocking the game loop
          this.placePiece().catch(console.error);
        } else {
          this.currentPiece.y++;
          this.render();
        }
      }
      this.dropCounter = 0;
    }
    
    // Always render to update bubble effects
    this.render();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  async gameOver() {
    this.gameRunning = false;
    this.gameStarted = false;
    await this.saveScore();
    this.showGameOver();
    this.updateButtons();
  }

  showGameOver() {
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('game-over').classList.remove('hidden');
  }

  hideGameOver() {
    document.getElementById('game-over').classList.add('hidden');
  }

  // Modal handling methods
  showNameModal() {
    document.getElementById('name-modal').classList.remove('hidden');
    document.getElementById('player-name').focus();
  }

  hideNameModal() {
    document.getElementById('name-modal').classList.add('hidden');
  }

  handleNameSubmit() {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim();
    
    if (name.length === 0) {
      alert('Please enter your name!');
      nameInput.focus();
      return;
    }
    
    this.playerName = name;
    this.hideNameModal();
    nameInput.value = ''; // Clear for next time
  }

  async saveScore() {
    if (this.playerName && this.score > 0) {
      try {
        const result = await this.database.addScore(this.playerName, this.score);
        console.log('Score saved:', result);
        
        // Store the result for the leaderboard display
        this.lastScoreResult = result;
        
        // Show a notification if they made the leaderboard
        if (result.madeLeaderboard) {
          if (result.isNewRecord) {
            console.log('🎉 NEW HIGH SCORE! 🎉');
          } else {
            console.log(`Made the leaderboard at rank #${result.rank}!`);
          }
        }
      } catch (error) {
        console.error('Failed to save score:', error);
        this.lastScoreResult = null;
      }
    }
  }

  async showLeaderboard() {
    this.hideGameOver();
    try {
      const leaderboard = await this.database.getLeaderboard();
      this.renderLeaderboard(leaderboard);
      document.getElementById('leaderboard-modal').classList.remove('hidden');
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      // Show error message in leaderboard
      const container = document.getElementById('leaderboard-list');
      container.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Failed to load leaderboard. Please try again.</p>';
      document.getElementById('leaderboard-modal').classList.remove('hidden');
    }
  }

  closeLeaderboard() {
    document.getElementById('leaderboard-modal').classList.add('hidden');
    this.showNameModal(); // Ask for name again for next game
  }

  renderLeaderboard(scores) {
    const container = document.getElementById('leaderboard-list');
    
    if (scores.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #888;">No scores yet!</p>';
      return;
    }
    
    container.innerHTML = scores.map((entry, index) => {
      const isCurrentPlayer = entry.name === this.playerName;
      const className = isCurrentPlayer ? 'leaderboard-entry current-player' : 'leaderboard-entry';
      
      return `
        <div class="${className}">
          <span class="leaderboard-rank">#${entry.rank}</span>
          <span class="leaderboard-name">${entry.name}</span>
          <span class="leaderboard-score">${entry.score.toLocaleString()}</span>
        </div>
      `;
    }).join('');
  }

  // Check server connection
  async checkServerConnection() {
    try {
      this.serverConnected = await this.database.checkServerHealth();
      this.updateServerStatus();
    } catch (error) {
      this.serverConnected = false;
      this.updateServerStatus();
    }
  }

  updateServerStatus() {
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    if (this.serverConnected) {
      indicator.className = 'status-indicator connected';
      statusText.textContent = 'Global Leaderboard';
    } else {
      indicator.className = 'status-indicator disconnected';
      statusText.textContent = 'Local Scores Only';
    }
    
    console.log(`Server status: ${this.serverConnected ? 'Connected' : 'Offline (using local storage)'}`);
  }

  updateUI() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('lines').textContent = this.lines;
    document.getElementById('level').textContent = this.level;
  }

  // Draw a 3D-style block with highlights and shadows
  draw3DBlock(ctx, x, y, size, color) {
    const highlightColor = HIGHLIGHT_COLORS[color];
    const shadowColor = SHADOW_COLORS[color];
    const mainColor = COLORS[color];
    
    // Main block
    ctx.fillStyle = mainColor;
    ctx.fillRect(x, y, size, size);
    
    // Top highlight
    ctx.fillStyle = highlightColor;
    ctx.fillRect(x, y, size, size * 0.2);
    
    // Left highlight
    ctx.fillRect(x, y, size * 0.2, size);
    
    // Bottom shadow
    ctx.fillStyle = shadowColor;
    ctx.fillRect(x, y + size * 0.8, size, size * 0.2);
    
    // Right shadow
    ctx.fillRect(x + size * 0.8, y, size * 0.2, size);
    
    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }

  // Draw a smaller 3D-style block for the next piece preview
  drawSmall3DBlock(ctx, x, y, size, color) {
    const highlightColor = HIGHLIGHT_COLORS[color];
    const shadowColor = SHADOW_COLORS[color];
    const mainColor = COLORS[color];
    
    // Main block
    ctx.fillStyle = mainColor;
    ctx.fillRect(x, y, size, size);
    
    // Highlights and shadows (adjusted for smaller size)
    const highlightSize = Math.max(1, size * 0.25);
    const shadowSize = Math.max(1, size * 0.25);
    
    // Top highlight
    ctx.fillStyle = highlightColor;
    ctx.fillRect(x, y, size, highlightSize);
    
    // Left highlight
    ctx.fillRect(x, y, highlightSize, size);
    
    // Bottom shadow
    ctx.fillStyle = shadowColor;
    ctx.fillRect(x, y + size - shadowSize, size, shadowSize);
    
    // Right shadow
    ctx.fillRect(x + size - shadowSize, y, shadowSize, size);
    
    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, size, size);
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw board
    this.drawBoard();
    
    // Draw current piece
    if (this.currentPiece) {
      this.drawPiece(this.currentPiece, this.ctx);
    }
    
    // Draw grid
    this.drawGrid();
    
    // Draw bubble effects on top
    this.drawBubbleEffects();
  }

  drawBoard() {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (this.board[y][x]) {
          this.draw3DBlock(this.ctx, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, this.board[y][x]);
        }
      }
    }
  }

  drawPiece(piece, context) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const drawX = (piece.x + x) * CELL_SIZE;
          const drawY = (piece.y + y) * CELL_SIZE;
          this.draw3DBlock(context, drawX, drawY, CELL_SIZE, piece.color);
        }
      }
    }
  }

  drawGrid() {
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * CELL_SIZE, 0);
      this.ctx.lineTo(x * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * CELL_SIZE);
      this.ctx.lineTo(BOARD_WIDTH * CELL_SIZE, y * CELL_SIZE);
      this.ctx.stroke();
    }
  }

  renderNextPiece() {
    if (!this.nextPiece) return;
    
    // Clear next piece canvas
    this.nextCtx.fillStyle = '#000000';
    this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    
    // Calculate centering offset for smaller canvas
    const blockSize = 15; // Reduced from 20 to fit smaller canvas
    const pieceWidth = this.nextPiece.shape[0].length * blockSize;
    const pieceHeight = this.nextPiece.shape.length * blockSize;
    const offsetX = (this.nextCanvas.width - pieceWidth) / 2;
    const offsetY = (this.nextCanvas.height - pieceHeight) / 2;
    
    // Draw next piece with 3D effect
    for (let y = 0; y < this.nextPiece.shape.length; y++) {
      for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
        if (this.nextPiece.shape[y][x]) {
          this.drawSmall3DBlock(
            this.nextCtx, 
            offsetX + x * blockSize, 
            offsetY + y * blockSize, 
            blockSize, 
            this.nextPiece.color
          );
        }
      }
    }
  }
}
