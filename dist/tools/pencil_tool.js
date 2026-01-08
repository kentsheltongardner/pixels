export default class PencilTool {
    button = 0;
    isDrawing = false;
    lastX = 0;
    lastY = 0;
    handleActivate(toolContext) { }
    handleDeactivate(toolContext) {
        // Clear tool canvas if drawing when deactivated
        if (this.isDrawing) {
            toolContext.canvasManager.resetToolCanvas();
            this.isDrawing = false;
        }
    }
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
        // Reset tool canvas and draw initial pixel
        toolContext.canvasManager.resetToolCanvas();
        const x = toolContext.canvasManager.displayToBitmapX(e.offsetX);
        const y = toolContext.canvasManager.displayToBitmapY(e.offsetY);
        this.lastX = x;
        this.lastY = y;
        const rgbColor = this.button === 0 ? toolContext.canvasManager.getPrimaryColor() : toolContext.canvasManager.getSecondaryColor();
        const ctx = toolContext.canvasManager.toolCtx;
        toolContext.canvasManager.drawPixelToContext(x, y, rgbColor, ctx);
        toolContext.canvasManager.render();
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
        const x = toolContext.canvasManager.displayToBitmapX(e.offsetX);
        const y = toolContext.canvasManager.displayToBitmapY(e.offsetY);
        // If this is a synthetic event (e.g., from space key release), just update position without drawing
        if (e.isTrusted === false) {
            this.lastX = x;
            this.lastY = y;
            return;
        }
        // Draw line between last position and current position (for smooth drawing)
        const rgbColor = this.button === 0 ? toolContext.canvasManager.getPrimaryColor() : toolContext.canvasManager.getSecondaryColor();
        const ctx = toolContext.canvasManager.toolCtx;
        // Draw pixels along the line
        this.drawLine(this.lastX, this.lastY, x, y, rgbColor, ctx, toolContext);
        // Render after drawing
        toolContext.canvasManager.render();
        this.lastX = x;
        this.lastY = y;
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
        // Commit tool canvas to layer
        toolContext.canvasManager.commitToolCanvasToLayer();
        // Clear tool canvas
        toolContext.canvasManager.resetToolCanvas();
        this.isDrawing = false;
    }
    handleKeyDown(e, toolContext) { }
    handleKeyUp(e, toolContext) { }
    renderOverlay(toolContext) { }
    drawLine(x0, y0, x1, y1, color, ctx, toolContext) {
        // Bresenham's line algorithm for pixel-perfect lines
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        let x = x0;
        let y = y0;
        while (true) {
            toolContext.canvasManager.drawPixelToContext(x, y, color, ctx);
            if (x === x1 && y === y1) {
                break;
            }
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }
}
//# sourceMappingURL=pencil_tool.js.map