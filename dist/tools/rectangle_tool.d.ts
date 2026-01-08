import type { Tool, ToolContext } from './tool.ts';
export default class RectangleTool implements Tool {
    private button;
    private isDrawing;
    private startX;
    private startY;
    private currentX;
    private currentY;
    private endX;
    private endY;
    handleActivate(toolContext: ToolContext): void;
    handleDeactivate(toolContext: ToolContext): void;
    handlePointerDown(e: PointerEvent, toolContext: ToolContext): void;
    handlePointerMove(e: PointerEvent, toolContext: ToolContext): void;
    handlePointerUp(e: PointerEvent, toolContext: ToolContext): void;
    handleKeyDown(e: KeyboardEvent, toolContext: ToolContext): void;
    handleKeyUp(e: KeyboardEvent, toolContext: ToolContext): void;
    renderOverlay(toolContext: ToolContext): void;
}
//# sourceMappingURL=rectangle_tool.d.ts.map