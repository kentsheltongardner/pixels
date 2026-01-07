export default class PencilTool {
    leftMouseButtonDown = false;
    rightMouseButtonDown = false;
    mouseX = 0;
    mouseY = 0;
    handleActivate(ctx) {
        // Tool activated
    }
    handleDeactivate(ctx) {
        // Tool deactivated
    }
    handlePointerDown(e, ctx) {
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;
        // Capture the pointer so we receive all events even if pointer leaves the canvas/browser
        const canvas = ctx.canvasManager.getDisplayCanvas();
        canvas.setPointerCapture(e.pointerId);
        if (e.button === 0) {
            this.leftMouseButtonDown = true;
        }
        else if (e.button === 2) {
            this.rightMouseButtonDown = true;
        }
        // Draw pixel at initial position
        if (this.leftMouseButtonDown) {
            ctx.canvasManager.drawPixelAtPosition(this.mouseX, this.mouseY, ctx.canvasManager.getPrimaryColor());
        }
        else if (this.rightMouseButtonDown) {
            ctx.canvasManager.drawPixelAtPosition(this.mouseX, this.mouseY, ctx.canvasManager.getSecondaryColor());
        }
    }
    handlePointerMove(e, ctx) {
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;
        // Draw pixels while dragging
        if (this.leftMouseButtonDown) {
            ctx.canvasManager.drawPixelAtPosition(this.mouseX, this.mouseY, ctx.canvasManager.getPrimaryColor());
        }
        else if (this.rightMouseButtonDown) {
            ctx.canvasManager.drawPixelAtPosition(this.mouseX, this.mouseY, ctx.canvasManager.getSecondaryColor());
        }
    }
    handlePointerUp(e, ctx) {
        // Release pointer capture
        const canvas = ctx.canvasManager.getDisplayCanvas();
        if (canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
        }
        if (e.button === 0) {
            this.leftMouseButtonDown = false;
        }
        else if (e.button === 2) {
            this.rightMouseButtonDown = false;
        }
    }
    handleKeyDown(e, ctx) {
        // Handle tool-specific key presses if needed
    }
    handleKeyUp(e, ctx) {
        // Handle tool-specific key releases if needed
    }
    renderOverlay(ctx) {
        // Render tool-specific overlay if needed
    }
}
//# sourceMappingURL=pencil_tool.js.map