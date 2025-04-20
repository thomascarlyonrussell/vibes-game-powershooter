/**
 * Power Shooter Game - Enemies
 */

class Enemy extends Sprite {
    constructor({x, y, width, height, color, type, health, speed}) {
        super({x, y, width, height, color, type});
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.scoreValue = 10;
        this.target = null;
        this.xpValue = 15; // Base XP value
        this.coinValue = 5; // Base coin value
        this.coinDropChance = 0.3; // 30% chance to drop coins
        this.projectiles = [];
    }
    
    setTarget(target) {
        this.target = target;
    }
    
    update(deltaTime) {
        if (this.target) {
            this.moveTowardTarget();
        }
        
        // Update projectiles if enemy can shoot
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(deltaTime);
            
            if (!this.projectiles[i].active) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    moveTowardTarget() {
        if (!this.target) return;
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const velocityX = (dx / distance) * this.speed;
            const velocityY = (dy / distance) * this.speed;
            
            this.x += velocityX;
            this.y += velocityY;
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.active = false;
            return true; // Enemy was killed
        }
        
        return false; // Enemy still alive
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw health bar
        const healthBarWidth = 30;
        const healthBarHeight = 4;
        const xPos = this.x - healthBarWidth / 2 + this.width / 2;
        const yPos = this.y - 10;
        
        // Health background
        ctx.fillStyle = '#333333';
        ctx.fillRect(xPos, yPos, healthBarWidth, healthBarHeight);
        
        // Health fill
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(xPos, yPos, healthBarWidth * healthPercent, healthBarHeight);
        
        // Draw enemy projectiles
        for (const projectile of this.projectiles) {
            projectile.draw(ctx);
        }
    }
}

class BasicEnemy extends Enemy {
    constructor({x, y}) {
        super({
            x, 
            y, 
            width: 30, 
            height: 30, 
            color: '#e74c3c', 
            type: 'basic-enemy', 
            health: 30, 
            speed: 1.5
        });
        this.scoreValue = 10;
        this.xpValue = 10;
        this.coinValue = 3;
    }
}

class FastEnemy extends Enemy {
    constructor({x, y}) {
        super({
            x, 
            y, 
            width: 20, 
            height: 20, 
            color: '#f39c12', 
            type: 'fast-enemy', 
            health: 15, 
            speed: 3
        });
        this.scoreValue = 15;
        this.xpValue = 8;
        this.coinValue = 2;
    }
}

class TankEnemy extends Enemy {
    constructor({x, y}) {
        super({
            x, 
            y, 
            width: 40, 
            height: 40, 
            color: '#8e44ad', 
            type: 'tank-enemy', 
            health: 80, 
            speed: 0.8
        });
        this.scoreValue = 30;
        this.xpValue = 25;
        this.coinValue = 7;
        this.coinDropChance = 0.5; // Higher chance to drop coins
    }
}

class ShooterEnemy extends Enemy {
    constructor({x, y}) {
        super({
            x, 
            y, 
            width: 25, 
            height: 25, 
            color: '#2ecc71', 
            type: 'shooter-enemy', 
            health: 40, 
            speed: 1
        });
        this.scoreValue = 20;
        this.xpValue = 15;
        this.coinValue = 5;
        this.shootCooldown = 0;
        this.shootDelay = 2000; // ms between shots
        this.shootRange = 300;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        super.update(deltaTime);
        
        // Shooting logic
        if (this.target && this.shootCooldown <= 0) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.shootRange) {
                this.shoot();
                this.shootCooldown = this.shootDelay;
            }
        }
        
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
    }
    
    shoot() {
        if (!this.target) return;
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        const projectile = new EnemyProjectile({
            x: this.x,
            y: this.y,
            angle: angle,
            speed: 5,
            damage: 10
        });
        
        this.projectiles.push(projectile);
    }
}

class BossEnemy extends Enemy {
    constructor({x, y}) {
        super({
            x, 
            y, 
            width: 60, 
            height: 60, 
            color: '#e74c3c', 
            type: 'boss-enemy', 
            health: 300, 
            speed: 0.5
        });
        this.scoreValue = 100;
        this.xpValue = 100; // Big XP reward for boss
        this.coinValue = 25; // Big coin reward
        this.coinDropChance = 1.0; // Always drop coins
        
        this.attackPattern = 'chase';
        this.attackTimer = 0;
        this.attackCooldown = 3000;
        this.shotCount = 0;
        this.phase = 1;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Phase transitions
        if (this.health <= this.maxHealth * 0.6 && this.phase === 1) {
            this.phase = 2;
            this.speed = 0.8;
            this.color = '#c0392b';
        } else if (this.health <= this.maxHealth * 0.3 && this.phase === 2) {
            this.phase = 3;
            this.speed = 1.2;
            this.color = '#7f0000';
            this.attackCooldown = 2000;
        }
        
        // Attack pattern update
        this.attackTimer += deltaTime;
        if (this.attackTimer >= this.attackCooldown) {
            this.pickAttackPattern();
            this.attackTimer = 0;
        }
        
        if (this.attackPattern === 'chase' && this.target) {
            this.moveTowardTarget();
        } else if (this.attackPattern === 'shoot' && this.shotCount < 3) {
            this.shootAtPlayer();
            this.shotCount++;
            
            if (this.shotCount >= 3) {
                this.attackPattern = 'chase';
                this.shotCount = 0;
            }
        }
        
        // Update projectiles
        super.update(deltaTime);
    }
    
    pickAttackPattern() {
        // Pick a random attack pattern
        const patterns = ['chase', 'shoot'];
        this.attackPattern = patterns[Math.floor(Math.random() * patterns.length)];
        this.shotCount = 0;
        
        // Phase 3: Add additional attacks
        if (this.phase >= 3) {
            this.attackPattern = Math.random() < 0.7 ? 'shoot' : 'chase';
        }
    }
    
    shootAtPlayer() {
        if (!this.target) return;
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        // Phase 1: Single shot
        if (this.phase === 1) {
            this.fireProjectile(angle, 6, 15);
        }
        // Phase 2: Triple shot
        else if (this.phase === 2) {
            this.fireProjectile(angle, 6, 15);
            this.fireProjectile(angle + 0.2, 6, 15);
            this.fireProjectile(angle - 0.2, 6, 15);
        }
        // Phase 3: Spread shot
        else {
            for (let i = -2; i <= 2; i++) {
                this.fireProjectile(angle + (i * 0.15), 7, 20);
            }
        }
    }
    
    fireProjectile(angle, speed, damage) {
        const projectile = new EnemyProjectile({
            x: this.x,
            y: this.y,
            angle: angle,
            speed: speed,
            damage: damage,
            color: this.phase === 3 ? '#ff0000' : '#e74c3c'
        });
        
        this.projectiles.push(projectile);
    }
    
    draw(ctx) {
        // Draw enemy body
        super.draw(ctx);
        
        // Draw boss specific details based on phase
        ctx.fillStyle = '#ffffff';
        
        // Eyes
        const eyeRadius = this.width / 10;
        const eyeOffsetX = this.width / 4;
        const eyeOffsetY = this.height / 4;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(this.x - eyeOffsetX, this.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(this.x + eyeOffsetX, this.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth - different based on phase
        ctx.beginPath();
        if (this.phase === 1) {
            // Neutral mouth
            ctx.moveTo(this.x - eyeOffsetX, this.y + eyeOffsetY);
            ctx.lineTo(this.x + eyeOffsetX, this.y + eyeOffsetY);
        } else if (this.phase === 2) {
            // Angry mouth (V shape)
            ctx.moveTo(this.x - eyeOffsetX, this.y + eyeOffsetY);
            ctx.lineTo(this.x, this.y + eyeOffsetY * 1.5);
            ctx.lineTo(this.x + eyeOffsetX, this.y + eyeOffsetY);
        } else {
            // Furious mouth (open)
            ctx.arc(this.x, this.y + eyeOffsetY, this.width / 5, 0, Math.PI);
            ctx.fillStyle = '#000000';
            ctx.fill();
            return;
        }
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class EnemyProjectile extends Sprite {
    constructor({x, y, angle, speed, damage, color = '#e74c3c'}) {
        super({
            x, 
            y, 
            width: 8, 
            height: 8, 
            color: color, 
            type: 'enemy-projectile'
        });
        
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.range = 600;
        this.distanceTraveled = 0;
    }
    
    update(deltaTime) {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        this.distanceTraveled += this.speed;
        
        if (this.distanceTraveled > this.range || 
            this.x < 0 || this.x > 800 || 
            this.y < 0 || this.y > 600) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

class EnemySpawner {
    constructor(spawnAreas, maxEnemies) {
        this.spawnAreas = spawnAreas;
        this.maxEnemies = maxEnemies;
        this.enemies = [];
        this.nextSpawnTime = 0;
        this.spawnDelay = 3000;
        this.difficultyLevel = 1;
        this.isActive = false;
        this.bossSpawned = false;
    }
    
    startSpawning() {
        this.isActive = true;
        this.nextSpawnTime = Date.now() + this.spawnDelay;
    }
    
    stopSpawning() {
        this.isActive = false;
    }
    
    clearEnemies() {
        // Clear all enemies when transitioning between levels
        console.log(`Clearing ${this.enemies.length} enemies from the level`);
        this.enemies = [];
        this.bossSpawned = false;
    }
    
    update(deltaTime, player) {
        // Update all active enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.setTarget(player);
            enemy.update(deltaTime);
            
            // Remove inactive enemies
            if (!enemy.active) {
                this.enemies.splice(i, 1);
            } 
            // Check for collision with player
            else if (player && enemy.collidesWith(player)) {
                player.takeDamage(10);
                enemy.takeDamage(10); // Enemy takes damage from collision too
            }
        }
        
        // Check for enemy projectile collisions with player
        if (player) {
            for (const enemy of this.enemies) {
                for (let i = enemy.projectiles.length - 1; i >= 0; i--) {
                    const projectile = enemy.projectiles[i];
                    if (projectile.collidesWith(player)) {
                        player.takeDamage(projectile.damage);
                        projectile.active = false;
                        enemy.projectiles.splice(i, 1);
                    }
                }
            }
        }
        
        // Spawn new enemies if needed
        if (this.isActive && Date.now() >= this.nextSpawnTime && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy();
            
            // Adjust next spawn time
            this.nextSpawnTime = Date.now() + this.spawnDelay / Math.sqrt(this.difficultyLevel);
        }
    }
    
    spawnEnemy() {
        // Get a random spawn area
        if (this.spawnAreas.length === 0) return;
        
        const spawnIdx = Math.floor(Math.random() * this.spawnAreas.length);
        const spawnArea = this.spawnAreas[spawnIdx];
        
        // Random position within spawn area
        const x = spawnArea.x + Math.random() * spawnArea.width;
        const y = spawnArea.y + Math.random() * spawnArea.height;
        
        // Enemy type based on difficulty level
        let enemy;
        
        // Check if it's time to spawn a boss
        if (this.difficultyLevel >= 4 && !this.bossSpawned && this.enemies.length < 3) {
            enemy = new BossEnemy({x, y});
            this.bossSpawned = true;
        } else {
            // Normal enemy spawning
            const enemyTypes = this.getAvailableEnemyTypes();
            const typeIndex = Math.floor(Math.random() * enemyTypes.length);
            
            switch(enemyTypes[typeIndex]) {
                case 'basic':
                    enemy = new BasicEnemy({x, y});
                    break;
                case 'fast':
                    enemy = new FastEnemy({x, y});
                    break;
                case 'tank':
                    enemy = new TankEnemy({x, y});
                    break;
                case 'shooter':
                    enemy = new ShooterEnemy({x, y});
                    break;
                default:
                    enemy = new BasicEnemy({x, y});
            }
        }
        
        this.enemies.push(enemy);
    }
    
    getAvailableEnemyTypes() {
        const availableTypes = ['basic'];
        
        // Add more enemy types based on difficulty
        if (this.difficultyLevel >= 2) availableTypes.push('fast');
        if (this.difficultyLevel >= 3) availableTypes.push('shooter');
        if (this.difficultyLevel >= 4) availableTypes.push('tank');
        
        return availableTypes;
    }
    
    draw(ctx) {
        // Draw all enemies
        for (const enemy of this.enemies) {
            enemy.draw(ctx);
        }
    }
}

function SpawnArea(x, y, width, height) {
    return {
        x,
        y,
        width,
        height
    };
}