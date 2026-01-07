import type { Tool, ToolContext } from './tool.ts'

export default class RectangleTool implements Tool {
    // If button changes before pointer up, we need to reset the start and end points


    private button: number = 0
    private startX: number = 0
    private startY: number = 0
    private endX: number = 0
    private endY: number = 0

    handleActivate(ctx: ToolContext): void {
        
    }

    handleDeactivate(ctx: ToolContext): void {
        
    }

    handlePointerDown(e: PointerEvent, ctx: ToolContext): void {
        this.button = e.button
        this.startX = ctx.canvasManager.displayToBitmapX(e.offsetX)
        this.startY = ctx.canvasManager.displayToBitmapY(e.offsetY)
        this.endX = this.startX
        this.endY = this.startY
    }

    handlePointerMove(e: PointerEvent, ctx: ToolContext): void {
        this.endX = ctx.canvasManager.displayToBitmapX(e.offsetX)
        this.endY = ctx.canvasManager.displayToBitmapY(e.offsetY)
    }

    handlePointerUp(e: PointerEvent, ctx: ToolContext): void {
        console.log('pointer up')
        console.log(this.startX, this.startY, this.endX, this.endY)
        const rgbColor = this.button === 0 ? ctx.canvasManager.getPrimaryColor() : ctx.canvasManager.getSecondaryColor()
        ctx.canvasManager.drawRectangle(this.startX, this.startY, this.endX, this.endY, rgbColor)
    }

    handleKeyDown(e: KeyboardEvent, ctx: ToolContext): void {
        
    }

    handleKeyUp(e: KeyboardEvent, ctx: ToolContext): void {
        
    }

    renderOverlay(ctx: ToolContext): void {
        
    }
}