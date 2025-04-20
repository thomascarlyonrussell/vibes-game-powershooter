/**
 * Power Shooter Game - Main Game Logic
 */

// Global DEBUG flag - set to true for debugging help
const DEBUG_MODE = false; // Changed to false to disable debug logging

// Game states
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over',
    GAME_COMPLETE: 'game_complete',
    SHOP: 'shop'
};

class Game {
    constructor() {
        // Initialize canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state variables
        this.state = GameState.MENU;
        this.paused = false;
        this.score = 0;
        this.highScore = localStorage.getItem('powerShooterHighScore') || 0;
        
        // Input handler
        this.input = new InputHandler();
        
        // Game objects
        this.player = null;
        this.currentLevel = null;
        this.levels = {};
        this.currentLevelId = 1;
        
        // Shop system
        this.shop = null;
        
        // Timing variables
        this.lastTime = 0;
        this.gameLoopBound = this.gameLoop.bind(this);
        
        // Initialize game
        this.init();
        
        // Start the game loop
        requestAnimationFrame(this.gameLoopBound);
    }
    
    init() {
        // Create player
        this.player = new Player({
            x: 50, 
            y: this.height / 2 - 20
        });
        this.player.init(this.ctx);
        
        // Initialize shop system
        this.shop = new ShopSystem(this.player);
        // Provide the showMessage function to the shop
        this.shop.showMessage = (message, duration) => {
            showMessage(this.ctx, message, duration);
        };
        
        // Create all levels
        for (let i = 1; i <= 11; i++) {
            this.levels[i] = LevelFactory["createLevel" + i](this.width, this.height);
        }
        
        // Initialize first level
        this.loadLevel(1);
        
        // Add event listener for pause and shop
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state === GameState.SHOP) {
                    this.shop.close();
                    this.state = GameState.PLAYING;
                } else {
                    this.togglePause();
                }
            } else if (e.key === 'b' || e.key === 'B') {
                // Open/close shop with 'B' key
                if (this.state === GameState.PLAYING && !this.paused) {
                    this.openShop();
                } else if (this.state === GameState.SHOP) {
                    this.closeShop();
                }
            }
        });
    }
    
    loadLevel(levelId) {
        // Stop current level
        if (this.currentLevel) {
            this.currentLevel.endLevel();
        }
        
        // Load new level
        this.currentLevelId = levelId;
        
        try {
            if (!this.levels[levelId]) {
                console.error(`Level ${levelId} does not exist in this.levels!`);
                // Fallback to level 1 if the requested level doesn't exist
                this.currentLevel = LevelFactory["createLevel1"](this.width, this.height);
            } else {
                this.currentLevel = this.levels[levelId];
            }
            
            // Initialize level context
            if (this.ctx) {
                this.currentLevel.init(this.ctx);
            } else {
                console.error('Cannot initialize level: ctx is null');
            }
            
            // Reset player position
            if (this.player && this.currentLevel.playerStartPosition) {
                this.player.x = this.currentLevel.playerStartPosition.x;
                this.player.y = this.currentLevel.playerStartPosition.y;
            } else {
                console.error('Cannot reset player position:', 
                             this.player ? 'Missing playerStartPosition' : 'Player is null');
            }
            
            // Show level start message
            if (this.ctx) {
                showMessage(this.ctx, `Level ${levelId} - Get Ready!`, 2000);
            }
            
            // Start enemy spawning after a short delay
            setTimeout(() => {
                try {
                    this.currentLevel.startLevel();
                } catch (error) {
                    console.error('Error starting level:', error);
                }
            }, 2000);
            
        } catch (error) {
            console.error(`Error in loadLevel(${levelId}):`, error);
        }
    }
    
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Update and render based on game state
        switch (this.state) {
            case GameState.MENU:
                this.drawMenu();
                break;
                
            case GameState.PLAYING:
                if (!this.paused) {
                    try {
                        this.update(deltaTime);
                    } catch (error) {
                        console.error('Error in update:', error);
                    }
                }
                try {
                    this.draw();
                } catch (error) {
                    console.error('Error in draw:', error);
                }
                
                if (this.paused) {
                    this.drawPauseScreen();
                }
                break;
                
            case GameState.SHOP:
                // Draw the game in the background
                this.draw();
                
                // Update and draw the shop overlay
                const mousePos = this.input.getMousePosition();
                this.shop.update(this.input, mousePos.x, mousePos.y);
                this.shop.draw(this.ctx, this.width, this.height);
                break;
                
            case GameState.LEVEL_COMPLETE:
                this.drawLevelComplete();
                break;
                
            case GameState.GAME_OVER:
                this.drawGameOver();
                break;
                
            case GameState.GAME_COMPLETE:
                this.drawGameComplete();
                break;
        }
        
        // Request next frame
        requestAnimationFrame(this.gameLoopBound);
    }
    
    update(deltaTime) {
        // Check if player is initialized
        if (!this.player) {
            console.error('Player is null in update!');
            return;
        }
        
        // Update player
        try {
            this.player.update(deltaTime, this.input, {
                left: 0,
                top: 0,
                right: this.width,
                bottom: this.height
            });
        } catch (error) {
            console.error('Error updating player:', error);
        }
        
        // Update current level and check for level completion
        if (this.currentLevel) {
            try {
                const nextLevelId = this.currentLevel.update(deltaTime, this.player, this.input);
                
                // Handle level transition if a next level ID is returned
                if (nextLevelId !== null) {
                    if (nextLevelId === null || nextLevelId === undefined) {
                        // This is the final level completed
                        this.completeGame();
                    } else {
                        // Move to next level
                        this.completeLevel(nextLevelId);
                    }
                }
            } catch (error) {
                console.error('Error updating level:', error);
            }
        } else {
            console.error('Current level is null in update!');
        }
        
        // Check for player death
        if (!this.player.active) {
            this.gameOver();
        }
        
        // Check for shop toggle
        if (this.input.isKeyPressed('b') && !this.paused) {
            this.openShop();
            this.input.resetKey('b');
        }
    }
    
    draw() {
        // Check if context still exists
        if (!this.ctx) {
            console.error('Canvas context lost!');
            return;
        }
        
        // Draw current level
        if (this.currentLevel) {
            try {
                this.currentLevel.draw(this.ctx);
            } catch (error) {
                console.error('Error drawing level:', error);
            }
        } else {
            console.error('Current level is null in draw!');
        }
        
        // Draw player
        if (this.player) {
            try {
                this.player.draw(this.ctx);
            } catch (error) {
                console.error('Error drawing player:', error);
            }
        } else {
            console.error('Player is null in draw!');
        }
        
        // Draw UI
        try {
            this.drawUI();
        } catch (error) {
            console.error('Error drawing UI:', error);
        }
    }
    
    drawUI() {
        // Draw score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.player.score}`, 20, 30);
        
        // Draw health
        this.ctx.fillText(`Health: ${this.player.health}/${this.player.maxHealth}`, 20, 60);
        
        // Draw keys
        this.ctx.fillText(`Keys: ${this.player.keys}`, 20, 90);
        
        // Draw weapon level
        this.ctx.fillText(`Weapon Level: ${this.player.weaponLevel}`, 20, 120);
        
        // Draw coins
        this.ctx.fillStyle = '#FFD700'; // Gold color
        this.ctx.fillText(`Coins: ${this.player.coins}`, this.width - 150, 60);
        
        // Draw level indicator
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Level: ${this.currentLevelId}`, this.width - 20, 30);
        
        // Draw XP bar
        const xpBarWidth = 200;
        const xpBarHeight = 10;
        const xpBarX = this.width - 220;
        const xpBarY = 90;
        
        // Draw XP background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight);
        
        // Draw XP progress
        const xpProgress = this.player.xp / this.player.xpToNextLevel;
        this.ctx.fillStyle = '#8E44AD'; // Purple
        this.ctx.fillRect(xpBarX, xpBarY, xpBarWidth * xpProgress, xpBarHeight);
        
        // Draw XP text
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'right';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`XP: ${this.player.xp}/${this.player.xpToNextLevel} (Level ${this.player.level})`, this.width - 20, xpBarY + 30);
        
        // Draw shop hint
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFD700'; // Gold
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Press B to open shop', this.width - 110, 120);
        
        // Draw virtual controls for mobile devices
        if (this.input && typeof this.input.drawVirtualControls === 'function') {
            this.input.drawVirtualControls(this.ctx);
        }
    }
    
    drawMenu() {
        // Draw game title
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#3498db';
        this.ctx.font = '60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('POWER SHOOTER', this.width / 2, 150);
        
        // Draw game description
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Shoot blocks, collect power-ups, defeat enemies!', this.width / 2, 220);
        
        // Draw instructions
        this.ctx.font = '18px Arial';
        this.ctx.fillText('WASD or Arrow Keys to move', this.width / 2, 290);
        this.ctx.fillText('Mouse to aim and shoot', this.width / 2, 320);
        this.ctx.fillText('E to use keys on doors', this.width / 2, 350);
        this.ctx.fillText('B to open shop', this.width / 2, 380);
        this.ctx.fillText('ESC to pause game', this.width / 2, 410);
        
        // Draw mobile instructions if on mobile
        if (this.input.isMobile) {
            this.ctx.fillStyle = '#e67e22';
            this.ctx.fillText('Touch directional buttons to move', this.width / 2, 440);
            this.ctx.fillText('Touch shoot button to fire', this.width / 2, 470);
        } else {
            // Draw start prompt for non-mobile
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.font = '28px Arial';
            this.ctx.fillText('Click anywhere to start', this.width / 2, 470);
        }
        
        // Draw virtual controls for mobile devices
        if (this.input && typeof this.input.drawVirtualControls === 'function') {
            this.input.drawVirtualControls(this.ctx);
        }
        
        // Check for click to start game
        if (this.input.isMouseDown()) {
            this.state = GameState.PLAYING;
            this.input.reset();
        }
    }
    
    drawPauseScreen() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw pause text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME PAUSED', this.width / 2, this.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press ESC to resume', this.width / 2, this.height / 2 + 50);
    }
    
    drawLevelComplete() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw level complete text
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`LEVEL ${this.currentLevelId - 1} COMPLETE!`, this.width / 2, this.height / 2 - 80);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score: ${this.player.score}`, this.width / 2, this.height / 2 - 20);
        this.ctx.fillText(`Coins: ${this.player.coins}`, this.width / 2, this.height / 2 + 20);
        this.ctx.fillText(`Player Level: ${this.player.level}`, this.width / 2, this.height / 2 + 60);
        
        this.ctx.font = '22px Arial';
        this.ctx.fillText('Click to continue to next level', this.width / 2, this.height / 2 + 120);
        
        // Check for click to continue - use more reliable mouse click detection
        if (this.input.isMouseDown() || this.input.isMouseClicked()) {
            // Reset mouse state first to prevent multiple clicks
            this.input.reset();
            
            // Change state and load the next level
            this.state = GameState.PLAYING;
            this.loadLevel(this.currentLevelId);
        }
    }
    
    drawGameOver() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw game over text
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = '50px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 70);
        
        // Draw score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.fillText(`Your Score: ${this.player.score}`, this.width / 2, this.height / 2);
        
        // Draw high score
        if (this.player.score > this.highScore) {
            this.highScore = this.player.score;
            localStorage.setItem('powerShooterHighScore', this.highScore);
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.fillText(`New High Score!`, this.width / 2, this.height / 2 + 50);
        } else {
            this.ctx.fillText(`High Score: ${this.highScore}`, this.width / 2, this.height / 2 + 50);
        }
        
        // Draw restart prompt
        this.ctx.fillStyle = '#3498db';
        this.ctx.font = '25px Arial';
        this.ctx.fillText('Click to play again', this.width / 2, this.height / 2 + 120);
        
        // Check for click to restart
        if (this.input.isMouseDown()) {
            this.resetGame();
            this.state = GameState.MENU;
            this.input.reset();
        }
    }
    
    drawGameComplete() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw completion text
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.font = '50px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CONGRATULATIONS!', this.width / 2, this.height / 2 - 100);
        this.ctx.fillText('YOU WIN!', this.width / 2, this.height / 2 - 30);
        
        // Draw score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.fillText(`Final Score: ${this.player.score}`, this.width / 2, this.height / 2 + 50);
        
        // Draw player stats
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Player Level: ${this.player.level}`, this.width / 2, this.height / 2 + 90);
        this.ctx.fillText(`Coins Collected: ${this.player.coins}`, this.width / 2, this.height / 2 + 130);
        
        // Draw high score
        if (this.player.score > this.highScore) {
            this.highScore = this.player.score;
            localStorage.setItem('powerShooterHighScore', this.highScore);
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.fillText(`New High Score!`, this.width / 2, this.height / 2 + 180);
        } else {
            this.ctx.fillText(`High Score: ${this.highScore}`, this.width / 2, this.height / 2 + 180);
        }
        
        // Draw restart prompt
        this.ctx.fillStyle = '#3498db';
        this.ctx.font = '25px Arial';
        this.ctx.fillText('Click to play again', this.width / 2, this.height / 2 + 230);
        
        // Check for click to restart
        if (this.input.isMouseDown()) {
            this.resetGame();
            this.state = GameState.MENU;
            this.input.reset();
        }
    }
    
    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.paused = !this.paused;
        }
    }
    
    openShop() {
        if (this.state === GameState.PLAYING && !this.paused) {
            this.state = GameState.SHOP;
            this.shop.open();
        }
    }
    
    closeShop() {
        if (this.state === GameState.SHOP) {
            this.state = GameState.PLAYING;
            this.shop.close();
        }
    }
    
    gameOver() {
        this.state = GameState.GAME_OVER;
    }
    
    completeLevel(nextLevelId) {
        this.state = GameState.LEVEL_COMPLETE;
        this.currentLevelId = nextLevelId;
    }
    
    completeGame() {
        this.state = GameState.GAME_COMPLETE;
    }
    
    resetGame() {
        // Reset player
        this.player = new Player({
            x: 50, 
            y: this.height / 2 - 20
        });
        this.player.init(this.ctx);
        
        // Initialize shop system with new player
        this.shop = new ShopSystem(this.player);
        // Re-provide the showMessage function to the shop
        this.shop.showMessage = (message, duration) => {
            showMessage(this.ctx, message, duration);
        };
        
        // Reset levels
        this.levels = {};
        for (let i = 1; i <= 11; i++) {
            this.levels[i] = LevelFactory["createLevel" + i](this.width, this.height);
        }
        
        // Load first level
        this.currentLevelId = 1;
        this.loadLevel(1);
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
