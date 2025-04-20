/**
 * Power Shooter Game - Blocks
 */

class Block extends Sprite {
    constructor({x, y, width = 50, height = 50, color, type, breakable = false, health = 1}) {
        // Determine pattern based on block type
        let pattern = null;
        if (type === 'biochem') {
            pattern = 'biochem';
            breakable = true; // Ensure biochem blocks are breakable
        } else if (type === 'solid') {
            pattern = 'block';
        }
        
        super({x, y, width, height, color, type, pattern});
        this.breakable = breakable;
        this.health = health;
        this.maxHealth = health;
        this.destructionScore = type === 'biochem' ? 25 : 10; // Higher score for biochem blocks
    }
    
    takeDamage(damage) {
        if (this.breakable) {
            this.health -= damage;
            console.log(`Block took ${damage} damage. Health: ${this.health}/${this.maxHealth}`);
            return this.health <= 0;
        }
        return false;
    }
}

class Coin extends Sprite {
    constructor({x, y, value = 5}) {
        super({
            x, 
            y, 
            width: 15, 
            height: 15, 
            color: '#FFD700', // Gold color
            type: 'coin'
        });
        
        this.value = value; // Value of the coin
        this.collected = false;
        this.animationTimer = 0;
        this.floatOffset = 0;
        this.attractSpeed = 0;
        
        // Set random initial velocity for coin drop effect
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
        this.friction = 0.95;
    }
    
    update() {
        // Animation for coin drop
        if (!this.collected) {
            // Update position with velocity
            this.x += this.velocityX;
            this.y += this.velocityY;
            
            // Apply friction to slow down
            this.velocityX *= this.friction;
            this.velocityY *= this.friction;
            
            // Bouncing animation
            this.animationTimer += 0.1;
            this.floatOffset = Math.sin(this.animationTimer) * 2;
        }
    }
    
    draw(ctx) {
        if (this.collected) return;
        
        // Draw coin with float animation
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.floatOffset, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFA500'; // Orange outline
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
    
    collect() {
        this.collected = true;
        return this.value;
    }
}

class DestructibleBlock extends Block {
    constructor({x, y, width, height, color = '#8B4513', health = 3}) {
        super({
            x, y, width, height, color, 
            type: 'destructible', 
            breakable: true, 
            health
        });
        
        this.destructionScore = 10;
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw health indicator if damaged
        if (this.health < this.maxHealth) {
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(
                this.x, 
                this.y, 
                this.width * (1 - healthPercent), 
                this.height
            );
        }
    }
}

class BouncingBlock extends Block {
    constructor({x, y, width, height, color = '#00FFFF'}) {
        super({
            x, y, width, height, color, 
            type: 'bouncing', 
            breakable: false
        });
        
        this.bounceStrength = 10;
    }
}

class Portal extends Block {
    constructor({x, y, targetX, targetY, color = '#9932CC'}) {
        super({
            x, y, width: 50, height: 50, color, 
            type: 'portal', 
            breakable: false
        });
        
        this.targetX = targetX;
        this.targetY = targetY;
        this.active = true;
        this.cooldown = 0; // Cooldown to prevent repeated teleports
    }
    
    update(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    teleport(entity) {
        if (this.active && this.cooldown <= 0) {
            entity.x = this.targetX;
            entity.y = this.targetY;
            this.cooldown = 1000; // 1 second cooldown
            return true;
        }
        return false;
    }
}

class Door extends Block {
    constructor({x, y, width = 60, height = 100, color = '#8B4513', locked = true}) {
        super({
            x, y, width, height, color, 
            type: 'door', 
            breakable: false
        });
        
        this.locked = locked;
    }
    
    draw(ctx) {
        // Draw door
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw door details
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 10, this.y + 40, 10, 10); // Door handle
        
        // Draw lock if locked
        if (this.locked) {
            ctx.fillStyle = '#FFD700'; // Gold lock
            ctx.fillRect(this.x + 20, this.y + 40, 20, 25);
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x + 27, this.y + 50, 6, 10);
        }
    }
    
    unlock() {
        this.locked = false;
    }
    
    isLocked() {
        return this.locked;
    }
}

class Bird extends Sprite {
    constructor({x, y, color = '#4FC3F7', birdType = 'small'}) {
        const size = birdType === 'small' ? 25 : 40;
        
        super({
            x, y, 
            width: size, 
            height: size, 
            color: color, 
            type: 'bird',
            pattern: 'bird'
        });
        
        this.birdType = birdType;
        this.caged = true;
        this.freedTime = 0;
        this.scoreValue = 25;
        this.flySpeed = 2 + Math.random();
        this.flyAngle = Math.random() * Math.PI * 2;
        this.animationTimer = 0;
        this.wingState = 0;
    }
    
    update(deltaTime) {
        this.animationTimer += deltaTime;
        
        // Wing flapping animation
        if (this.animationTimer > 200) {
            this.wingState = (this.wingState + 1) % 3; // 0, 1, 2 for down, middle, up
            this.animationTimer = 0;
        }
        
        // Bird movement after being freed
        if (!this.caged) {
            // Birds fly upward and slightly to the side
            this.x += Math.cos(this.flyAngle) * this.flySpeed;
            this.y -= this.flySpeed * 1.5; // Birds fly upward faster
            
            // Deactivate if off screen
            if (this.y < -50) {
                this.active = false;
            }
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        if (this.caged) {
            // Draw cage
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
            
            // Draw cage bars
            for (let i = 0; i < 4; i++) {
                const barX = this.x - 5 + i * ((this.width + 10) / 3);
                ctx.beginPath();
                ctx.moveTo(barX, this.y - 5);
                ctx.lineTo(barX, this.y + this.height + 5);
                ctx.stroke();
            }
        }
        
        // Draw bird
        ctx.fillStyle = this.color;
        
        // Bird body
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, 
                   this.width/2 - 2, this.height/2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird head
        const headSize = this.birdType === 'small' ? 8 : 12;
        ctx.beginPath();
        ctx.arc(this.x + this.width - headSize, this.y + this.height/3, 
               headSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.width - headSize + 2, this.y + this.height/3 - 2, 
               2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird beak
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + this.height/3);
        ctx.lineTo(this.x + this.width + 8, this.y + this.height/3 + 2);
        ctx.lineTo(this.x + this.width, this.y + this.height/3 + 4);
        ctx.fill();
        
        // Bird wings
        ctx.fillStyle = this.color;
        const wingY = this.y + this.height/2;
        let wingOffset = 0;
        
        // Wing position based on state
        if (this.wingState === 0) wingOffset = 6; // Down
        else if (this.wingState === 2) wingOffset = -6; // Up
        
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/3, wingY + wingOffset, 
                   this.width/3, this.height/4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    free() {
        if (this.caged) {
            this.caged = false;
            this.freedTime = Date.now();
            return true;
        }
        return false;
    }
}

class PowerUpBlock extends Block {
    constructor({x, y, powerUpType = 'health'}) {
        // Set color based on power-up type
        let color;
        switch(powerUpType) {
            case 'health': color = '#2ecc71'; break; // Green
            case 'weapon': color = '#3498db'; break; // Blue
            case 'key': color = '#f1c40f'; break;    // Yellow
            case 'score': color = '#9b59b6'; break;  // Purple
            case 'speed': color = '#e67e22'; break;  // Orange
            default: color = '#95a5a6';              // Gray
        }
        
        super({
            x, y, 
            width: 30, 
            height: 30, 
            color, 
            type: 'power-up', 
            breakable: true, 
            health: 1
        });
        
        this.powerUpType = powerUpType;
        this.destructionScore = 5;
        this.animationTimer = 0;
        this.hoverOffset = 0;
    }
    
    update(deltaTime) {
        // Hovering animation
        this.animationTimer += deltaTime * 0.005;
        this.hoverOffset = Math.sin(this.animationTimer) * 3;
    }
    
    draw(ctx) {
        // Apply hover animation
        const drawY = this.y + this.hoverOffset;
        
        // Draw background
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, drawY, this.width, this.height);
        
        // Draw power-up icon based on type
        ctx.fillStyle = '#ffffff';
        
        switch(this.powerUpType) {
            case 'health':
                // Draw plus sign
                ctx.fillRect(this.x + 12, drawY + 7, 6, 16);
                ctx.fillRect(this.x + 7, drawY + 12, 16, 6);
                break;
                
            case 'weapon':
                // Draw star shape
                ctx.beginPath();
                const centerX = this.x + this.width/2;
                const centerY = drawY + this.height/2;
                const spikes = 5;
                const outerRadius = 10;
                const innerRadius = 5;
                
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI / spikes) * i;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'key':
                // Draw key shape
                const keyX = this.x + 5;
                const keyY = drawY + 9;
                
                // Draw key head (circle)
                ctx.beginPath();
                ctx.arc(keyX + 5, keyY + 5, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw key shaft
                ctx.fillRect(keyX + 8, keyY + 4, 12, 4);
                
                // Draw key teeth
                ctx.fillRect(keyX + 16, keyY + 4, 3, 8);
                ctx.fillRect(keyX + 19, keyY + 8, 3, 4);
                break;
                
            case 'score':
                // Draw 'S' shape
                ctx.font = '18px Arial';
                ctx.fillText('S', this.x + 10, drawY + 22);
                break;
                
            case 'speed':
                // Draw lightning bolt
                ctx.beginPath();
                ctx.moveTo(this.x + 18, drawY + 5);
                ctx.lineTo(this.x + 10, drawY + 15);
                ctx.lineTo(this.x + 15, drawY + 15);
                ctx.lineTo(this.x + 12, drawY + 25);
                ctx.lineTo(this.x + 22, drawY + 12);
                ctx.lineTo(this.x + 16, drawY + 12);
                ctx.lineTo(this.x + 18, drawY + 5);
                ctx.fill();
                break;
        }
    }
    
    applyPowerUp(player) {
        switch(this.powerUpType) {
            case 'health':
                const healAmount = 20 + player.level * 5; // Scale with player level
                player.heal(healAmount);
                return `+${healAmount} Health`;
                
            case 'weapon':
                if (player.weaponLevel < 3) {
                    player.upgradeWeapon();
                    return `Weapon Upgraded to Level ${player.weaponLevel}`;
                } else {
                    player.addScore(25); // Bonus score if weapon already maxed
                    return "Weapon already at max level! +25 Score";
                }
                
            case 'key':
                player.addKey();
                return "+1 Key";
                
            case 'score':
                const scoreBonus = 50 * player.level;
                player.addScore(scoreBonus);
                return `+${scoreBonus} Score`;
                
            case 'speed':
                player.speed += 0.5;
                return "+0.5 Speed";
                
            default:
                return "Unknown Power-up";
        }
    }
}