# Tetris Game

A classic Tetris-style web video game built with HTML5 Canvas, vanilla JavaScript, and modern CSS. Experience the timeless gameplay of Tetris with smooth animations, responsive controls, and a modern design.

## Features

- **Classic Tetris Gameplay**: All 7 standard Tetrimino shapes (I, O, T, S, Z, J, L)
- **Smooth Controls**: Responsive keyboard controls for movement, rotation, and dropping
- **Line Clearing**: Complete horizontal lines to score points and clear the board
- **Progressive Difficulty**: Speed increases as you advance through levels
- **Next Piece Preview**: See what piece is coming next
- **Scoring System**: Earn points based on lines cleared and current level
- **Pause/Resume**: Pause the game at any time
- **Game Over Detection**: Automatic game over when pieces reach the top
- **Modern UI**: Clean, responsive design with neon-style aesthetics

## Controls

| Key | Action |
|-----|---------|
| ← → | Move piece left/right |
| ↓ | Soft drop (faster fall) |
| ↑ | Rotate piece |
| Space | Hard drop (instant drop) |
| P | Pause/Resume game |

## How to Play

1. Click **Start Game** to begin
2. Use the arrow keys to move and rotate falling pieces
3. Fill complete horizontal lines to clear them and score points
4. The game speeds up as you progress through levels
5. Game ends when pieces reach the top of the board

## Scoring

- **Single line**: 40 × level
- **Double lines**: 100 × level  
- **Triple lines**: 300 × level
- **Tetris (4 lines)**: 1200 × level

## Development

This project is built with:
- **Vite**: Fast build tool and development server
- **Vanilla JavaScript**: Modern ES6+ features
- **HTML5 Canvas**: High-performance 2D graphics
- **CSS3**: Modern styling with gradients and animations

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

### Project Structure

```
src/
├── main.js          # Application entry point
├── tetris.js        # Core game logic and classes
├── style.css        # Game styling and layout
index.html           # Main HTML template
```

## Technical Details

### Game Architecture

- **TetrisGame Class**: Main game controller managing state, rendering, and game loop
- **Canvas Rendering**: Efficient 2D drawing with separate canvases for main board and next piece
- **Game Loop**: Uses `requestAnimationFrame` for smooth 60fps gameplay
- **Collision Detection**: Robust system for piece movement and rotation validation
- **Matrix Operations**: Efficient piece rotation using matrix transformations

### Performance Features

- Optimized canvas drawing operations
- Efficient collision detection algorithms
- Memory-conscious object handling
- Responsive design for various screen sizes

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Feel free to submit issues and enhancement requests! Pull requests are welcome.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Built with ❤️ and JavaScript
