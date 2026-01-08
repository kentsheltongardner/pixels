import type { Tool, ToolContext } from './tool.ts';
export default class PencilTool implements Tool {
    private button;
    private isDrawing;
    private lastX;
    private lastY;
    handleActivate(toolContext: ToolContext): void;
    handleDeactivate(toolContext: ToolContext): void;
    handlePointerDown(e: PointerEvent, toolContext: ToolContext): void;
    handlePointerMove(e: PointerEvent, toolContext: ToolContext): void;
    handlePointerUp(e: PointerEvent, toolContext: ToolContext): void;
    handleKeyDown(e: KeyboardEvent, toolContext: ToolContext): void;
    handleKeyUp(e: KeyboardEvent, toolContext: ToolContext): void;
    renderOverlay(toolContext: ToolContext): void;
    private drawLine;
}
//# sourceMappingURL=pencil_tool.d.ts.map