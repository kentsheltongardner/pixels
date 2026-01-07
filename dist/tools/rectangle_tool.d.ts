import type { Tool, ToolContext } from './tool.ts';
export default class RectangleTool implements Tool {
    private button;
    private startX;
    private startY;
    private endX;
    private endY;
    handleActivate(ctx: ToolContext): void;
    handleDeactivate(ctx: ToolContext): void;
    handlePointerDown(e: PointerEvent, ctx: ToolContext): void;
    handlePointerMove(e: PointerEvent, ctx: ToolContext): void;
    handlePointerUp(e: PointerEvent, ctx: ToolContext): void;
    handleKeyDown(e: KeyboardEvent, ctx: ToolContext): void;
    handleKeyUp(e: KeyboardEvent, ctx: ToolContext): void;
    renderOverlay(ctx: ToolContext): void;
}
//# sourceMappingURL=rectangle_tool.d.ts.map