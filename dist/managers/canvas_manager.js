// When doing shaders, have a triangle that encompasses the entire offscreen canvas to avoid edge artifacts
// Make all changes through ImageData (CPU)
// When we want to use a shader, upload the ImageData as a texture to a WebGL / OffscreenCanvas WebGL context
// Run the shader to produce a new texture
// Download the texture back into ImageData (via readPixels or drawImage -> getImageData)
// Commit back to the 2D canvas for display/compositing
import Layer from '../layer.js';
import ColorPicker from './color_picker_manager.js';
const DEFAULT_WIDTH = 256;
const DEFAULT_HEIGHT = 256;
export default class CanvasManager {
    width;
    height;
    originX = 0;
    originY = 0;
    hasBeenInitialized = false;
    scale;
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
    }
    getScale() {
        return this.scale;
    }
    getOriginX() {
        return this.originX;
    }
    getOriginY() {
        return this.originY;
    }
    getDisplayCanvas() {
        return this.displayCanvas;
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
    selectColorAtPosition(mouseX, mouseY, button) {
        const x = this.displayToBitmapX(mouseX);
        const y = this.displayToBitmapY(mouseY);
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        const topLayer = this.layers[this.layers.length - 1];
        const color = topLayer.getPixel(x, y);
        if (button === 0) {
            this.colorPicker.primaryColor = color;
            this.colorPicker.selectPrimaryColor();
        }
        else if (button === 2) {
            this.colorPicker.secondaryColor = color;
            this.colorPicker.selectSecondaryColor();
        }
    }
    drawPixelAtPosition(mouseX, mouseY, color) {
        const x = this.displayToBitmapX(mouseX);
        if (x < 0 || x >= this.width) {
            return;
        }
        const y = this.displayToBitmapY(mouseY);
        if (y < 0 || y >= this.height) {
            return;
        }
        const topLayer = this.layers[this.layers.length - 1];
        topLayer.setPixel(x, y, color);
        topLayer.commitEdits();
        this.render();
    }
    pan(deltaX, deltaY) {
        this.originX += deltaX;
        this.originY += deltaY;
        this.render();
    }
    updateMousePosition(mouseX, mouseY) {
        this.displayMousePositionWithCoords(mouseX, mouseY);
    }
    zoomAtPosition(scale, mouseX, mouseY) {
        const canvasX = (mouseX - this.originX * this.scale) / this.scale;
        const canvasY = (mouseY - this.originY * this.scale) / this.scale;
        this.scale = scale;
        this.originX = (mouseX - canvasX * this.scale) / this.scale;
        this.originY = (mouseY - canvasY * this.scale) / this.scale;
        this.render();
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
    getPrimaryColor() {
        return this.colorPicker.primaryColor;
    }
    getSecondaryColor() {
        return this.colorPicker.secondaryColor;
    }
    displayToBitmapX(displayX) {
        return Math.floor((displayX - this.originX * this.scale) / this.scale);
    }
    displayToBitmapY(displayY) {
        return Math.floor((displayY - this.originY * this.scale) / this.scale);
    }
    drawRectangle(startX, startY, endX, endY, color) {
        const topLayer = this.layers[this.layers.length - 1];
        const topContext = topLayer.ctx;
        topContext.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        topContext.fillRect(startX, startY, endX - startX, endY - startY);
        this.render();
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
//# sourceMappingURL=canvas_manager.js.map