/**
 * Power Shooter Game - Player Class
 */

class Player extends Sprite {
    constructor({x, y}) {
        super({
            x, 
            y, 
            width: 40, 
            height: 40, 
            color: '#3498db', 
            type: 'player',
            pattern: 'player'
        });
        
        this.speed = 5;
        this.health = 100;
        this.maxHealth = 100;
        this.weaponLevel = 1;
        this.shootCooldown = 0;
        this.shootDelay = 300; // ms between shots
        this.projectiles = [];
        this.lastShootTime = 0;
        this.score = 0;
        this.keys = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;

        // XP system
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;

        // Currency system
        this.coins = 0;

        // Upgradeable stats
        this.damageMultiplier = 1.0;
        this.healthRegenRate = 0; // Health regen per second
        this.lastRegenTime = 0;
        this.moveSpeedBonus = 0;
    }
    
    update(deltaTime, input, boundaries) {
        // Handle movement with keyboard
        if (input.isKeyDown('w') || input.isKeyDown('ArrowUp')) {
            this.y -= this.speed;
        }
        if (input.isKeyDown('s') || input.isKeyDown('ArrowDown')) {
            this.y += this.speed;
        }
        if (input.isKeyDown('a') || input.isKeyDown('ArrowLeft')) {
            this.x -= this.speed;
        }
        if (input.isKeyDown('d') || input.isKeyDown('ArrowRight')) {
            this.x += this.speed;
        }
        
        // Boundary checking
        if (boundaries) {
            if (this.x < boundaries.left) this.x = boundaries.left;
            if (this.x + this.width > boundaries.right) this.x = boundaries.right - this.width;
            if (this.y < boundaries.top) this.y = boundaries.top;
            if (this.y + this.height > boundaries.bottom) this.y = boundaries.bottom - this.height;
        }
        
        // Handle shooting
        const now = Date.now();
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        if (input.isMouseDown() && this.shootCooldown <= 0) {
            this.shoot(input.getMousePosition());
            this.shootCooldown = this.shootDelay;
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(deltaTime);
            
            // Remove projectiles that are out of bounds
            if (!this.projectiles[i].active) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Invulnerability timer
        if (this.invulnerable) {
            this.invulnerableTimer -= deltaTime;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }

        // Health regeneration
        if (this.healthRegenRate > 0 && Date.now() - this.lastRegenTime >= 1000) {
            this.health = Math.min(this.maxHealth, this.health + this.healthRegenRate);
            this.lastRegenTime = Date.now();
        }
    }
    
    draw(ctx) {
        // Flash when invulnerable
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            return;
        }
        
        super.draw(ctx);
        
        // Draw health bar
        const healthBarWidth = 50;
        const healthBarHeight = 5;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 5, this.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 5, this.y - 10, healthBarWidth * (this.health / this.maxHealth), healthBarHeight);
        
        // Draw all projectiles
        for (const projectile of this.projectiles) {
            projectile.draw(ctx);
        }
    }
    
    shoot(targetPos) {
        // Calculate direction to mouse cursor
        const dx = targetPos.x - (this.x + this.width / 2);
        const dy = targetPos.y - (this.y + this.height / 2);
        const angle = Math.atan2(dy, dx);
        
        // Create projectile(s) based on weapon level
        if (this.weaponLevel === 1) {
            // Basic single shot
            this.createProjectile(angle, 10);
        } else if (this.weaponLevel === 2) {
            // Double shot
            this.createProjectile(angle, 10);
            this.createProjectile(angle + 0.2, 10);
        } else {
            // Triple shot with more damage
            this.createProjectile(angle, 15);
            this.createProjectile(angle + 0.2, 15);
            this.createProjectile(angle - 0.2, 15);
        }
    }
    
    createProjectile(angle, damage) {
        const projectile = new Projectile({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            angle: angle,
            speed: 10,
            damage: damage,
            color: this.weaponLevel === 1 ? '#00ff00' : 
                  this.weaponLevel === 2 ? '#00ffff' : '#ff00ff'
        });
        
        this.projectiles.push(projectile);
    }
    
    takeDamage(amount) {
        if (this.invulnerable) return;
        
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
        }
        
        // Add invulnerability after taking damage
        this.invulnerable = true;
        this.invulnerableTimer = 1000; // 1 second of invulnerability
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    upgradeWeapon() {
        if (this.weaponLevel < 3) {
            this.weaponLevel++;
            return true;
        }
        return false;
    }
    
    addKey() {
        this.keys++;
    }
    
    useKey() {
        if (this.keys > 0) {
            this.keys--;
            return true;
        }
        return false;
    }
    
    addScore(points) {
        this.score += points;
    }

    addXP(amount) {
        this.xp += amount;
        
        // Check for level up
        while (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        
        // Scale XP requirements for next level
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
        
        // Increase stats
        this.maxHealth += 10;
        this.health = this.maxHealth; // Full heal on level up
        this.damageMultiplier += 0.1;
        
        // Return true to indicate a level up occurred
        return true;
    }
    
    addCoins(amount) {
        this.coins += amount;
    }
    
    spendCoins(amount) {
        if (this.coins >= amount) {
            this.coins -= amount;
            return true;
        }
        return false;
    }
    
    purchaseHealthUpgrade() {
        const cost = 50;
        if (this.spendCoins(cost)) {
            this.maxHealth += 25;
            this.health += 25;
            return true;
        }
        return false;
    }
    
    purchaseDamageUpgrade() {
        const cost = 75;
        if (this.spendCoins(cost)) {
            this.damageMultiplier += 0.25;
            return true;
        }
        return false;
    }
    
    purchaseFireRateUpgrade() {
        const cost = 60;
        if (this.spendCoins(cost)) {
            this.shootDelay = Math.max(100, this.shootDelay - 50);
            return true;
        }
        return false;
    }
    
    purchaseHealthRegenUpgrade() {
        const cost = 80;
        if (this.spendCoins(cost)) {
            this.healthRegenRate += 5;
            return true;
        }
        return false;
    }
    
    purchaseSpeedUpgrade() {
        const cost = 70;
        if (this.spendCoins(cost)) {
            this.moveSpeedBonus += 1;
            return true;
        }
        return false;
    }
}

class Projectile extends Sprite {
    constructor({x, y, angle, speed, damage, color}) {
        super({
            x, y, 
            width: 10, 
            height: 10, 
            color: color, 
            type: 'projectile'
        });
        
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.range = 800; // How far the projectile can travel
        this.distanceTraveled = 0;
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
    }
    
    update(deltaTime) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        this.distanceTraveled += this.speed;
        if (this.distanceTraveled > this.range) {
            this.active = false;
        }
        
        // Deactivate if offscreen
        if (this.x < 0 || this.x > 800 || 
            this.y < 0 || this.y > 600) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        // Draw projectile as a small circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}