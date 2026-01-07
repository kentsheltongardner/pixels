import type { Tool, ToolContext } from './tool.ts';
export default class PencilTool implements Tool {
    private leftMouseButtonDown;
    private rightMouseButtonDown;
    private mouseX;
    private mouseY;
    handleActivate(ctx: ToolContext): void;
    handleDeactivate(ctx: ToolContext): void;
    handlePointerDown(e: PointerEvent, ctx: ToolContext): void;
    handlePointerMove(e: PointerEvent, ctx: ToolContext): void;
    handlePointerUp(e: PointerEvent, ctx: ToolContext): void;
    handleKeyDown(e: KeyboardEvent, ctx: ToolContext): void;
    handleKeyUp(e: KeyboardEvent, ctx: ToolContext): void;
    renderOverlay(ctx: ToolContext): void;
}
//# sourceMappingURL=pencil_tool.d.ts.map