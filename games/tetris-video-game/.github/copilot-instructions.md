# Copilot Instructions for Tetris Video Game

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Tetris-style web video game built with HTML5 Canvas, vanilla JavaScript, and CSS. The game features classic Tetris mechanics including falling tetrominoes, line clearing, scoring system, and keyboard controls.

## Code Style Guidelines
- Use modern ES6+ JavaScript features
- Follow consistent naming conventions (camelCase for variables and functions)
- Use clear, descriptive variable and function names
- Add comments for complex game logic
- Keep functions focused and modular

## Game Architecture
- **Game State Management**: Use a centralized game state object
- **Canvas Rendering**: All graphics should be drawn on HTML5 Canvas
- **Game Loop**: Implement a proper game loop with requestAnimationFrame
- **Input Handling**: Handle keyboard events for game controls
- **Collision Detection**: Implement robust collision detection for tetrominoes

## Tetris-Specific Guidelines
- Implement all 7 standard Tetrimino shapes (I, O, T, S, Z, J, L)
- Use a grid-based coordinate system (typically 10 wide × 20 tall)
- Include proper rotation mechanics with wall kicks
- Implement line clearing animation and scoring
- Add increasing difficulty/speed as the game progresses

## Performance Considerations
- Optimize canvas drawing operations
- Use efficient collision detection algorithms
- Minimize object creation in the game loop
- Consider using object pooling for frequently created objects
