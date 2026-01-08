import Layer from '../layer.js';
import ColorPicker from './color_picker_manager.js';
const DEFAULT_WIDTH = 256;
const DEFAULT_HEIGHT = 256;
export default class CanvasManager {
    width;
    height;
    originX = 0;
    originY = 0;
    scale;
    colorPicker;
    // What we display to the user
    displayCanvas;
    // Unscaled canvas containing composited layers
    layersCanvas;
    // Unscaled canvas storing info from tool being used
    toolCanvas;
    displayCtx;
    layersCtx;
    toolCtx;
    mousePositionContainer;
    layers = [];
    checkeredBackgroundPattern = null;
    constructor(colorPicker) {
        this.colorPicker = colorPicker;
        this.width = DEFAULT_WIDTH;
        this.height = DEFAULT_HEIGHT;
        this.scale = 1;
        this.displayCanvas = document.getElementById('editor-canvas');
        this.layersCanvas = new OffscreenCanvas(this.width, this.height);
        this.toolCanvas = new OffscreenCanvas(this.width, this.height);
        this.displayCtx = this.displayCanvas.getContext('2d');
        this.layersCtx = this.layersCanvas.getContext('2d');
        this.toolCtx = this.toolCanvas.getContext('2d');
        const defaultLayer = new Layer(this.width, this.height);
        this.mousePositionContainer = document.getElementById('mouse-position-container');
        this.layers.push(defaultLayer);
        this.initializeCanvasSize();
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
    currentLayer() {
        return this.layers[this.layers.length - 1];
    }
    resetToolCanvas() {
        this.toolCtx.clearRect(0, 0, this.width, this.height);
        const currentCanvas = this.currentLayer().canvas;
        this.toolCtx.drawImage(currentCanvas, 0, 0);
        this.render();
    }
    commitToolCanvasToLayer() {
        const layer = this.currentLayer();
        layer.ctx.drawImage(this.toolCanvas, 0, 0);
        this.render();
    }
    loadCheckeredBackground() {
        const checkeredBackground = new Image();
        checkeredBackground.onload = () => {
            const pattern = this.layersCtx.createPattern(checkeredBackground, 'repeat');
            pattern.setTransform(new DOMMatrix().scale(16, 16));
            this.checkeredBackgroundPattern = pattern;
            this.render();
        };
        checkeredBackground.src = './res/images/checkered_background.png';
    }
    outOfBounds(x, y) {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }
    selectColorAtPosition(mouseX, mouseY, button) {
        const x = this.displayToBitmapX(mouseX);
        const y = this.displayToBitmapY(mouseY);
        if (this.outOfBounds(x, y)) {
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
        this.render();
    }
    drawPixelToContext(x, y, color, ctx) {
        // Clamp coordinates to canvas bounds
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
        if (color.a === 0) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        }
        ctx.fillRect(x, y, 1, 1);
        ctx.globalCompositeOperation = 'source-over';
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
    initializeCanvasSize() {
        this.displayCanvas.width = this.displayCanvas.offsetWidth;
        this.displayCanvas.height = this.displayCanvas.offsetHeight;
        this.originX = (this.displayCanvas.width / 2 - this.width * this.scale / 2) / this.scale;
        this.originY = (this.displayCanvas.height / 2 - this.height * this.scale / 2) / this.scale;
    }
    updateCanvasSize() {
        const oldWidth = this.displayCanvas.width;
        const oldHeight = this.displayCanvas.height;
        this.displayCanvas.width = this.displayCanvas.offsetWidth;
        this.displayCanvas.height = this.displayCanvas.offsetHeight;
        const scale = this.scale;
        // Calculate what bitmap point is currently at the center of the old display
        const centerDisplayX = oldWidth / 2;
        const centerDisplayY = oldHeight / 2;
        const centerBitmapX = (centerDisplayX - this.originX * scale) / scale;
        const centerBitmapY = (centerDisplayY - this.originY * scale) / scale;
        // Adjust origin so the same bitmap point is at the new center (scale remains constant)
        const newCenterDisplayX = this.displayCanvas.width / 2;
        const newCenterDisplayY = this.displayCanvas.height / 2;
        this.originX = (newCenterDisplayX - centerBitmapX * scale) / scale;
        this.originY = (newCenterDisplayY - centerBitmapY * scale) / scale;
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
    // Using strokeRect causes anti-aliasing and translucent rendering that has to be fixed with a 0.5 pixel offset
    // Using fillRect for each line gives pixel-perfect rendering
    strokeRectangle(startX, startY, endX, endY, color, ctx) {
        let minX = startX;
        let minY = startY;
        let maxX = endX;
        let maxY = endY;
        if (minX > maxX) {
            minX = maxX;
            maxX = startX;
        }
        if (minY > maxY) {
            minY = maxY;
            maxY = startY;
        }
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
        if (color.a === 0) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        }
        if (width <= 2 || height <= 2) {
            ctx.fillRect(minX, minY, width, height);
        }
        else {
            ctx.fillRect(minX, minY, width, 1);
            ctx.fillRect(minX, maxY, width, 1);
            ctx.fillRect(minX, minY + 1, 1, height - 2);
            ctx.fillRect(maxX, minY + 1, 1, height - 2);
        }
        ctx.globalCompositeOperation = 'source-over';
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
        this.layersCtx.imageSmoothingEnabled = false;
        if (this.checkeredBackgroundPattern) {
            this.layersCtx.fillStyle = this.checkeredBackgroundPattern;
            this.layersCtx.fillRect(0, 0, this.width, this.height);
        }
        else {
            // Fallback: fill with white if pattern hasn't loaded yet
            this.layersCtx.fillStyle = '#ffffff';
            this.layersCtx.fillRect(0, 0, this.width, this.height);
        }
        for (const layer of this.layers) {
            if (layer === this.currentLayer()) {
                this.layersCtx.drawImage(this.toolCanvas, 0, 0);
            }
            else {
                this.layersCtx.drawImage(layer.canvas, 0, 0);
            }
        }
        this.displayCtx.drawImage(this.layersCanvas, x, y, this.width * this.scale, this.height * this.scale);
    }
}
//# sourceMappingURL=canvas_manager.js.map