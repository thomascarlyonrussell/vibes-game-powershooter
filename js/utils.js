/**
 * Power Shooter Game - Utility Functions
 */

// Random number between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Create a simple pixel art texture (for placeholder graphics)
function createPixelArtTexture(ctx, width, height, color, pattern = null) {
    console.log(`Creating texture: ${width}x${height}, color: ${color}, pattern: ${pattern}`);
    
    try {
        // Make sure width and height are valid positive numbers
        if (width <= 0 || height <= 0) {
            console.error(`Invalid texture dimensions: ${width}x${height}`);
            return null;
        }
        
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        const offCtx = offscreenCanvas.getContext('2d');
        
        if (!offCtx) {
            console.error('Failed to get offscreen context');
            return null;
        }
        
        // Fill with base color
        offCtx.fillStyle = color;
        offCtx.fillRect(0, 0, width, height);
        
        // Add pattern if specified
        if (pattern === 'player') {
            offCtx.fillStyle = '#ffffff';
            offCtx.fillRect(width * 0.35, height * 0.2, width * 0.3, height * 0.2);  // Eyes
            offCtx.fillRect(width * 0.4, height * 0.5, width * 0.2, height * 0.3);  // Mouth
        } else if (pattern === 'enemy') {
            offCtx.fillStyle = '#ff0000';
            offCtx.fillRect(width * 0.2, height * 0.2, width * 0.2, height * 0.2);  // Left eye
            offCtx.fillRect(width * 0.6, height * 0.2, width * 0.2, height * 0.2);  // Right eye
            offCtx.fillRect(width * 0.3, height * 0.6, width * 0.4, height * 0.2);  // Angry mouth
        } else if (pattern === 'block') {
            offCtx.strokeStyle = '#888888';
            offCtx.lineWidth = 2;
            offCtx.strokeRect(2, 2, width - 4, height - 4);
        } else if (pattern === 'biochem') {
            // Special pattern for biochem blocks
            offCtx.strokeStyle = '#FFFFFF';
            offCtx.lineWidth = 2;
            offCtx.strokeRect(2, 2, width - 4, height - 4);
            
            // Add biohazard-like symbol
            offCtx.fillStyle = '#FFFFFF';
            offCtx.beginPath();
            offCtx.arc(width / 2, height / 2, width / 4, 0, Math.PI * 2);
            offCtx.fill();
            
            offCtx.fillStyle = color;
            offCtx.beginPath();
            offCtx.arc(width / 2, height / 2, width / 6, 0, Math.PI * 2);
            offCtx.fill();
            
            // Add three circles around the center
            const radius = width / 8;
            for (let i = 0; i < 3; i++) {
                const angle = (i * Math.PI * 2) / 3;
                const x = width / 2 + Math.cos(angle) * (width / 3);
                const y = height / 2 + Math.sin(angle) * (height / 3);
                
                offCtx.fillStyle = '#FFFFFF';
                offCtx.beginPath();
                offCtx.arc(x, y, radius, 0, Math.PI * 2);
                offCtx.fill();
            }
        } else if (pattern === 'powerup') {
            offCtx.fillStyle = '#ffff00';
            offCtx.beginPath();
            offCtx.arc(width / 2, height / 2, Math.min(width, height) / 4, 0, Math.PI * 2);
            offCtx.fill();
        } else if (pattern === 'door') {
            offCtx.fillStyle = '#555555';
            offCtx.fillRect(width * 0.4, height * 0.1, width * 0.2, height * 0.1);  // Door handle
            offCtx.strokeStyle = '#888888';
            offCtx.lineWidth = 2;
            offCtx.strokeRect(2, 2, width - 4, height - 4);
        } else if (pattern === 'bird') {
            // Simple bird pattern
            offCtx.fillStyle = '#FFFFFF';
            offCtx.beginPath();
            offCtx.arc(width * 0.7, height * 0.3, width * 0.1, 0, Math.PI * 2); // Eye
            offCtx.fill();
            
            offCtx.fillStyle = '#FF9800';
            offCtx.beginPath();
            offCtx.moveTo(width * 0.9, height * 0.3);
            offCtx.lineTo(width, height * 0.4);
            offCtx.lineTo(width * 0.9, height * 0.5);
            offCtx.fill(); // Beak
        }
        
        console.log('Texture created successfully');
        return offscreenCanvas;
    } catch (error) {
        console.error('Error creating texture:', error);
        return null;
    }
}

// Show a popup message in game
function showMessage(ctx, message, duration = 2000) {
    console.log(`Showing message: ${message} for ${duration}ms`);
    const startTime = Date.now();
    
    function drawMessage() {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < duration) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(ctx.canvas.width/2 - 150, ctx.canvas.height/2 - 30, 300, 60);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(message, ctx.canvas.width/2, ctx.canvas.height/2);
            ctx.restore();
            
            requestAnimationFrame(drawMessage);
        }
    }
    
    drawMessage();
}