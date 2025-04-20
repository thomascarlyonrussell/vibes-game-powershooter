/**
 * Power Shooter Game - Sprite System
 */

class Sprite {
    constructor({x, y, width, height, color, type, pattern = null}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.type = type;
        this.pattern = pattern;
        this.texture = null;
        this.speed = 0;
        this.active = true;
        
        // Log creation for debugging
        if (DEBUG_MODE) {
            console.log(`Created ${type} sprite at (${x}, ${y}) with dimensions ${width}x${height}`);
        }
    }
    
    init(ctx) {
        console.log(`Initializing ${this.type} sprite texture...`);
        // Create texture only once for performance
        if (!this.texture) {
            try {
                this.texture = createPixelArtTexture(ctx, this.width, this.height, this.color, this.pattern);
                console.log(`${this.type} sprite texture created:`, this.texture !== null);
            } catch (error) {
                console.error(`Failed to create texture for ${this.type} sprite:`, error);
                // Fall back to simple rendering without texture
                this.texture = null;
            }
        }
    }
    
    update(deltaTime) {
        // Base update method - extended by child classes
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        try {
            if (this.texture) {
                ctx.drawImage(this.texture, this.x, this.y);
            } else {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
            
            // Debug collision box
            if (DEBUG_MODE) {
                ctx.strokeStyle = 'red';
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                
                // Only log occasional draws to avoid console spam
                if (Math.random() < 0.01 && this.type === 'player') {
                    console.log(`Drew ${this.type} sprite at (${this.x}, ${this.y})`);
                }
            }
        } catch (error) {
            console.error(`Error drawing ${this.type} sprite:`, error);
        }
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    collidesWith(other) {
        return checkCollision(this.getBounds(), other.getBounds());
    }
}