/**
 * Power Shooter Game - Levels System
 */

// Add MovingTrain class before the Level class
class MovingTrain {
    constructor(params) {
        this.x = params.x || 0;
        this.y = params.y || 0;
        this.width = params.width || 100;
        this.height = params.height || 30;
        this.speed = params.speed || 2;
        this.color = params.color || '#CC0000'; // Default red
        this.path = params.path || 'horizontal'; // 'horizontal', 'vertical', or 'custom'
        this.active = true;
        this.damage = params.damage || 50; // Damage to player on collision
        this.pathPoints = params.pathPoints || []; // Custom path points
        this.currentPathIndex = 0;
        this.boundaryLeft = params.boundaryLeft || 0;
        this.boundaryRight = params.boundaryRight || 800;
        this.boundaryTop = params.boundaryTop || 0;
        this.boundaryBottom = params.boundaryBottom || 600;
        this.direction = 1; // Initial direction
        this.trainType = params.trainType || 'freight'; // 'freight', 'passenger', 'engine'
        
        // Initialize colors based on train type
        if (this.trainType === 'passenger') {
            this.color = '#0066CC'; // Blue for passenger trains
        } else if (this.trainType === 'engine') {
            this.color = '#CC0000'; // Red for engine
        } else {
            this.color = '#996633'; // Brown for freight cars
        }
        
        // Wheel positions
        this.wheels = [];
        this.initWheels();
    }
    
    initWheels() {
        // Calculate wheel positions based on train size
        const wheelRadius = 5;
        const wheelCount = Math.floor(this.width / 30);
        
        for (let i = 0; i < wheelCount; i++) {
            this.wheels.push({
                x: this.x + 15 + i * 30,
                y: this.y + this.height,
                radius: wheelRadius
            });
        }
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        if (this.path === 'horizontal') {
            // Move horizontally and change direction at boundaries
            this.x += this.speed * this.direction;
            
            if (this.x <= this.boundaryLeft) {
                this.x = this.boundaryLeft;
                this.direction = 1; // Move right
            } else if (this.x + this.width >= this.boundaryRight) {
                this.x = this.boundaryRight - this.width;
                this.direction = -1; // Move left
            }
        } 
        else if (this.path === 'vertical') {
            // Move vertically and change direction at boundaries
            this.y += this.speed * this.direction;
            
            if (this.y <= this.boundaryTop) {
                this.y = this.boundaryTop;
                this.direction = 1; // Move down
            } else if (this.y + this.height >= this.boundaryBottom) {
                this.y = this.boundaryBottom - this.height;
                this.direction = -1; // Move up
            }
        }
        else if (this.path === 'custom' && this.pathPoints.length > 1) {
            // Move towards the next point in the custom path
            const targetPoint = this.pathPoints[this.currentPathIndex];
            const dx = targetPoint.x - this.x;
            const dy = targetPoint.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.speed) {
                // Reached the target point, move to next point
                this.x = targetPoint.x;
                this.y = targetPoint.y;
                this.currentPathIndex = (this.currentPathIndex + 1) % this.pathPoints.length;
            } else {
                // Move towards the target point
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
        
        // Update wheel positions
        this.updateWheels();
    }
    
    updateWheels() {
        const wheelCount = this.wheels.length;
        for (let i = 0; i < wheelCount; i++) {
            this.wheels[i].x = this.x + 15 + i * 30;
            this.wheels[i].y = this.y + this.height;
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        // Draw train body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw train details based on type
        if (this.trainType === 'engine') {
            // Draw engine cab
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x, this.y, 20, 15);
            
            // Draw smokestack
            ctx.fillRect(this.x + 30, this.y - 10, 10, 10);
        } 
        else if (this.trainType === 'passenger') {
            // Draw windows
            const windowCount = Math.floor(this.width / 20) - 1;
            ctx.fillStyle = '#CCFFFF'; // Light blue windows
            
            for (let i = 0; i < windowCount; i++) {
                ctx.fillRect(this.x + 15 + i * 20, this.y + 5, 10, 10);
            }
        } 
        else {
            // Freight car - draw cargo
            ctx.fillStyle = '#DDA15E'; // Cargo color
            ctx.fillRect(this.x + 10, this.y - 5, this.width - 20, 5);
        }
        
        // Draw wheels
        ctx.fillStyle = '#000000';
        for (const wheel of this.wheels) {
            ctx.beginPath();
            ctx.arc(wheel.x, wheel.y, wheel.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw connector if not an engine
        if (this.trainType !== 'engine') {
            ctx.fillStyle = '#444444';
            ctx.fillRect(this.x - 5, this.y + this.height/2 - 3, 5, 6);
        }
    }
    
    collidesWith(object) {
        return (
            this.x < object.x + object.width &&
            this.x + this.width > object.x &&
            this.y < object.y + object.height &&
            this.y + this.height > object.y
        );
    }
}

class Level {
    constructor(id, width, height) {
        this.id = id;
        this.width = width;
        this.height = height;
        this.blocks = [];
        this.powerUps = [];
        this.doors = [];
        this.spawnAreas = [];
        this.playerStartPosition = { x: 50, y: height / 2 };
        this.background = '#111111';
        this.enemySpawner = null;
        this.nextLevelId = null;
        this.ctx = null; // Store context for later use
        this.doorInstructionShown = false; // Track if door instruction has been shown
        
        // Special level mechanics
        this.biochemBlocksDestroyed = 0; // For biochemistry-themed level
        this.biochemTarget = 3; // Number of biochem blocks to destroy to unlock the door
        
        this.birdsFreed = 0; // For bird-themed level
        this.birdTarget = 5; // Number of birds to free
        this.birds = []; // Bird objects
        
        this.mazeKeysCollected = 0; // For maze-themed level
        this.mazeKeyTarget = 3; // Number of keys needed in maze
        
        this.timedLevel = false; // For timed levels
        this.timeLimit = 60000; // Time limit in ms (default 60 seconds)
        this.timeRemaining = 60000;
        
        this.levelTheme = "standard"; // Level theme identifier
        this.levelName = ""; // Level name for display
        this.levelDescription = ""; // Level description/hint

        this.coins = []; // Coin collection
        
        this.trains = []; // Moving trains for the train level
    }
    
    init(ctx) {
        // Store the canvas context
        this.ctx = ctx;
        
        // Initialize all game objects
        for (const block of this.blocks) {
            block.init(ctx);
        }
        
        for (const powerUp of this.powerUps) {
            powerUp.init(ctx);
        }
        
        for (const door of this.doors) {
            door.init(ctx);
        }
        
        // Initialize enemy spawner
        this.enemySpawner = new EnemySpawner(this.spawnAreas, 5);
        this.enemySpawner.difficultyLevel = Math.ceil(this.id / 2);
        
        // Initialize bird textures if present
        if (this.birds.length > 0) {
            for (const bird of this.birds) {
                bird.init(ctx);
            }
        }
    }
    
    update(deltaTime, player, input) {
        // Update timer for timed levels
        if (this.timedLevel) {
            this.timeRemaining -= deltaTime;
            if (this.timeRemaining <= 0) {
                // Time's up - game over
                player.takeDamage(player.health); // Kill player
                return null;
            }
        }
        
        // Update all blocks
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            const block = this.blocks[i];
            
            // Check for collision with player projectiles
            for (let j = player.projectiles.length - 1; j >= 0; j--) {
                const projectile = player.projectiles[j];
                
                if (block.active && projectile.active && block.collidesWith(projectile)) {
                    const isDestroyed = block.takeDamage(projectile.damage);
                    if (isDestroyed) {
                        player.addScore(block.destructionScore);
                        
                        // Check if this is a biochemistry block
                        if (block.type === 'biochem') {
                            this.biochemBlocksDestroyed++;
                            showMessage(this.ctx, `Biochemical compound neutralized! (${this.biochemBlocksDestroyed}/${this.biochemTarget})`);
                            
                            // If all biochem blocks are destroyed, make the door openable with key
                            if (this.biochemBlocksDestroyed >= this.biochemTarget) {
                                showMessage(this.ctx, "Door molecular structure destabilized! Now you can open it with a key.");
                                // Make the door visually different to show it's unlockable
                                for (const door of this.doors) {
                                    door.color = '#34A853'; // Change door color to green
                                }
                            }
                        }
                        
                        // Chance to drop coins from blocks
                        if (Math.random() < 0.4) { // 40% chance to drop coins
                            const coinValue = Math.floor(3 + Math.random() * 5); // 3-7 coins
                            this.coins.push(new Coin({
                                x: block.x + block.width / 2,
                                y: block.y + block.height / 2,
                                value: coinValue
                            }));
                        }
                    }
                    
                    // Deactivate projectile
                    projectile.active = false;
                }
            }
        }
        
        // Update moving trains (for train level)
        if (this.levelTheme === 'train' && this.trains.length > 0) {
            for (const train of this.trains) {
                train.update(deltaTime);
                
                // Check for collision with player
                if (player.active && train.active && train.collidesWith(player)) {
                    // Player hit by train - take damage
                    showMessage(this.ctx, "Hit by train! Watch out!", 1500);
                    player.takeDamage(train.damage);
                    
                    // Knock player back in the opposite direction of train movement
                    const knockbackForce = 20;
                    if (train.path === 'horizontal') {
                        player.x += train.direction > 0 ? -knockbackForce : knockbackForce;
                    } else if (train.path === 'vertical') {
                        player.y += train.direction > 0 ? -knockbackForce : knockbackForce;
                    } else {
                        // For custom path, knock back away from train center
                        const dx = player.x - (train.x + train.width/2);
                        const dy = player.y - (train.y + train.height/2);
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0) {
                            player.x += (dx / dist) * knockbackForce;
                            player.y += (dy / dist) * knockbackForce;
                        }
                    }
                    
                    // Ensure player stays within bounds
                    player.x = Math.max(0, Math.min(player.x, this.width - player.width));
                    player.y = Math.max(0, Math.min(player.y, this.height - player.height));
                }
                
                // Check for collision with projectiles
                for (let j = player.projectiles.length - 1; j >= 0; j--) {
                    const projectile = player.projectiles[j];
                    if (projectile.active && train.collidesWith(projectile)) {
                        // Projectiles can't damage trains, but they get destroyed
                        projectile.active = false;
                    }
                }
            }
        }
        
        // Update all power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            // Check for collision with player projectiles
            for (let j = player.projectiles.length - 1; j >= 0; j--) {
                const projectile = player.projectiles[j];
                
                if (powerUp.active && projectile.active && powerUp.collidesWith(projectile)) {
                    const isDestroyed = powerUp.takeDamage(projectile.damage);
                    if (isDestroyed) {
                        const message = powerUp.applyPowerUp(player);
                        // Use the stored context instead of undefined ctx
                        showMessage(this.ctx, message);
                        player.addScore(powerUp.destructionScore);
                        this.powerUps.splice(i, 1);
                        
                        // Check if this is a train level
                        if (powerUp.powerUpType === 'key' && this.levelTheme === 'train') {
                            this.mazeKeysCollected++;
                            showMessage(this.ctx, `Control key found! (${this.mazeKeysCollected}/${this.mazeKeyTarget})`);
                            
                            if (this.mazeKeysCollected >= this.mazeKeyTarget) {
                                showMessage(this.ctx, "All control keys found! The exit is now unlocked!");
                                // Unlock the exit door
                                for (const door of this.doors) {
                                    door.unlock();
                                }
                            }
                            break;
                        }
                        
                        // Check if this is a maze-key level
                        if (powerUp.powerUpType === 'key' && this.levelTheme === 'maze') {
                            this.mazeKeysCollected++;
                            if (this.mazeKeysCollected >= this.mazeKeyTarget) {
                                showMessage(this.ctx, "You've collected all the keys! The exit is now unlocked!");
                                // Unlock the exit door
                                for (const door of this.doors) {
                                    door.unlock();
                                }
                            }
                        }
                    }
                    
                    // Deactivate projectile
                    projectile.active = false;
                }
            }
        }
        
        // Update all birds (for bird-themed level)
        if (this.levelTheme === 'birds') {
            // Update existing birds
            for (let i = this.birds.length - 1; i >= 0; i--) {
                const bird = this.birds[i];
                bird.update(deltaTime);
                
                // Check for projectile collision with bird cages
                if (bird.caged) {
                    for (let j = player.projectiles.length - 1; j >= 0; j--) {
                        const projectile = player.projectiles[j];
                        
                        if (projectile.active && bird.collidesWith(projectile)) {
                            // Free the bird!
                            if (bird.free()) {
                                this.birdsFreed++;
                                showMessage(this.ctx, `Bird freed! (${this.birdsFreed}/${this.birdTarget})`);
                                player.addScore(bird.scoreValue);
                                player.addXP(10); // XP for freeing birds
                                
                                // If all birds are freed, unlock the exit
                                if (this.birdsFreed >= this.birdTarget) {
                                    showMessage(this.ctx, "All birds freed! The exit is now unlocked!");
                                    // Unlock the exit door
                                    for (const door of this.doors) {
                                        door.unlock();
                                    }
                                }
                            }
                            
                            // Deactivate projectile
                            projectile.active = false;
                        }
                    }
                }
                
                // Remove birds that have flown away
                if (!bird.active) {
                    this.birds.splice(i, 1);
                }
            }
        }
        
        // Update coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.update();
            
            // Check if player collects coin
            if (!coin.collected && player.collidesWith(coin)) {
                player.addCoins(coin.collect());
                this.coins.splice(i, 1);
            }
        }
        
        // Check for collision with doors
        for (let i = this.doors.length - 1; i >= 0; i--) {
            const door = this.doors[i];
            
            // Debug information about door state
            console.log(`Door [${i}] - Position: (${door.x}, ${door.y}) - Locked: ${door.isLocked()} - Player has keys: ${player.keys}`);
            
            // Player can only interact with door if close to it
            if (player.collidesWith(door)) {
                console.log("Player is colliding with door");
                
                // Special logic for biochemistry level
                if (this.levelTheme === 'biochemistry' && this.biochemBlocksDestroyed < this.biochemTarget) {
                    if (!this.doorInstructionShown) {
                        showMessage(this.ctx, `You need to neutralize ${this.biochemTarget} biochemical compounds to destabilize the door!`);
                        this.doorInstructionShown = true;
                    }
                    continue; // Skip regular door logic
                }
                
                // Special logic for bird level
                if (this.levelTheme === 'birds' && this.birdsFreed < this.birdTarget) {
                    if (!this.doorInstructionShown) {
                        showMessage(this.ctx, `Free all ${this.birdTarget} birds to unlock the exit!`);
                        this.doorInstructionShown = true;
                    }
                    continue;
                }
                
                // Regular door logic
                if (door.isLocked() && player.keys > 0 && !this.doorInstructionShown) {
                    showMessage(this.ctx, "Press E to use a key and unlock the door");
                    this.doorInstructionShown = true;
                } else if (door.isLocked() && player.keys === 0 && !this.doorInstructionShown) {
                    showMessage(this.ctx, "You need a key to unlock this door!");
                    this.doorInstructionShown = true;
                }
                
                // Check if key pressed for unlocking door
                const eKeyPressed = input.isKeyDown('e') || input.isKeyDown('E');
                console.log(`E key pressed: ${eKeyPressed}`);
                
                if (door.isLocked() && player.keys > 0) {
                    if (eKeyPressed) {
                        console.log("Attempting to unlock door with key");
                        if (player.useKey()) {
                            door.unlock();
                            showMessage(this.ctx, "Door unlocked!");
                            console.log("Door successfully unlocked");
                        }
                    }
                } else if (!door.isLocked()) {
                    // Player can pass through unlocked door
                    console.log(`Level completed! Moving to level ${this.nextLevelId}`);
                    return this.nextLevelId; // Trigger level change
                }
            } else {
                this.doorInstructionShown = false;
            }
        }
        
        // Update enemy spawner
        if (this.enemySpawner) {
            this.enemySpawner.update(deltaTime, player);
            
            // Check for projectile hits on enemies
            for (const enemy of this.enemySpawner.enemies) {
                if (!enemy.active) continue;
                
                for (let i = player.projectiles.length - 1; i >= 0; i--) {
                    const projectile = player.projectiles[i];
                    
                    if (projectile.active && enemy.collidesWith(projectile)) {
                        const isKilled = enemy.takeDamage(projectile.damage);
                        // Projectile gets destroyed on impact
                        projectile.active = false;
                        
                        if (isKilled) {
                            // Handle enemy death
                            player.addScore(enemy.scoreValue);
                            player.addXP(enemy.xpValue);
                            
                            // Chance to drop coins
                            if (Math.random() < enemy.coinDropChance) {
                                const coinAmount = enemy.coinValue;
                                this.coins.push(new Coin({
                                    x: enemy.x,
                                    y: enemy.y,
                                    value: coinAmount
                                }));
                            }
                        }
                    }
                }
            }
        }
        
        // Continue on current level
        return null;
    }

    draw(ctx) {
        // Draw background
        ctx.fillStyle = this.background;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw all blocks
        for (const block of this.blocks) {
            if (block.active) {
                block.draw(ctx);
            }
        }
        
        // Draw all power-ups
        for (const powerUp of this.powerUps) {
            if (powerUp.active) {
                powerUp.draw(ctx);
            }
        }
        
        // Draw all doors
        for (const door of this.doors) {
            door.draw(ctx);
        }
        
        // Draw birds for bird-themed level
        if (this.levelTheme === 'birds') {
            for (const bird of this.birds) {
                if (bird.active) {
                    bird.draw(ctx);
                }
            }
        }
        
        // Draw trains for train-themed level
        if (this.levelTheme === 'train') {
            for (const train of this.trains) {
                if (train.active) {
                    train.draw(ctx);
                }
            }
        }
        
        // Draw coins
        for (const coin of this.coins) {
            coin.draw(ctx);
        }
        
        // Draw enemies
        if (this.enemySpawner) {
            this.enemySpawner.draw(ctx);
        }
        
        // Draw level UI
        this.drawLevelUI(ctx);
    }
    
    drawLevelUI(ctx) {
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        
        // Show level name
        if (this.levelName) {
            ctx.fillText(`Level ${this.id}: ${this.levelName}`, 20, 150);
        }
        
        // Show level-specific indicators
        if (this.levelTheme === 'biochemistry') {
            ctx.fillText(`Biochemical Compounds: ${this.biochemBlocksDestroyed}/${this.biochemTarget}`, 20, 180);
        } 
        else if (this.levelTheme === 'birds') {
            ctx.fillText(`Birds Freed: ${this.birdsFreed}/${this.birdTarget}`, 20, 180);
        }
        else if (this.levelTheme === 'maze') {
            ctx.fillText(`Keys Found: ${this.mazeKeysCollected}/${this.mazeKeyTarget}`, 20, 180);
        }
        
        // Show timer for timed levels
        if (this.timedLevel) {
            const seconds = Math.max(0, Math.floor(this.timeRemaining / 1000));
            ctx.fillStyle = seconds < 10 ? 'red' : 'white';
            ctx.textAlign = 'center';
            ctx.fillText(`Time: ${seconds}s`, this.width / 2, 30);
        }
    }
    
    startLevel() {
        if (this.enemySpawner) {
            this.enemySpawner.startSpawning();
        }
        
        // Initialize timer for timed levels
        if (this.timedLevel) {
            this.timeRemaining = this.timeLimit;
        }
    }
    
    endLevel() {
        if (this.enemySpawner) {
            this.enemySpawner.stopSpawning();
            this.enemySpawner.clearEnemies();
        }
    }
}

// Level factory to create game levels
class LevelFactory {
    static createLevel1(width, height) {
        const level = new Level(1, width, height);
        level.levelName = "Training Ground";
        level.levelDescription = "Find the key to unlock the door";
        level.levelTheme = "standard";
        
        // Add blocks 
        for (let i = 0; i < 5; i++) {
            level.blocks.push(new Block({
                x: 100 + i * 60,
                y: 150,
                type: 'solid',
                color: '#555555'
            }));
        }
        
        for (let i = 0; i < 3; i++) {
            level.blocks.push(new Block({
                x: 300,
                y: 250 + i * 60,
                type: 'breakable',
                color: '#8B4513',
                health: 2
            }));
        }
        
        // Add power-up blocks
        level.powerUps.push(new PowerUpBlock({
            x: 200,
            y: 300,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: 500,
            y: 200,
            powerUpType: 'health'
        }));
        
        // Add door to next level
        level.doors.push(new Door({
            x: width - 100,
            y: height / 2 - 50,
            locked: true
        }));
        
        // Add key power-up
        level.powerUps.push(new PowerUpBlock({
            x: 400,
            y: 400,
            powerUpType: 'key'
        }));
        
        // Set enemy spawn areas
        level.spawnAreas.push({
            x: width - 200,
            y: 50,
            width: 150,
            height: 150
        });
        
        level.spawnAreas.push({
            x: width - 200,
            y: height - 200,
            width: 150,
            height: 150
        });
        
        level.nextLevelId = 2;
        return level;
    }
    
    static createLevel2(width, height) {
        const level = new Level(2, width, height);
        level.levelName = "Obstacles Course";
        level.levelDescription = "Navigate through obstacles to find the key";
        level.levelTheme = "standard";
        
        // Add more complex block patterns
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (i === 1 && j === 1) continue; // Skip center
                
                level.blocks.push(new Block({
                    x: 200 + i * 70,
                    y: 150 + j * 70,
                    type: i === 0 || i === 2 || j === 0 || j === 2 ? 'solid' : 'breakable',
                    health: 3
                }));
            }
        }
        
        // Create a maze-like structure
        for (let i = 0; i < 5; i++) {
            level.blocks.push(new Block({
                x: 100,
                y: 300 + i * 50,
                type: 'solid'
            }));
            
            level.blocks.push(new Block({
                x: 500,
                y: 300 + i * 50,
                type: 'solid'
            }));
        }
        
        // Add power-ups
        level.powerUps.push(new PowerUpBlock({
            x: 235,
            y: 185,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: 600,
            y: 400,
            powerUpType: 'health'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: 150,
            y: 450,
            powerUpType: 'key'
        }));
        
        // Add door to next level
        level.doors.push(new Door({
            x: width - 100,
            y: height / 2 - 50,
            locked: true
        }));
        
        // Set enemy spawn areas
        level.spawnAreas.push({
            x: width - 200,
            y: 50,
            width: 150,
            height: 150
        });
        
        level.spawnAreas.push({
            x: 50,
            y: 50,
            width: 150,
            height: 150
        });
        
        level.spawnAreas.push({
            x: width / 2 - 75,
            y: height - 200,
            width: 150,
            height: 150
        });
        
        level.background = '#111122'; // Slightly different background
        level.nextLevelId = 3;
        return level;
    }
    
    static createLevel3(width, height) {
        const level = new Level(3, width, height);
        level.levelName = "Biochemistry Lab";
        level.levelDescription = "Neutralize biochemical compounds to destabilize the door";
        level.levelTheme = "biochemistry";
        
        // Create a more challenging layout
        // Central structure
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if ((i === 0 || i === 4) || (j === 0 || j === 4)) {
                    level.blocks.push(new Block({
                        x: width / 2 - 125 + i * 50,
                        y: height / 2 - 125 + j * 50,
                        type: 'solid',
                        color: '#444444'
                    }));
                }
            }
        }
        
        // Breakable blocks
        for (let i = 0; i < 3; i++) {
            level.blocks.push(new Block({
                x: 100 + i * 60,
                y: 100,
                type: 'breakable',
                health: 3
            }));
            
            level.blocks.push(new Block({
                x: width - 250 + i * 60,
                y: 100,
                type: 'breakable',
                health: 3
            }));
            
            level.blocks.push(new Block({
                x: 100 + i * 60,
                y: height - 150,
                type: 'breakable',
                health: 3
            }));
            
            level.blocks.push(new Block({
                x: width - 250 + i * 60,
                y: height - 150,
                type: 'breakable',
                health: 3
            }));
        }
        
        // Biochemistry blocks - moved to better visible positions and fixed type
        level.blocks.push(new Block({
            x: 150,
            y: 200,
            type: 'biochem',  // Correct type for biochem blocks
            color: '#FF00FF', // Bright magenta color for better visibility
            health: 2,
            width: 60,  // Slightly larger
            height: 60  // Slightly larger
        }));
        
        level.blocks.push(new Block({
            x: width - 200,
            y: 200,
            type: 'biochem',  // Correct type for biochem blocks
            color: '#FF00FF', // Bright magenta color
            health: 2,
            width: 60,
            height: 60
        }));
        
        level.blocks.push(new Block({
            x: width / 2 - 30,
            y: height - 200,
            type: 'biochem',  // Correct type for biochem blocks
            color: '#FF00FF', // Bright magenta color
            health: 2,
            width: 60,
            height: 60
        }));
        
        // Add power-ups
        level.powerUps.push(new PowerUpBlock({
            x: 130,
            y: 300,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: width - 150,
            y: 300,
            powerUpType: 'health'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: 130,
            y: height - 230,
            powerUpType: 'health'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: width - 150,
            y: height - 230,
            powerUpType: 'key'
        }));
        
        // Final door
        level.doors.push(new Door({
            x: width / 2 - 30,
            y: height / 2 - 100,
            locked: true
        }));
        
        // Set enemy spawn areas
        level.spawnAreas.push({
            x: 50,
            y: 50,
            width: 100,
            height: 100
        });
        
        level.spawnAreas.push({
            x: width - 150,
            y: 50,
            width: 100,
            height: 100
        });
        
        level.spawnAreas.push({
            x: 50,
            y: height - 150,
            width: 100,
            height: 100
        });
        
        level.spawnAreas.push({
            x: width - 150,
            y: height - 150,
            width: 100,
            height: 100
        });
        
        level.background = '#111133'; // Even darker background
        level.nextLevelId = 4; // Now goes to level 4 instead of ending
        return level;
    }
    
    static createLevel4(width, height) {
        const level = new Level(4, width, height);
        level.levelName = "Bird Sanctuary";
        level.levelDescription = "Free the caged birds!";
        level.levelTheme = "birds";
        level.birdTarget = 5;
        
        // Create sanctuary environment
        level.background = '#071F44'; // Night blue background
        
        // Add blocks for environment
        for (let i = 0; i < 8; i++) {
            level.blocks.push(new Block({
                x: 100 + i * 80,
                y: 100,
                type: 'solid',
                color: '#4A7856', // Forest green
                width: 70,
                height: 30
            }));
            
            level.blocks.push(new Block({
                x: 80 + i * 90,
                y: height - 100,
                type: 'solid',
                color: '#4A7856', // Forest green
                width: 70,
                height: 30
            }));
        }
        
        // Add trees (tall blocks)
        for (let i = 0; i < 3; i++) {
            level.blocks.push(new Block({
                x: 50 + i * 300,
                y: height - 180,
                type: 'solid',
                color: '#8B4513', // Brown
                width: 20,
                height: 100
            }));
        }
        
        // Add some breakable blocks
        for (let i = 0; i < 5; i++) {
            level.blocks.push(new Block({
                x: 150 + i * 120,
                y: 200,
                type: 'breakable',
                color: '#CD853F', // Peru/wood color
                health: 2
            }));
        }
        
        // Add caged birds to rescue
        const birdColors = ['#4FC3F7', '#81D4FA', '#29B6F6', '#03A9F4', '#039BE5'];
        const positions = [
            {x: 150, y: 150}, 
            {x: 300, y: 230}, 
            {x: 500, y: 150}, 
            {x: 650, y: 230}, 
            {x: width/2, y: height - 150}
        ];
        
        for (let i = 0; i < level.birdTarget; i++) {
            const bird = new Bird({
                x: positions[i].x,
                y: positions[i].y,
                color: birdColors[i],
                birdType: 'small'
            });
            level.birds.push(bird);
        }
        
        // Add power-ups
        level.powerUps.push(new PowerUpBlock({
            x: 150,
            y: height - 250,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: width - 150,
            y: height - 250,
            powerUpType: 'health'
        }));
        
        // Add door to next level (initially locked)
        level.doors.push(new Door({
            x: width - 100,
            y: height / 2 - 50,
            locked: true
        }));
        
        // Set enemy spawn areas
        level.spawnAreas.push({
            x: width - 200,
            y: 50,
            width: 100,
            height: 100
        });
        
        level.spawnAreas.push({
            x: 50,
            y: height - 150,
            width: 100,
            height: 100
        });
        
        level.nextLevelId = 5;
        return level;
    }
    
    static createLevel5(width, height) {
        const level = new Level(5, width, height);
        level.levelName = "Runaway Train";
        level.levelDescription = "Avoid the trains, collect the control keys and make it to the engine room!";
        level.levelTheme = "train";
        level.mazeKeyTarget = 3; // We'll reuse this mechanic for train control keys
        
        // Set custom player start position to avoid immediate collision with trains
        level.playerStartPosition = { x: 50, y: 150 };
        
        // Create train layout
        level.background = '#111122'; // Dark blue/gray for train interior
        
        // Train outline - exterior walls
        // Top and bottom (train roof and floor)
        for (let i = 0; i < width; i += 50) {
            // Roof (with occasional lights)
            level.blocks.push(new Block({
                x: i,
                y: 0,
                type: 'solid',
                color: i % 200 === 0 ? '#FFFF00' : '#333333' // Yellow lights along ceiling
            }));
            
            // Floor
            level.blocks.push(new Block({
                x: i,
                y: height - 50,
                type: 'solid',
                color: '#444444' // Dark gray floor
            }));
        }
        
        // Create train car walls and separators
        const numCars = 4;
        const carWidth = width / numCars;
        
        // Car separators (walls between train cars with doors)
        for (let i = 1; i < numCars; i++) {
            const separatorX = i * carWidth;
            
            // Create wall with door opening in the middle
            for (let j = 50; j < height - 100; j += 50) {
                // Skip the middle section to create a door
                if (Math.abs(j - height / 2) > 50) {
                    level.blocks.push(new Block({
                        x: separatorX - 25,
                        y: j,
                        type: 'solid',
                        color: '#555555', // Train car separator color
                        width: 50,
                        height: 50
                    }));
                }
            }
        }
        
        // Windows along the sides of the train
        for (let i = 0; i < numCars; i++) {
            const carStartX = i * carWidth;
            
            // Windows on both sides
            for (let j = 100; j < carWidth - 100; j += 150) {
                // Left side windows
                level.blocks.push(new Block({
                    x: carStartX + j,
                    y: 50,
                    type: 'solid',
                    color: '#6495ED', // Window color (light blue)
                    width: 80,
                    height: 30
                }));
                
                // Right side windows (unless it's the exit door location)
                if (!(i === numCars - 1 && j > carWidth - 250)) {
                    level.blocks.push(new Block({
                        x: carStartX + j,
                        y: height - 80,
                        type: 'solid',
                        color: '#6495ED', // Window color
                        width: 80,
                        height: 30
                    }));
                }
            }
        }
        
        // Add seats and obstacles in each car
        for (let i = 0; i < numCars; i++) {
            const carStartX = i * carWidth + 50;
            const carEndX = (i + 1) * carWidth - 50;
            
            // Different layout for each car
            if (i === 0) { // First car: passenger seating
                for (let j = 0; j < 3; j++) {
                    // Rows of seats
                    level.blocks.push(new Block({
                        x: carStartX + 50 + j * 120,
                        y: 120,
                        type: 'solid',
                        color: '#8B4513', // Brown seats
                        width: 80,
                        height: 40
                    }));
                    
                    level.blocks.push(new Block({
                        x: carStartX + 50 + j * 120,
                        y: height - 160,
                        type: 'solid',
                        color: '#8B4513', // Brown seats
                        width: 80,
                        height: 40
                    }));
                }
            } 
            else if (i === 1) { // Second car: dining car with tables
                for (let j = 0; j < 2; j++) {
                    // Tables
                    level.blocks.push(new Block({
                        x: carStartX + 75 + j * 150,
                        y: height / 2 - 40,
                        type: 'solid',
                        color: '#DEB887', // Light brown tables
                        width: 100,
                        height: 80
                    }));
                }
            }
            else if (i === 2) { // Third car: storage with crates
                for (let j = 0; j < 8; j++) {
                    // Random crates
                    const crateSize = 30 + Math.floor(Math.random() * 30);
                    level.blocks.push(new Block({
                        x: carStartX + 30 + Math.floor(Math.random() * (carWidth - 120)),
                        y: 100 + Math.floor(Math.random() * (height - 250)),
                        type: 'breakable',
                        color: '#A0522D', // Brown crates
                        width: crateSize,
                        height: crateSize,
                        health: 2
                    }));
                }
            }
            else if (i === 3) { // Fourth car: engine room
                // Control panels
                level.blocks.push(new Block({
                    x: carEndX - 150,
                    y: 100,
                    type: 'solid',
                    color: '#696969', // Control panel
                    width: 100,
                    height: 60
                }));
                
                // Engine machinery
                for (let j = 0; j < 3; j++) {
                    level.blocks.push(new Block({
                        x: carStartX + 50 + j * 70,
                        y: height / 2 - 30,
                        type: 'solid',
                        color: '#A9A9A9', // Engine machinery
                        width: 60,
                        height: 60
                    }));
                }
                
                // Place exit door in engine room
                level.doors.push(new Door({
                    x: carEndX - 80,
                    y: height - 150,
                    locked: true,
                    color: '#FF0000' // Red door for engine room exit
                }));
            }
        }
        
        // Add control keys hidden throughout the train
        // Key 1 - in first car
        level.powerUps.push(new PowerUpBlock({
            x: 75,
            y: 200,
            powerUpType: 'key'
        }));
        
        // Key 2 - in dining car
        level.powerUps.push(new PowerUpBlock({
            x: width / 2 - 50,
            y: 100,
            powerUpType: 'key'
        }));
        
        // Key 3 - in storage car
        level.powerUps.push(new PowerUpBlock({
            x: width * 0.7,
            y: height - 150,
            powerUpType: 'key'
        }));
        
        // Add health and weapon powerups
        level.powerUps.push(new PowerUpBlock({
            x: 120,
            y: height - 150,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: width * 0.6,
            y: 100,
            powerUpType: 'health'
        }));
        
        // Set enemy spawn areas - one in each car
        for (let i = 0; i < numCars; i++) {
            const carCenterX = i * carWidth + carWidth / 2;
            level.spawnAreas.push({
                x: carCenterX - 40,
                y: height / 2 - 40,
                width: 80,
                height: 80
            });
        }
        
        // ADD MOVING TRAINS
        // These trains will move around the perimeter and through the center of the level
        
        // Train moving horizontally across the top
        level.trains.push(new MovingTrain({
            x: 0,
            y: 90,
            width: 120,
            height: 30,
            speed: 3,
            path: 'horizontal',
            trainType: 'passenger',
            boundaryLeft: 0,
            boundaryRight: width,
            damage: 40
        }));
        
        // Train moving horizontally across the bottom
        level.trains.push(new MovingTrain({
            x: width - 150,
            y: height - 100,
            width: 150,
            height: 30,
            speed: 4,
            path: 'horizontal',
            trainType: 'freight',
            boundaryLeft: 0,
            boundaryRight: width,
            damage: 50,
            direction: -1 // Start moving left
        }));
        
        // Train moving vertically on the left side
        level.trains.push(new MovingTrain({
            x: 80,
            y: 100,
            width: 30,
            height: 100,
            speed: 3.5,
            path: 'vertical',
            trainType: 'freight',
            boundaryTop: 80,
            boundaryBottom: height - 100,
            damage: 45
        }));
        
        // Train moving vertically on the right side
        level.trains.push(new MovingTrain({
            x: width - 150,
            y: height - 200,
            width: 30,
            height: 90,
            speed: 2.5,
            path: 'vertical',
            trainType: 'passenger',
            boundaryTop: 80,
            boundaryBottom: height - 100,
            damage: 40,
            direction: -1 // Start moving up
        }));
        
        // Create an engine train that moves through the center - MOVED DOWN to avoid initial collision
        level.trains.push(new MovingTrain({
            x: width / 2, // Start in the middle instead of the left edge
            y: height / 2 + 100, // Move down away from player start position
            width: 140,
            height: 50,
            speed: 3.5, // Reduced speed
            path: 'horizontal',
            trainType: 'engine',
            boundaryLeft: 0,
            boundaryRight: width,
            damage: 50 // Reduced damage
        }));
        
        // Create another freight train that moves diagonally using custom path
        level.trains.push(new MovingTrain({
            x: width / 4,
            y: height / 4,
            width: 100,
            height: 30,
            speed: 2.5, // Reduced speed
            path: 'custom',
            trainType: 'freight',
            pathPoints: [
                { x: width / 4, y: height / 4 },
                { x: 3 * width / 4, y: height / 4 },
                { x: 3 * width / 4, y: 3 * height / 4 },
                { x: width / 4, y: 3 * height / 4 }
            ],
            damage: 40 // Reduced damage
        }));
        
        // Update UI for train theme
        level.drawLevelUI = function(ctx) {
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            
            // Show level name
            ctx.fillText(`Level ${this.id}: ${this.levelName}`, 20, 150);
            
            // Show train-specific indicators
            ctx.fillText(`Control Keys Found: ${this.mazeKeysCollected}/${this.mazeKeyTarget}`, 20, 180);
            
            // Show train speed indicator
            ctx.fillStyle = '#FF5555'; // Warning color
            ctx.fillText("WARNING: Avoid moving trains!", width - 250, 150);
        };
        
        // Make this the final level by setting nextLevelId to null
        level.nextLevelId = null;
        return level;
    }
    
    static createLevel6(width, height) {
        const level = new Level(6, width, height);
        level.levelName = "Racing Against Time";
        level.levelDescription = "Reach the exit before time runs out!";
        level.levelTheme = "timed";
        level.timedLevel = true;
        level.timeLimit = 45000; // 45 seconds
        level.timeRemaining = 45000;
        
        // Create time trial layout
        level.background = '#330000'; // Dark red background
        
        // Create obstacles
        const obstacleRows = 5;
        const obstaclesPerRow = 6;
        
        for (let row = 0; row < obstacleRows; row++) {
            for (let col = 0; col < obstaclesPerRow; col++) {
                if ((row + col) % 2 === 0) { // Checkerboard pattern
                    level.blocks.push(new Block({
                        x: 100 + col * 100,
                        y: 100 + row * 80,
                        type: 'solid',
                        color: '#880000', // Dark red
                        width: 60,
                        height: 60
                    }));
                }
            }
        }
        
        // Add power-ups
        level.powerUps.push(new PowerUpBlock({
            x: 150,
            y: 150,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: width - 150,
            y: height - 150,
            powerUpType: 'health'
        }));
        
        // Add key
        level.powerUps.push(new PowerUpBlock({
            x: width / 2,
            y: height / 2,
            powerUpType: 'key'
        }));
        
        // Add exit door
        level.doors.push(new Door({
            x: width - 100,
            y: height / 2,
            locked: true
        }));
        
        // Set enemy spawn areas - fewer enemies in timed level
        level.spawnAreas.push({
            x: width - 200,
            y: 50,
            width: 100,
            height: 100
        });
        
        level.nextLevelId = 7;
        return level;
    }
    
    static createLevel7(width, height) {
        const level = new Level(7, width, height);
        level.levelName = "Laser Field";
        level.levelDescription = "Navigate through lasers to reach the exit";
        level.levelTheme = "lasers";
        
        level.background = '#000033'; // Dark blue background
        
        // Create laser barriers (aligned blocks)
        for (let i = 0; i < 7; i++) {
            // Horizontal lasers
            for (let j = 0; j < 10; j++) {
                if (j % 3 !== 0) { // Leave some gaps
                    level.blocks.push(new Block({
                        x: 50 + j * 70,
                        y: 100 + i * 70,
                        type: i % 2 === 0 ? 'breakable' : 'solid',
                        color: '#00FFFF', // Cyan for lasers
                        width: 60,
                        height: 10
                    }));
                }
            }
            
            // Vertical lasers
            for (let j = 0; j < 6; j++) {
                if ((i + j) % 3 !== 0) { // Different pattern of gaps
                    level.blocks.push(new Block({
                        x: 100 + i * 100,
                        y: 50 + j * 80,
                        type: j % 2 === 0 ? 'breakable' : 'solid',
                        color: '#FF00FF', // Magenta for lasers
                        width: 10,
                        height: 60
                    }));
                }
            }
        }
        
        // Add power-ups
        level.powerUps.push(new PowerUpBlock({
            x: 100,
            y: 400,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: width - 150,
            y: 150,
            powerUpType: 'health'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: 600,
            y: 400,
            powerUpType: 'key'
        }));
        
        // Add exit door
        level.doors.push(new Door({
            x: width - 100,
            y: height - 150,
            locked: true
        }));
        
        // Set enemy spawn areas
        level.spawnAreas.push({
            x: width / 2 - 50,
            y: height / 2 - 50,
            width: 100,
            height: 100
        });
        
        level.nextLevelId = 8;
        return level;
    }
    
    static createLevel8(width, height) {
        const level = new Level(8, width, height);
        level.levelName = "Fortress";
        level.levelDescription = "Break through the fortress walls";
        level.levelTheme = "fortress";
        
        level.background = '#333333'; // Dark gray background
        
        // Create fortress walls
        // Outer perimeter
        for (let i = 0; i < width; i += 50) {
            // Top and bottom walls
            if (Math.abs(i - width/2) > 100) { // Leave middle section open for entrance and exit
                level.blocks.push(new Block({
                    x: i,
                    y: 50,
                    type: 'solid',
                    color: '#696969', // Gray
                }));
                
                level.blocks.push(new Block({
                    x: i,
                    y: height - 100,
                    type: 'solid',
                    color: '#696969', // Gray
                }));
            }
        }
        
        for (let i = 50; i < height - 100; i += 50) {
            // Left and right walls
            level.blocks.push(new Block({
                x: 0,
                y: i,
                type: 'solid',
                color: '#696969', // Gray
            }));
            
            level.blocks.push(new Block({
                x: width - 50,
                y: i,
                type: 'solid',
                color: '#696969', // Gray
            }));
        }
        
        // Inner fortress walls (breakable)
        const innerWallX = width / 2 - 150;
        const innerWallWidth = 300;
        
        for (let i = innerWallX; i < innerWallX + innerWallWidth; i += 50) {
            for (let j = 150; j < height - 200; j += 50) {
                // Only add blocks at perimeter of inner fortress
                if (i === innerWallX || i === innerWallX + innerWallWidth - 50 || 
                    j === 150 || j === height - 250) {
                    level.blocks.push(new Block({
                        x: i,
                        y: j,
                        type: 'breakable',
                        color: '#8B4513', // Brown
                        health: 3
                    }));
                }
            }
        }
        
        // Add power-ups
        level.powerUps.push(new PowerUpBlock({
            x: 100,
            y: 150,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: width - 100,
            y: 150,
            powerUpType: 'health'
        }));
        
        // Add key inside fortress
        level.powerUps.push(new PowerUpBlock({
            x: width / 2,
            y: height / 2,
            powerUpType: 'key'
        }));
        
        // Add exit door
        level.doors.push(new Door({
            x: width / 2 - 30,
            y: height - 150,
            locked: true
        }));
        
        // Set enemy spawn areas
        level.spawnAreas.push({
            x: width / 2 - 50,
            y: height / 2 - 50,
            width: 100,
            height: 100
        });
        
        level.spawnAreas.push({
            x: 100,
            y: height - 200,
            width: 100,
            height: 100
        });
        
        level.spawnAreas.push({
            x: width - 200,
            y: height - 200,
            width: 100,
            height: 100
        });
        
        level.nextLevelId = 9;
        return level;
    }
    
    static createLevel9(width, height) {
        const level = new Level(9, width, height);
        level.levelName = "Rainbow Gardens";
        level.levelDescription = "A colorful but dangerous garden";
        level.levelTheme = "garden";
        
        level.background = '#005500'; // Dark green background
        
        // Create colorful garden blocks
        const colors = ['#FF5555', '#55FF55', '#5555FF', '#FFFF55', '#FF55FF', '#55FFFF'];
        
        // Create "flower beds" with colorful blocks
        for (let i = 0; i < 3; i++) {
            const centerX = 100 + i * 250;
            const centerY = height / 2;
            const color = colors[i % colors.length];
            
            // Create flower pattern
            for (let angle = 0; angle < 360; angle += 45) {
                const radian = angle * Math.PI / 180;
                const x = centerX + Math.cos(radian) * 80;
                const y = centerY + Math.sin(radian) * 80;
                
                level.blocks.push(new Block({
                    x: x,
                    y: y,
                    type: 'breakable',
                    color: color,
                    health: 2
                }));
            }
            
            // Add center block
            level.blocks.push(new Block({
                x: centerX - 25,
                y: centerY - 25,
                type: 'breakable',
                color: colors[(i + 3) % colors.length],
                health: 3,
                width: 50,
                height: 50
            }));
        }
        
        // Add garden path blocks (solid)
        for (let i = 0; i < width; i += 60) {
            level.blocks.push(new Block({
                x: i,
                y: 100,
                type: 'solid',
                color: '#8B4513', // Brown path
                width: 50,
                height: 20
            }));
            
            level.blocks.push(new Block({
                x: i,
                y: height - 120,
                type: 'solid',
                color: '#8B4513', // Brown path
                width: 50,
                height: 20
            }));
        }
        
        // Add power-ups
        level.powerUps.push(new PowerUpBlock({
            x: 100,
            y: 50,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: width - 100,
            y: 50,
            powerUpType: 'health'
        }));
        
        // Add keys
        level.powerUps.push(new PowerUpBlock({
            x: 225,
            y: height / 2,
            powerUpType: 'key'
        }));
        
        // Add exit door
        level.doors.push(new Door({
            x: width - 100,
            y: height - 175,
            locked: true
        }));
        
        // Set enemy spawn areas
        level.spawnAreas.push({
            x: 50,
            y: height - 200,
            width: 100,
            height: 80
        });
        
        level.spawnAreas.push({
            x: width - 150,
            y: height - 200,
            width: 100,
            height: 80
        });
        
        level.nextLevelId = 10;
        return level;
    }
    
    static createLevel10(width, height) {
        const level = new Level(10, width, height);
        level.levelName = "Space Station";
        level.levelDescription = "Navigate the space station modules";
        level.levelTheme = "space";
        
        level.background = '#000011'; // Near black with slight blue tint
        
        // Create space station modules (rooms)
        const modules = [
            {x: 50, y: 50, width: 200, height: 200},
            {x: 300, y: 50, width: 250, height: 150},
            {x: 600, y: 50, width: 150, height: 150},
            {x: 50, y: 300, width: 150, height: 250},
            {x: 250, y: 350, width: 300, height: 200},
            {x: 600, y: 300, width: 150, height: 200}
        ];
        
        for (const module of modules) {
            // Create module walls
            for (let x = module.x; x < module.x + module.width; x += 50) {
                for (let y = module.y; y < module.y + module.height; y += 50) {
                    // Only add blocks at the perimeter of the module
                    if (x === module.x || x === module.x + module.width - 50 || 
                        y === module.y || y === module.y + module.height - 50) {
                        level.blocks.push(new Block({
                            x: x,
                            y: y,
                            type: 'solid',
                            color: '#444444', // Gray
                        }));
                    }
                }
            }
        }
        
        // Create connecting tunnels between modules
        const tunnels = [
            {x1: 200, y1: 150, x2: 300, y2: 150, width: 50, height: 50},
            {x1: 550, y1: 100, x2: 600, y2: 100, width: 50, height: 50},
            {x1: 150, y1: 300, x2: 150, y2: 250, width: 50, height: 50},
            {x1: 350, y1: 350, x2: 350, y2: 200, width: 50, height: 100},
            {x1: 550, y1: 400, x2: 600, y2: 400, width: 50, height: 50}
        ];
        
        for (const tunnel of tunnels) {
            // Remove any blocks in the tunnel path to create openings
            level.blocks = level.blocks.filter(block => 
                !(block.x >= tunnel.x1 && block.x < tunnel.x1 + tunnel.width &&
                  block.y >= tunnel.y1 && block.y < tunnel.y1 + tunnel.height) &&
                !(block.x >= tunnel.x2 && block.x < tunnel.x2 + tunnel.width &&
                     block.y >= tunnel.y2 && block.y < tunnel.y2 + tunnel.height)
            );
        }
        
        // Add some space debris (breakable blocks) in random positions
        for (let i = 0; i < 10; i++) {
            const x = 100 + Math.random() * (width - 200);
            const y = 100 + Math.random() * (height - 200);
            
            // Don't place debris in tunnels or doorways
            let validPosition = true;
            for (const tunnel of tunnels) {
                if ((x >= tunnel.x1 && x < tunnel.x1 + tunnel.width && 
                     y >= tunnel.y1 && y < tunnel.y1 + tunnel.height) ||
                    (x >= tunnel.x2 && x < tunnel.x2 + tunnel.width &&
                     y >= tunnel.y2 && y < tunnel.y2 + tunnel.height)) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                level.blocks.push(new Block({
                    x: x,
                    y: y,
                    type: 'breakable',
                    color: '#8899AA', // Light blue-gray
                    health: 2
                }));
            }
        }
        
        // Add power-ups
        level.powerUps.push(new PowerUpBlock({
            x: 100,
            y: 100,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: 650,
            y: 100,
            powerUpType: 'health'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: 100,
            y: 400,
            powerUpType: 'health'
        }));
        
        // Add key in a difficult-to-reach module
        level.powerUps.push(new PowerUpBlock({
            x: 650,
            y: 400,
            powerUpType: 'key'
        }));
        
        // Add exit door
        level.doors.push(new Door({
            x: 400,
            y: 500,
            locked: true
        }));
        
        // Set enemy spawn areas
        level.spawnAreas.push({
            x: 100,
            y: 150,
            width: 80,
            height: 80
        });
        
        level.spawnAreas.push({
            x: 650,
            y: 350,
            width: 80,
            height: 80
        });
        
        level.nextLevelId = 11;
        return level;
    }
    
    static createLevel11(width, height) {
        const level = new Level(11, width, height);
        level.levelName = "Final Challenge";
        level.levelDescription = "Survive the final challenge!";
        level.levelTheme = "final";
        
        level.background = '#300030'; // Dark purple background
        
        // Create a central arena
        const arenaX = width / 2 - 200;
        const arenaY = height / 2 - 150;
        const arenaWidth = 400;
        const arenaHeight = 300;
        
        // Create arena walls
        for (let x = arenaX; x < arenaX + arenaWidth; x += 50) {
            for (let y = arenaY; y < arenaY + arenaHeight; y += 50) {
                // Only add blocks at the perimeter of the arena
                if (x === arenaX || x === arenaX + arenaWidth - 50 || 
                    y === arenaY || y === arenaY + arenaHeight - 50) {
                    // Leave openings at the corners
                    if (!((x === arenaX && y === arenaY) || 
                         (x === arenaX && y === arenaY + arenaHeight - 50) ||
                         (x === arenaX + arenaWidth - 50 && y === arenaY) ||
                         (x === arenaX + arenaWidth - 50 && y === arenaY + arenaHeight - 50))) {
                        level.blocks.push(new Block({
                            x: x,
                            y: y,
                            type: 'solid',
                            color: '#660066', // Purple
                        }));
                    }
                }
            }
        }
        
        // Add outer defensive structures
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2;
            const x = width / 2 + Math.cos(angle) * 300 - 50;
            const y = height / 2 + Math.sin(angle) * 200 - 50;
            
            // Create diamond-shaped defense
            for (let j = -2; j <= 2; j++) {
                for (let k = -2; k <= 2; k++) {
                    if (Math.abs(j) + Math.abs(k) <= 2) {
                        level.blocks.push(new Block({
                            x: x + j * 50,
                            y: y + k * 50,
                            type: 'breakable',
                            color: '#AA00AA', // Lighter purple
                            health: 3
                        }));
                    }
                }
            }
        }
        
        // Add all types of power-ups for the final challenge
        level.powerUps.push(new PowerUpBlock({
            x: 100,
            y: 100,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: width - 150,
            y: 100,
            powerUpType: 'weapon'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: 100,
            y: height - 150,
            powerUpType: 'health'
        }));
        
        level.powerUps.push(new PowerUpBlock({
            x: width - 150,
            y: height - 150,
            powerUpType: 'health'
        }));
        
        // Add key in center of arena
        level.powerUps.push(new PowerUpBlock({
            x: width / 2,
            y: height / 2,
            powerUpType: 'key'
        }));
        
        // Add final exit door
        level.doors.push(new Door({
            x: width / 2 - 30,
            y: arenaY - 100,
            locked: true,
            width: 60,
            height: 100
        }));
        
        // Set enemy spawn areas - more enemies for final level
        level.spawnAreas.push({
            x: 100,
            y: height / 2,
            width: 100,
            height: 100
        });
        
        level.spawnAreas.push({
            x: width - 200,
            y: height / 2,
            width: 100,
            height: 100
        });
        
        level.spawnAreas.push({
            x: width / 2,
            y: 100,
            width: 100,
            height: 100
        });
        
        level.spawnAreas.push({
            x: width / 2,
            y: height - 200,
            width: 100,
            height: 100
        });
        
        // This is the final level, so no next level
        level.nextLevelId = null;
        return level;
    }
    
    // Factory method to get a level by ID
    static getLevel(levelId, width, height) {
        switch(levelId) {
            case 1: return this.createLevel1(width, height);
            case 2: return this.createLevel2(width, height);
            case 3: return this.createLevel3(width, height);
            case 4: return this.createLevel4(width, height);
            case 5: return this.createLevel5(width, height);
            case 6: return this.createLevel6(width, height);
            case 7: return this.createLevel7(width, height);
            case 8: return this.createLevel8(width, height);
            case 9: return this.createLevel9(width, height);
            case 10: return this.createLevel10(width, height);
            case 11: return this.createLevel11(width, height);
            default: return this.createLevel1(width, height);
        }
    }
}