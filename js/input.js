/**
 * Power Shooter Game - Input Handler
 */

class InputHandler {
    constructor() {
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDown = false;
        this.mouseClicked = false;  // New property to track if mouse was clicked and released
        this.mouseDownTime = 0;     // Track when mouse was pressed down
        this.shootingEnabled = false; // Flag to control shooting
        this.shootingTouchId = null; // Track which touch ID is shooting
        
        // Mobile detection and touch control properties
        this.isMobile = this.detectMobile();
        this.activeTouches = {};
        this.touchedButtons = {}; // Track which buttons are touched by which touch ID
        
        // Define virtual buttons with square buttons for directional controls
        this.virtualButtons = {
            // Directional pad (square buttons) with down button aligned with left and right
            up: { 
                type: 'square',
                x: 60, y: 460, 
                width: 60, height: 60, 
                pressed: false, 
                key: 'ArrowUp'
            },
            left: { 
                type: 'square',
                x: 0, y: 520, 
                width: 60, height: 60, 
                pressed: false, 
                key: 'ArrowLeft'
            },
            down: { 
                type: 'square',
                x: 60, y: 520, 
                width: 60, height: 60, 
                pressed: false, 
                key: 'ArrowDown'
            },
            right: { 
                type: 'square',
                x: 120, y: 520, 
                width: 60, height: 60, 
                pressed: false, 
                key: 'ArrowRight'
            },
            
            // Action buttons (circular)
            action: { 
                type: 'circle',
                x: 720, y: 460, 
                radius: 40, 
                pressed: false, 
                key: 'e' // E key for actions
            },
            shop: { 
                type: 'circle',
                x: 720, y: 560, 
                radius: 40, 
                pressed: false, 
                key: 'b' // B key for shop
            }
            // Removed shoot button - shooting will be controlled by touching anywhere on screen
        };
        
        // Set up event listeners
        window.addEventListener('keydown', (e) => this.keyDown(e));
        window.addEventListener('keyup', (e) => this.keyUp(e));
        window.addEventListener('mousemove', (e) => this.mouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('click', (e) => this.onClick(e));
        
        // Add touch event listeners for mobile
        if (this.isMobile) {
            window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
            window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
            window.addEventListener('touchend', (e) => this.onTouchEnd(e));
        }
    }
    
    // Mobile detection function
    detectMobile() {
        // Force mobile mode for testing - remove this line in production
        return true;
        
        // Original detection code
        /*
        return (
            navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i) ||
            (window.innerWidth <= 800)
        );
        */
    }
    
    // Check if a point is inside a button
    isPointInButton(x, y, button) {
        if (button.type === 'circle') {
            // For circular buttons, check if point is within radius
            const distance = Math.sqrt(
                Math.pow(x - button.x, 2) + 
                Math.pow(y - button.y, 2)
            );
            return distance <= button.radius;
        } else if (button.type === 'square') {
            // For square buttons, check if point is within bounds
            return (
                x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height
            );
        }
        return false;
    }
    
    // Check if a point is inside any control button
    isPointInAnyButton(x, y) {
        for (const button of Object.values(this.virtualButtons)) {
            if (this.isPointInButton(x, y, button)) {
                return true;
            }
        }
        return false;
    }
    
    // Touch event handlers for mobile controls
    onTouchStart(e) {
        e.preventDefault();
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchId = touch.identifier;
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            // Store the touch
            this.activeTouches[touchId] = { x: touchX, y: touchY };
            
            // Check if the touch is on any virtual button
            let touchedButton = false;
            for (const [buttonName, button] of Object.entries(this.virtualButtons)) {
                if (this.isPointInButton(touchX, touchY, button)) {
                    button.pressed = true;
                    this.keys[button.key] = true;
                    
                    // Store which button this touch ID is pressing
                    this.touchedButtons[touchId] = buttonName;
                    touchedButton = true;
                    break;
                }
            }
            
            // If not touching any button, enable shooting at this position
            if (!touchedButton) {
                this.mouseDown = true;
                this.mouseDownTime = Date.now();
                this.mousePosition.x = touchX;
                this.mousePosition.y = touchY;
                this.shootingEnabled = true;
                this.shootingTouchId = touchId;
            }
        }
    }
    
    onTouchMove(e) {
        e.preventDefault();
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchId = touch.identifier;
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            // Update the stored touch position
            if (this.activeTouches[touchId]) {
                this.activeTouches[touchId].x = touchX;
                this.activeTouches[touchId].y = touchY;
            }
            
            // If this touch ID is for shooting, update the aim position
            if (touchId === this.shootingTouchId) {
                this.mousePosition.x = touchX;
                this.mousePosition.y = touchY;
                
                // If the touch moves onto a button, stop shooting
                if (this.isPointInAnyButton(touchX, touchY)) {
                    this.mouseDown = false;
                    this.shootingEnabled = false;
                    this.shootingTouchId = null;
                }
            }
            
            // Check if touch moved off a button
            const pressedButton = this.touchedButtons[touchId];
            if (pressedButton) {
                const button = this.virtualButtons[pressedButton];
                if (!this.isPointInButton(touchX, touchY, button)) {
                    // Touch moved out of button, release it
                    button.pressed = false;
                    this.keys[button.key] = false;
                    delete this.touchedButtons[touchId];
                    
                    // If the touch is not on any button, start shooting
                    if (!this.isPointInAnyButton(touchX, touchY)) {
                        this.mouseDown = true;
                        this.mouseDownTime = Date.now();
                        this.mousePosition.x = touchX;
                        this.mousePosition.y = touchY;
                        this.shootingEnabled = true;
                        this.shootingTouchId = touchId;
                    }
                }
            }
            
            // Check if a non-button touch moved onto a button
            if (!pressedButton && touchId === this.shootingTouchId) {
                for (const [buttonName, button] of Object.entries(this.virtualButtons)) {
                    if (this.isPointInButton(touchX, touchY, button)) {
                        // Touch moved onto a button, stop shooting
                        this.mouseDown = false;
                        this.shootingEnabled = false;
                        this.shootingTouchId = null;
                        
                        // Press the button
                        button.pressed = true;
                        this.keys[button.key] = true;
                        this.touchedButtons[touchId] = buttonName;
                        break;
                    }
                }
            }
        }
    }
    
    onTouchEnd(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchId = touch.identifier;
            
            // Check which button this touch was pressing
            const buttonName = this.touchedButtons[touchId];
            if (buttonName) {
                const button = this.virtualButtons[buttonName];
                button.pressed = false;
                this.keys[button.key] = false;
                delete this.touchedButtons[touchId];
            }
            
            // If this was the shooting touch, stop shooting
            if (touchId === this.shootingTouchId) {
                this.mouseDown = false;
                this.shootingEnabled = false;
                this.shootingTouchId = null;
            }
            
            // Remove the touch from active touches
            delete this.activeTouches[touchId];
        }
        
        // If no active touches remain, ensure all states are reset
        if (Object.keys(this.activeTouches).length === 0) {
            this.mouseDown = false;
            this.shootingEnabled = false;
            this.shootingTouchId = null;
            
            // Menu screen click handling
            if (Date.now() - this.mouseDownTime < 300) {
                this.mouseClicked = true;
                setTimeout(() => {
                    this.mouseClicked = false;
                }, 100);
            }
        }
    }
    
    // Draw virtual buttons on mobile
    drawVirtualControls(ctx) {
        if (!this.isMobile) return;
        
        ctx.save();
        ctx.globalAlpha = 0.5;
        
        // Draw all buttons
        for (const [name, button] of Object.entries(this.virtualButtons)) {
            // Set different colors based on button type and state
            if (name === 'action') {
                ctx.fillStyle = button.pressed ? '#33cc33' : '#66cc66';
            } else if (name === 'shop') {
                ctx.fillStyle = button.pressed ? '#ffcc33' : '#ffdd66';
            } else {
                // Directional buttons
                ctx.fillStyle = button.pressed ? '#3333ff' : '#6666ff';
            }
            
            // Draw the button based on its type
            if (button.type === 'circle') {
                // Draw circular button
                ctx.beginPath();
                ctx.arc(button.x, button.y, button.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (button.type === 'square') {
                // Draw square button
                ctx.fillRect(button.x, button.y, button.width, button.height);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(button.x, button.y, button.width, button.height);
            }
            
            // Draw button label
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            if (button.type === 'circle') {
                ctx.fillText(name.toUpperCase(), button.x, button.y + 5);
            } else {
                ctx.fillText(name.toUpperCase(), button.x + button.width/2, button.y + button.height/2 + 5);
            }
        }
        
        // If we're shooting, draw a targeting indicator
        if (this.shootingEnabled) {
            ctx.beginPath();
            ctx.arc(this.mousePosition.x, this.mousePosition.y, 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw a crosshair
            ctx.beginPath();
            ctx.moveTo(this.mousePosition.x - 15, this.mousePosition.y);
            ctx.lineTo(this.mousePosition.x + 15, this.mousePosition.y);
            ctx.moveTo(this.mousePosition.x, this.mousePosition.y - 15);
            ctx.lineTo(this.mousePosition.x, this.mousePosition.y + 15);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // Only use mouseDown for shooting if shooting is enabled
    isMouseDown() {
        if (this.isMobile) {
            return this.shootingEnabled;
        }
        return this.mouseDown;
    }
    
    // Other methods remain unchanged
    keyDown(e) {
        this.keys[e.key] = true;
    }
    
    keyUp(e) {
        this.keys[e.key] = false;
    }
    
    mouseMove(e) {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        this.mousePosition.x = e.clientX - rect.left;
        this.mousePosition.y = e.clientY - rect.top;
    }
    
    onMouseDown(e) {
        this.mouseDown = true;
        this.mouseDownTime = Date.now();
    }
    
    onMouseUp(e) {
        this.mouseDown = false;
        
        // If mousedown and mouseup happened within 300ms, consider it a click
        if (Date.now() - this.mouseDownTime < 300) {
            this.mouseClicked = true;
            
            // Reset the clicked state after a short delay
            setTimeout(() => {
                this.mouseClicked = false;
            }, 100);
        }
    }
    
    onClick(e) {
        this.mouseClicked = true;
        
        // Reset clicked state after a short delay
        setTimeout(() => {
            this.mouseClicked = false;
        }, 100);
    }
    
    isKeyDown(key) {
        return this.keys[key] === true;
    }
    
    isKeyPressed(key) {
        return this.keys[key] === true;
    }
    
    getMousePosition() {
        return this.mousePosition;
    }
    
    isMouseClicked() {
        // Return and consume the click
        if (this.mouseClicked) {
            this.mouseClicked = false;
            return true;
        }
        return false;
    }
    
    // Reset all input states - useful for level transitions or modal screens
    reset() {
        this.keys = {};
        this.mouseDown = false;
        this.mouseClicked = false;
        this.shootingEnabled = false;
        this.shootingTouchId = null;
        this.touchedButtons = {};
        
        // Reset virtual buttons for mobile
        if (this.isMobile) {
            for (const button of Object.values(this.virtualButtons)) {
                button.pressed = false;
            }
        }
    }
    
    resetKey(key) {
        this.keys[key] = false;
    }
    
    resetMouse() {
        this.mouseDown = false;
        this.mouseClicked = false;
        this.shootingEnabled = false;
        this.shootingTouchId = null;
    }
}