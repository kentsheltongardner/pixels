export default class RectangleTool {
    // If button changes before pointer up, we need to reset the start and end points
    button = 0;
    startX = 0;
    startY = 0;
    endX = 0;
    endY = 0;
    handleActivate(ctx) {
    }
    handleDeactivate(ctx) {
    }
    handlePointerDown(e, ctx) {
        this.button = e.button;
        this.startX = ctx.canvasManager.displayToBitmapX(e.offsetX);
        this.startY = ctx.canvasManager.displayToBitmapY(e.offsetY);
        this.endX = this.startX;
        this.endY = this.startY;
    }
    handlePointerMove(e, ctx) {
        this.endX = ctx.canvasManager.displayToBitmapX(e.offsetX);
        this.endY = ctx.canvasManager.displayToBitmapY(e.offsetY);
    }
    handlePointerUp(e, ctx) {
        console.log('pointer up');
        console.log(this.startX, this.startY, this.endX, this.endY);
        const rgbColor = this.button === 0 ? ctx.canvasManager.getPrimaryColor() : ctx.canvasManager.getSecondaryColor();
        ctx.canvasManager.drawRectangle(this.startX, this.startY, this.endX, this.endY, rgbColor);
    }
    handleKeyDown(e, ctx) {
    }
    handleKeyUp(e, ctx) {
    }
    renderOverlay(ctx) {
    }
}
//# sourceMappingURL=rectangle_tool.js.map