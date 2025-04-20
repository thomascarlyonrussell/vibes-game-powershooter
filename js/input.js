/**
 * Power Shooter Game - Input Handler
 */

class InputHandler {
    constructor() {
        console.log('Initializing InputHandler...');
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDown = false;
        this.mouseClicked = false;  // New property to track if mouse was clicked and released
        this.mouseDownTime = 0;     // Track when mouse was pressed down
        
        // Set up event listeners
        window.addEventListener('keydown', (e) => this.keyDown(e));
        window.addEventListener('keyup', (e) => this.keyUp(e));
        window.addEventListener('mousemove', (e) => this.mouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('click', (e) => this.onClick(e));  // Add click event
        
        // Log initial state
        console.log('InputHandler initialized with mouseDown =', this.mouseDown);
    }
    
    keyDown(e) {
        console.log('Key down:', e.key);
        this.keys[e.key] = true;
    }
    
    keyUp(e) {
        console.log('Key up:', e.key);
        this.keys[e.key] = false;
    }
    
    mouseMove(e) {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        this.mousePosition.x = e.clientX - rect.left;
        this.mousePosition.y = e.clientY - rect.top;
        // Only log every 100 moves to avoid console spam
        if (Math.random() < 0.01) console.log('Mouse position:', this.mousePosition);
    }
    
    onMouseDown(e) {
        console.log('Mouse down event detected');
        this.mouseDown = true;
        this.mouseDownTime = Date.now();
    }
    
    onMouseUp(e) {
        console.log('Mouse up event detected');
        this.mouseDown = false;
        
        // If mousedown and mouseup happened within 300ms, consider it a click
        if (Date.now() - this.mouseDownTime < 300) {
            this.mouseClicked = true;
            console.log('Mouse clicked set to true');
            
            // Reset the clicked state after a short delay
            setTimeout(() => {
                this.mouseClicked = false;
                console.log('Mouse clicked reset to false');
            }, 100);
        }
    }
    
    onClick(e) {
        console.log('Click event detected');
        this.mouseClicked = true;
        
        // Reset clicked state after a short delay
        setTimeout(() => {
            this.mouseClicked = false;
            console.log('Mouse clicked reset to false after click event');
        }, 100);
    }
    
    isKeyDown(key) {
        return this.keys[key] === true;
    }
    
    isKeyPressed(key) {
        const isPressed = this.keys[key] === true;
        if (isPressed) console.log(`Key ${key} is pressed`);
        return isPressed;
    }
    
    getMousePosition() {
        return this.mousePosition;
    }
    
    isMouseDown() {
        console.log('isMouseDown called, returning:', this.mouseDown);
        return this.mouseDown;
    }
    
    isMouseClicked() {
        // Return and consume the click
        if (this.mouseClicked) {
            console.log('Mouse was clicked, consuming click');
            this.mouseClicked = false;
            return true;
        }
        return false;
    }
    
    // Reset all input states - useful for level transitions or modal screens
    reset() {
        console.log('Resetting input states');
        this.keys = {};
        this.mouseDown = false;
        this.mouseClicked = false;
    }
    
    resetKey(key) {
        console.log(`Resetting key ${key}`);
        this.keys[key] = false;
    }
    
    resetMouse() {
        console.log('Resetting mouse state');
        this.mouseDown = false;
        this.mouseClicked = false;
    }
}