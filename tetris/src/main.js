import './style.css'
import { TetrisGame } from './tetris.js'

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new TetrisGame()
  game.init()
})
