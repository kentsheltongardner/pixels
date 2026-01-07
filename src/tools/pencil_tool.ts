import type { Tool, ToolContext } from './tool.ts'


export default class PencilTool implements Tool {

    private leftMouseButtonDown: boolean = false
    private rightMouseButtonDown: boolean = false

    private mouseX: number = 0
    private mouseY: number = 0

    handleActivate(ctx: ToolContext): void {
        // Tool activated
    }

    handleDeactivate(ctx: ToolContext): void {
        // Tool deactivated
    }

    handlePointerDown(e: PointerEvent, ctx: ToolContext): void {
        this.mouseX = e.offsetX
        this.mouseY = e.offsetY

        // Capture the pointer so we receive all events even if pointer leaves the canvas/browser
        const canvas = ctx.canvasManager.getDisplayCanvas()
        canvas.setPointerCapture(e.pointerId)
        
        if (e.button === 0) {
            this.leftMouseButtonDown = true
        } else if (e.button === 2) {
            this.rightMouseButtonDown = true
        }

        // Draw pixel at initial position
        if (this.leftMouseButtonDown) {
            ctx.canvasManager.drawPixelAtPosition(this.mouseX, this.mouseY, ctx.canvasManager.getPrimaryColor())
        } else if (this.rightMouseButtonDown) {
            ctx.canvasManager.drawPixelAtPosition(this.mouseX, this.mouseY, ctx.canvasManager.getSecondaryColor())
        }
    }

    handlePointerMove(e: PointerEvent, ctx: ToolContext): void {
        this.mouseX = e.offsetX
        this.mouseY = e.offsetY

        // Draw pixels while dragging
        if (this.leftMouseButtonDown) {
            ctx.canvasManager.drawPixelAtPosition(this.mouseX, this.mouseY, ctx.canvasManager.getPrimaryColor())
        } else if (this.rightMouseButtonDown) {
            ctx.canvasManager.drawPixelAtPosition(this.mouseX, this.mouseY, ctx.canvasManager.getSecondaryColor())
        }
    }

    handlePointerUp(e: PointerEvent, ctx: ToolContext): void {
        // Release pointer capture
        const canvas = ctx.canvasManager.getDisplayCanvas()
        if (canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId)
        }
        
        if (e.button === 0) {
            this.leftMouseButtonDown = false
        } else if (e.button === 2) {
            this.rightMouseButtonDown = false
        }
    }

    handleKeyDown(e: KeyboardEvent, ctx: ToolContext): void {
        // Handle tool-specific key presses if needed
    }

    handleKeyUp(e: KeyboardEvent, ctx: ToolContext): void {
        // Handle tool-specific key releases if needed
    }

    renderOverlay(ctx: ToolContext): void {
        // Render tool-specific overlay if needed
    }
}