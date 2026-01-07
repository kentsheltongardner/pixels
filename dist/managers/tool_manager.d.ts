import type { ToolContext } from '../tools/tool.js';
export default class ToolManager {
    private activeTool;
    private pencilTool;
    private toolContext;
    private toolButtons;
    private toolButtonIdMap;
    constructor(toolContext: ToolContext);
    private selectTool;
    handlePointerDown(e: PointerEvent): void;
    handlePointerMove(e: PointerEvent): void;
    handlePointerUp(e: PointerEvent): void;
    handleKeyDown(e: KeyboardEvent): void;
    handleKeyUp(e: KeyboardEvent): void;
}
//# sourceMappingURL=tool_manager.d.ts.map