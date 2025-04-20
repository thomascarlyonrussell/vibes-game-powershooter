/**
 * Power Shooter Game - Weapons System
 */

class Weapon {
    constructor(level = 1) {
        this.level = level;
        this.damage = 10 * level;
        this.cooldown = 500 - (level * 100); // Decrease cooldown as level increases
        this.projectileSpeed = 8 + level;
        this.projectileColor = level === 1 ? '#00ff00' : 
                              level === 2 ? '#00ffff' : '#ff00ff';
    }
    
    upgrade() {
        if (this.level < 3) {
            this.level++;
            this.damage = 10 * this.level;
            this.cooldown = 500 - (this.level * 100);
            this.projectileSpeed = 8 + this.level;
            this.projectileColor = this.level === 1 ? '#00ff00' : 
                                  this.level === 2 ? '#00ffff' : '#ff00ff';
            return true;
        }
        return false;
    }
    
    createProjectiles(x, y, angle) {
        const projectiles = [];
        
        if (this.level === 1) {
            // Basic single shot
            projectiles.push(new Projectile({
                x, y, angle, 
                speed: this.projectileSpeed, 
                damage: this.damage,
                color: this.projectileColor
            }));
        } else if (this.level === 2) {
            // Double shot
            projectiles.push(new Projectile({
                x, y, angle, 
                speed: this.projectileSpeed, 
                damage: this.damage,
                color: this.projectileColor
            }));
            
            projectiles.push(new Projectile({
                x, y, angle: angle + 0.2, 
                speed: this.projectileSpeed, 
                damage: this.damage,
                color: this.projectileColor
            }));
        } else {
            // Triple shot with more damage
            projectiles.push(new Projectile({
                x, y, angle, 
                speed: this.projectileSpeed, 
                damage: this.damage,
                color: this.projectileColor
            }));
            
            projectiles.push(new Projectile({
                x, y, angle: angle + 0.2, 
                speed: this.projectileSpeed, 
                damage: this.damage,
                color: this.projectileColor
            }));
            
            projectiles.push(new Projectile({
                x, y, angle: angle - 0.2, 
                speed: this.projectileSpeed, 
                damage: this.damage,
                color: this.projectileColor
            }));
        }
        
        return projectiles;
    }
}