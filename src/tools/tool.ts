import type CanvasManager from '../managers/canvas_manager.js'
import type ColorPickerManager from '../managers/color_picker_manager.js'

export interface ToolContext {
    canvasManager: CanvasManager
    colorPickerManager: ColorPickerManager
}

export interface Tool {
    handleActivate(ctx: ToolContext): void
    handleDeactivate(ctx: ToolContext): void
  
    handlePointerDown(e: PointerEvent, ctx: ToolContext): void
    handlePointerMove(e: PointerEvent, ctx: ToolContext): void
    handlePointerUp(e: PointerEvent, ctx: ToolContext): void
  
    handleKeyDown(e: KeyboardEvent, ctx: ToolContext): void
    handleKeyUp(e: KeyboardEvent, ctx: ToolContext): void
  
    renderOverlay(ctx: ToolContext): void
}
