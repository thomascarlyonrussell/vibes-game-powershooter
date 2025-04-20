/**
 * Power Shooter Game - Shop System
 */

class ShopSystem {
    constructor(player) {
        this.player = player;
        this.isOpen = false;
        this.selectedItem = null;
        this.items = [
            { id: 'health', name: 'Health Boost', description: '+20 Max Health', cost: 30, action: () => this.purchaseHealthBoost() },
            { id: 'damage', name: 'Damage Boost', description: '+15% Damage', cost: 40, action: () => this.purchaseDamageBoost() },
            { id: 'speed', name: 'Speed Boost', description: '+10% Speed', cost: 35, action: () => this.purchaseSpeedBoost() },
            { id: 'key', name: 'Level Key', description: 'Opens locked doors', cost: 50, action: () => this.purchaseKey() },
            { id: 'weapon', name: 'Weapon Upgrade', description: 'Advanced projectiles', cost: 75, action: () => this.purchaseWeaponUpgrade() }
        ];
    }
    
    open() {
        this.isOpen = true;
    }
    
    close() {
        this.isOpen = false;
        this.selectedItem = null;
    }
    
    update(input, mouseX, mouseY) {
        if (!this.isOpen) return;
        
        // Check for shop close with ESC key
        if (input.isKeyPressed('Escape')) {
            this.close();
            return;
        }
        
        // Get mouse position - use provided mouseX/Y or get from input if not provided
        const mX = mouseX || (input.getMousePosition ? input.getMousePosition().x : 0);
        const mY = mouseY || (input.getMousePosition ? input.getMousePosition().y : 0);
        
        // Check for item selection
        const shopAreaY = 150;
        const itemHeight = 60;
        
        let previousSelected = this.selectedItem;
        this.selectedItem = null; // Reset selection
        
        for (let i = 0; i < this.items.length; i++) {
            const itemY = shopAreaY + i * itemHeight;
            if (mY >= itemY && mY <= itemY + itemHeight && mX >= 250 && mX <= 550) {
                this.selectedItem = i;
                
                // If this is a new hover, play a subtle sound effect
                if (previousSelected !== i) {
                    console.log("Hovering over shop item:", this.items[i].name);
                }
                
                // Check for purchase (using both click detection methods for reliability)
                if (input.isMouseClicked() || (input.isMouseDown && input.isMouseDown())) {
                    console.log("Attempting to purchase:", this.items[i].name);
                    const success = this.purchaseItem(i);
                    
                    // Consume the click event
                    if (input.resetMouse) {
                        input.resetMouse();
                    }
                    
                    return success;
                }
                break;
            }
        }
        return false;
    }
    
    draw(ctx, width, height) {
        if (!this.isOpen) return;
        
        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);
        
        // Draw shop title
        ctx.fillStyle = '#f1c40f'; // Gold color
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('POWER SHOP', width / 2, 80);
        
        // Draw player's coins
        ctx.fillStyle = '#FFD700';
        ctx.font = '24px Arial';
        ctx.fillText(`Coins: ${this.player.coins}`, width / 2, 120);
        
        // Draw shop items
        const shopAreaY = 150;
        const itemHeight = 60;
        
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const itemY = shopAreaY + i * itemHeight;
            const canAfford = this.player.coins >= item.cost;
            
            // Draw item background with different styling based on selection and affordability
            if (this.selectedItem === i) {
                // Selected item gets a brighter background
                ctx.fillStyle = canAfford ? 'rgba(52, 152, 219, 0.8)' : 'rgba(52, 152, 219, 0.4)';
                
                // Draw a border around the selected item
                ctx.strokeStyle = canAfford ? '#2ecc71' : '#e74c3c';
                ctx.lineWidth = 2;
                ctx.strokeRect(248, itemY - 2, 304, itemHeight - 6);
                
            } else {
                // Non-selected items
                ctx.fillStyle = 'rgba(52, 73, 94, 0.7)';
            }
            
            // Draw item background
            ctx.fillRect(250, itemY, 300, itemHeight - 10);
            
            // Draw item name
            ctx.fillStyle = canAfford ? 'white' : '#aaaaaa';
            ctx.font = '20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(item.name, 270, itemY + 25);
            
            // Draw item description
            ctx.fillStyle = canAfford ? '#cccccc' : '#888888';
            ctx.font = '16px Arial';
            ctx.fillText(item.description, 270, itemY + 45);
            
            // Draw cost
            ctx.fillStyle = canAfford ? '#2ecc71' : '#e74c3c';
            ctx.textAlign = 'right';
            ctx.font = '20px Arial';
            ctx.fillText(`${item.cost} coins`, 530, itemY + 35);
            
            // Add "Click to buy" text for items the player can afford
            if (canAfford && this.selectedItem === i) {
                ctx.fillStyle = '#2ecc71';
                ctx.font = 'italic 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Click to buy', 400, itemY + 45);
            }
        }
        
        // Draw exit instructions
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press ESC to close shop', width / 2, height - 50);
    }
    
    purchaseItem(index) {
        if (index < 0 || index >= this.items.length) return;
        
        const item = this.items[index];
        
        if (this.player.coins >= item.cost) {
            if (item.action()) {
                // Item successfully purchased
                this.player.coins -= item.cost;
                
                // Display purchase confirmation
                if (this.showMessage) {
                    this.showMessage(`Purchased: ${item.name}!`, 1500);
                } else {
                    console.log(`Purchased: ${item.name}!`);
                }
                
                // Play purchase sound if available
                if (window.playSound) {
                    window.playSound('purchase');
                }
                
                return true;
            }
        } else {
            // Not enough coins
            if (this.showMessage) {
                this.showMessage("Not enough coins!", 1500);
            } else {
                console.log("Not enough coins!");
            }
            
            // Play error sound if available
            if (window.playSound) {
                window.playSound('error');
            }
        }
        
        return false;
    }
    
    purchaseHealthBoost() {
        this.player.maxHealth += 20;
        this.player.health += 20;
        return true;
    }
    
    purchaseDamageBoost() {
        this.player.damageMultiplier += 0.15;
        return true;
    }
    
    purchaseSpeedBoost() {
        this.player.speedMultiplier += 0.1;
        return true;
    }
    
    purchaseKey() {
        this.player.keys += 1;
        return true;
    }
    
    purchaseWeaponUpgrade() {
        if (this.player.weaponLevel < 5) {
            this.player.weaponLevel += 1;
            return true;
        }
        return false;
    }
}