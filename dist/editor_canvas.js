// When doing shaders, have a triangle that encompasses the entire offscreen canvas to avoid edge artifacts
// Make all changes through ImageData (CPU)
// When we want to use a shader, upload the ImageData as a texture to a WebGL / OffscreenCanvas WebGL context
// Run the shader to produce a new texture
// Download the texture back into ImageData (via readPixels or drawImage -> getImageData)
// Commit back to the 2D canvas for display/compositing
import Layer from './layer.js';
import ColorPicker from './managers/color_picker.js';
const DEFAULT_WIDTH = 256;
const DEFAULT_HEIGHT = 256;
const MAX_SCALE = 128;
const MIN_SCALE = 1 / 4;
export default class EditorCanvas {
    width;
    height;
    originX = 0;
    originY = 0;
    hasBeenInitialized = false;
    scale;
    spaceKeyPressed;
    mouseX;
    mouseY;
    leftMouseButtonDown;
    rightMouseButtonDown;
    colorPicker;
    offscreenCanvas;
    displayCanvas;
    displayCtx;
    offscreenCtx;
    mousePositionContainer;
    layers = [];
    checkeredBackgroundPattern = null;
    constructor(colorPicker) {
        this.colorPicker = colorPicker;
        this.width = DEFAULT_WIDTH;
        this.height = DEFAULT_HEIGHT;
        this.scale = 1;
        this.spaceKeyPressed = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.leftMouseButtonDown = false;
        this.rightMouseButtonDown = false;
        this.displayCanvas = document.getElementById('editor-canvas');
        this.displayCtx = this.displayCanvas.getContext('2d');
        this.updateCanvasSize();
        this.offscreenCanvas = new OffscreenCanvas(this.width, this.height);
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        const defaultLayer = new Layer(this.width, this.height);
        this.mousePositionContainer = document.getElementById('mouse-position-container');
        this.layers.push(defaultLayer);
        this.loadCheckeredBackground();
        this.render();
        this.addEventListeners();
    }
    loadCheckeredBackground() {
        const checkeredBackground = new Image();
        checkeredBackground.onload = () => {
            const pattern = this.offscreenCtx.createPattern(checkeredBackground, 'repeat');
            pattern.setTransform(new DOMMatrix().scale(16, 16));
            this.checkeredBackgroundPattern = pattern;
            this.render();
        };
        checkeredBackground.src = './res/images/checkered_background.png';
    }
    addEventListeners() {
        this.displayCanvas.addEventListener('pointerdown', e => this.handlePointerDown(e));
        this.displayCanvas.addEventListener('pointermove', e => this.handlePointerMove(e));
        this.displayCanvas.addEventListener('pointerup', e => this.handlePointerUp(e));
        this.displayCanvas.addEventListener('pointerleave', () => this.handlePointerLeave());
        this.displayCanvas.addEventListener('pointercancel', e => this.handlePointerUp(e));
        this.displayCanvas.addEventListener('wheel', e => this.handleWheel(e), { passive: false });
        this.displayCanvas.addEventListener('contextmenu', e => e.preventDefault());
        // Listen for mouse leave on window to catch when mouse leaves browser entirely
        window.addEventListener('mouseleave', () => this.handleWindowMouseLeave());
        window.addEventListener('blur', () => this.handleWindowBlur());
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('keydown', e => this.handleKeyDown(e));
        window.addEventListener('keyup', e => this.handleKeyUp(e));
        // Listen for mouse move globally to update position even when over containers
        window.addEventListener('mousemove', e => this.handleGlobalMouseMove(e));
    }
    selectColor(e) {
        const x = this.displayToBitmapX(this.mouseX);
        const y = this.displayToBitmapY(this.mouseY);
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        const topLayer = this.layers[this.layers.length - 1];
        const color = topLayer.getPixel(x, y);
        if (e.button === 0) {
            this.colorPicker.primaryColor = color;
            this.colorPicker.selectPrimaryColor();
        }
        else if (e.button === 2) {
            this.colorPicker.secondaryColor = color;
            this.colorPicker.selectSecondaryColor();
        }
    }
    handlePointerDown(e) {
        if (e.altKey) {
            this.selectColor(e);
            return;
        }
        // Capture the pointer so we receive all events even if pointer leaves the canvas/browser
        this.displayCanvas.setPointerCapture(e.pointerId);
        if (e.button === 0) {
            this.leftMouseButtonDown = true;
        }
        else if (e.button === 2) {
            this.rightMouseButtonDown = true;
        }
        if (!this.spaceKeyPressed) {
            if (this.leftMouseButtonDown) {
                this.drawPixelAtMousePosition(this.colorPicker.primaryColor);
            }
            else if (this.rightMouseButtonDown) {
                this.drawPixelAtMousePosition(this.colorPicker.secondaryColor);
            }
        }
    }
    drawPixelAtMousePosition(color) {
        const x = this.displayToBitmapX(this.mouseX);
        if (x < 0 || x >= this.width) {
            return;
        }
        const y = this.displayToBitmapY(this.mouseY);
        if (y < 0 || y >= this.height) {
            return;
        }
        const topLayer = this.layers[this.layers.length - 1];
        topLayer.setPixel(x, y, color);
        topLayer.commitEdits();
        this.render();
    }
    handlePointerMove(e) {
        const newMouseX = e.offsetX;
        const newMouseY = e.offsetY;
        const movementX = (newMouseX - this.mouseX) / this.scale;
        const movementY = (newMouseY - this.mouseY) / this.scale;
        this.mouseX = newMouseX;
        this.mouseY = newMouseY;
        if (this.spaceKeyPressed && this.leftMouseButtonDown) {
            this.originX += movementX;
            this.originY += movementY;
            this.render();
        }
        else {
            if (this.leftMouseButtonDown) {
                this.drawPixelAtMousePosition(this.colorPicker.primaryColor);
            }
            else if (this.rightMouseButtonDown) {
                this.drawPixelAtMousePosition(this.colorPicker.secondaryColor);
            }
        }
        this.displayMousePosition();
    }
    handlePointerUp(e) {
        // Release pointer capture
        if (this.displayCanvas.hasPointerCapture(e.pointerId)) {
            this.displayCanvas.releasePointerCapture(e.pointerId);
        }
        if (e.button === 0) {
            this.leftMouseButtonDown = false;
        }
        else if (e.button === 2) {
            this.rightMouseButtonDown = false;
        }
    }
    handlePointerLeave() {
        if (this.leftMouseButtonDown || this.rightMouseButtonDown) {
            this.leftMouseButtonDown = false;
            this.rightMouseButtonDown = false;
        }
    }
    handleWindowMouseLeave() {
        this.leftMouseButtonDown = false;
        this.rightMouseButtonDown = false;
    }
    handleWindowBlur() {
        this.leftMouseButtonDown = false;
        this.rightMouseButtonDown = false;
    }
    handleKeyDown(e) {
        if (e.code === 'Space') {
            this.spaceKeyPressed = true;
        }
    }
    handleKeyUp(e) {
        if (e.code === 'Space') {
            this.spaceKeyPressed = false;
        }
    }
    updateCanvasSize() {
        const oldWidth = this.displayCanvas.width || 0;
        const oldHeight = this.displayCanvas.height || 0;
        const cssWidth = this.displayCanvas.clientWidth || this.displayCanvas.offsetWidth;
        const cssHeight = this.displayCanvas.clientHeight || this.displayCanvas.offsetHeight;
        this.displayCanvas.width = cssWidth;
        this.displayCanvas.height = cssHeight;
        const pixelWidth = this.displayCanvas.width;
        const pixelHeight = this.displayCanvas.height;
        if (!this.hasBeenInitialized) {
            this.hasBeenInitialized = true;
            this.originX = (pixelWidth / 2 - this.width * this.scale / 2) / this.scale;
            this.originY = (pixelHeight / 2 - this.height * this.scale / 2) / this.scale;
        }
        else {
            // Calculate what bitmap point is currently at the center of the old display
            const centerDisplayX = oldWidth / 2;
            const centerDisplayY = oldHeight / 2;
            const centerBitmapX = (centerDisplayX - this.originX * this.scale) / this.scale;
            const centerBitmapY = (centerDisplayY - this.originY * this.scale) / this.scale;
            // Adjust origin so the same bitmap point is at the new center (scale remains constant)
            const newCenterDisplayX = pixelWidth / 2;
            const newCenterDisplayY = pixelHeight / 2;
            this.originX = (newCenterDisplayX - centerBitmapX * this.scale) / this.scale;
            this.originY = (newCenterDisplayY - centerBitmapY * this.scale) / this.scale;
        }
    }
    handleResize() {
        this.updateCanvasSize();
        this.render();
    }
    handleWheel(e) {
        e.preventDefault();
        const oldScale = this.scale;
        const scaleDelta = Math.sign(e.deltaY);
        if (scaleDelta === 0) {
            return;
        }
        let newScale = oldScale * (scaleDelta === 1 ? 0.5 : 2);
        if (newScale > MAX_SCALE) {
            newScale = MAX_SCALE;
        }
        else if (newScale < MIN_SCALE) {
            newScale = MIN_SCALE;
        }
        if (newScale !== oldScale) {
            this.zoom(newScale);
            this.render();
        }
    }
    zoom(scale) {
        const canvasX = (this.mouseX - this.originX * this.scale) / this.scale;
        const canvasY = (this.mouseY - this.originY * this.scale) / this.scale;
        this.scale = scale;
        this.originX = (this.mouseX - canvasX * this.scale) / this.scale;
        this.originY = (this.mouseY - canvasY * this.scale) / this.scale;
        this.displayMousePosition();
    }
    displayToBitmapX(displayX) {
        return Math.floor((displayX - this.originX * this.scale) / this.scale);
    }
    displayToBitmapY(displayY) {
        return Math.floor((displayY - this.originY * this.scale) / this.scale);
    }
    handleGlobalMouseMove(e) {
        const rect = this.displayCanvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const isInteracting = this.leftMouseButtonDown || this.rightMouseButtonDown;
        if (!isInteracting) {
            this.mouseX = canvasX;
            this.mouseY = canvasY;
            this.displayMousePositionWithCoords(canvasX, canvasY);
        }
    }
    displayMousePosition() {
        this.displayMousePositionWithCoords(this.mouseX, this.mouseY);
    }
    displayMousePositionWithCoords(x, y) {
        const bitmapX = this.displayToBitmapX(x);
        const bitmapY = this.displayToBitmapY(y);
        this.mousePositionContainer.textContent = `x: ${bitmapX}, y: ${bitmapY}`;
    }
    render() {
        const canvasWidth = this.displayCanvas.width;
        const canvasHeight = this.displayCanvas.height;
        this.displayCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        const x = this.originX * this.scale;
        const y = this.originY * this.scale;
        this.displayCtx.imageSmoothingEnabled = false;
        this.offscreenCtx.imageSmoothingEnabled = false;
        if (this.checkeredBackgroundPattern) {
            this.offscreenCtx.fillStyle = this.checkeredBackgroundPattern;
            this.offscreenCtx.fillRect(0, 0, this.width, this.height);
        }
        else {
            // Fallback: fill with white if pattern hasn't loaded yet
            this.offscreenCtx.fillStyle = '#ffffff';
            this.offscreenCtx.fillRect(0, 0, this.width, this.height);
        }
        for (const layer of this.layers) {
            this.offscreenCtx.drawImage(layer.canvas, 0, 0);
        }
        this.displayCtx.drawImage(this.offscreenCanvas, x, y, this.width * this.scale, this.height * this.scale);
    }
}
//# sourceMappingURL=editor_canvas.js.map