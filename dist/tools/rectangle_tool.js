export default class RectangleTool {
    button = 0;
    isDrawing = false;
    startX = 0;
    startY = 0;
    currentX = 0;
    currentY = 0;
    endX = 0;
    endY = 0;
    handleActivate(toolContext) { }
    handleDeactivate(toolContext) { }
    handlePointerDown(e, toolContext) {
        // If already drawing, check if the opposite button is being pressed
        if (this.isDrawing) {
            const oppositeButton = this.button === 0 ? 2 : 0;
            if (e.button === oppositeButton) {
                // Cancel current draw without starting a new one
                toolContext.canvasManager.resetToolCanvas();
                this.isDrawing = false;
                return;
            }
        }
        // Only start a new draw if the opposite button is not already pressed
        // e.buttons bitmask: 1 = left, 2 = right, 4 = middle
        const oppositeButtonPressed = (e.button === 0 && (e.buttons & 2)) || (e.button === 2 && (e.buttons & 1));
        if (oppositeButtonPressed) {
            return;
        }
        // Capture the pointer so we receive all events even if pointer leaves the canvas/browser
        // Only capture if this is a real event (not synthetic) and not already captured
        const canvas = toolContext.canvasManager.getDisplayCanvas();
        if (e.isTrusted !== false && !canvas.hasPointerCapture(e.pointerId)) {
            canvas.setPointerCapture(e.pointerId);
        }
        this.button = e.button;
        this.isDrawing = true;
        this.startX = toolContext.canvasManager.displayToBitmapX(e.offsetX);
        this.startY = toolContext.canvasManager.displayToBitmapY(e.offsetY);
        this.endX = this.startX;
        this.endY = this.startY;
        // Draw initial rectangle (single pixel)
        const rgbColor = this.button === 0 ? toolContext.canvasManager.getPrimaryColor() : toolContext.canvasManager.getSecondaryColor();
        const ctx = toolContext.canvasManager.toolCtx;
        toolContext.canvasManager.strokeRectangle(this.startX, this.startY, this.endX, this.endY, rgbColor, ctx);
    }
    handlePointerMove(e, toolContext) {
        if (!this.isDrawing) {
            return;
        }
        // Check if opposite button is now pressed using e.buttons (not e.button)
        // e.buttons bitmask: 1 = left, 2 = right
        const oppositeButtonPressed = (this.button === 0 && (e.buttons & 2)) || (this.button === 2 && (e.buttons & 1));
        if (oppositeButtonPressed) {
            // Cancel current draw - clear working context and stop drawing
            toolContext.canvasManager.resetToolCanvas();
            this.isDrawing = false;
            // Release pointer capture
            const canvas = toolContext.canvasManager.getDisplayCanvas();
            if (canvas.hasPointerCapture(e.pointerId)) {
                canvas.releasePointerCapture(e.pointerId);
            }
            return;
        }
        toolContext.canvasManager.resetToolCanvas();
        this.endX = toolContext.canvasManager.displayToBitmapX(e.offsetX);
        this.endY = toolContext.canvasManager.displayToBitmapY(e.offsetY);
        this.currentX = this.endX;
        this.currentY = this.endY;
        if (e.shiftKey) {
            const signX = Math.sign(this.endX - this.startX);
            const signY = Math.sign(this.endY - this.startY);
            const width = Math.abs(this.endX - this.startX);
            const height = Math.abs(this.endY - this.startY);
            const size = Math.max(width, height);
            this.endX = this.startX + signX * size;
            this.endY = this.startY + signY * size;
        }
        const rgbColor = this.button === 0 ? toolContext.canvasManager.getPrimaryColor() : toolContext.canvasManager.getSecondaryColor();
        const ctx = toolContext.canvasManager.toolCtx;
        toolContext.canvasManager.strokeRectangle(this.startX, this.startY, this.endX, this.endY, rgbColor, ctx);
    }
    handlePointerUp(e, toolContext) {
        if (!this.isDrawing) {
            return;
        }
        // Release pointer capture
        const canvas = toolContext.canvasManager.getDisplayCanvas();
        if (canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
        }
        const rgbColor = this.button === 0 ? toolContext.canvasManager.getPrimaryColor() : toolContext.canvasManager.getSecondaryColor();
        const ctx = toolContext.canvasManager.currentLayer().ctx;
        this.isDrawing = false;
        toolContext.canvasManager.strokeRectangle(this.startX, this.startY, this.endX, this.endY, rgbColor, ctx);
        toolContext.canvasManager.resetToolCanvas();
    }
    handleKeyDown(e, toolContext) {
        // Only handle shift key down if we're currently drawing
        if (e.key === 'Shift' && this.isDrawing) {
            const signX = Math.sign(this.endX - this.startX);
            const signY = Math.sign(this.endY - this.startY);
            const width = Math.abs(this.endX - this.startX);
            const height = Math.abs(this.endY - this.startY);
            const size = Math.max(width, height);
            this.endX = this.startX + signX * size;
            this.endY = this.startY + signY * size;
            toolContext.canvasManager.resetToolCanvas();
            const rgbColor = this.button === 0 ? toolContext.canvasManager.getPrimaryColor() : toolContext.canvasManager.getSecondaryColor();
            const ctx = toolContext.canvasManager.toolCtx;
            toolContext.canvasManager.strokeRectangle(this.startX, this.startY, this.endX, this.endY, rgbColor, ctx);
        }
    }
    handleKeyUp(e, toolContext) {
        // Only handle shift key up if we're still drawing
        if (e.key === 'Shift' && this.isDrawing) {
            this.endX = this.currentX;
            this.endY = this.currentY;
            toolContext.canvasManager.resetToolCanvas();
            const rgbColor = this.button === 0 ? toolContext.canvasManager.getPrimaryColor() : toolContext.canvasManager.getSecondaryColor();
            const ctx = toolContext.canvasManager.toolCtx;
            toolContext.canvasManager.strokeRectangle(this.startX, this.startY, this.endX, this.endY, rgbColor, ctx);
        }
    }
    renderOverlay(toolContext) { }
}
//# sourceMappingURL=rectangle_tool.js.map