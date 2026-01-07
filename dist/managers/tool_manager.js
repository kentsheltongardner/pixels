import PencilTool from '../tools/pencil_tool.js';
import RectangleTool from '../tools/rectangle_tool.js';
import SelectTool from '../tools/select_tool.js';
export default class ToolManager {
    activeTool;
    pencilTool;
    toolContext;
    toolButtons;
    toolButtonIdMap = {
        'select-tool-button': new SelectTool(),
        'pencil-tool-button': new PencilTool(),
        'rectangle-tool-button': new RectangleTool(),
    };
    constructor(toolContext) {
        this.toolContext = toolContext;
        this.pencilTool = new PencilTool();
        this.activeTool = this.pencilTool;
        this.toolButtons = document.querySelectorAll('.tool-button');
        for (const toolButton of this.toolButtons) {
            toolButton.addEventListener('click', () => this.selectTool(toolButton));
        }
    }
    selectTool(toolButton) {
        const id = toolButton.id;
        const newTool = this.toolButtonIdMap[id];
        if (!newTool || newTool === this.activeTool) {
            return;
        }
        this.activeTool.handleDeactivate(this.toolContext);
        this.activeTool = newTool;
        this.activeTool.handleActivate(this.toolContext);
        for (const toolButton of this.toolButtons) {
            toolButton.classList.remove('selected');
        }
        toolButton.classList.add('selected');
    }
    handlePointerDown(e) {
        this.activeTool.handlePointerDown(e, this.toolContext);
    }
    handlePointerMove(e) {
        this.activeTool.handlePointerMove(e, this.toolContext);
    }
    handlePointerUp(e) {
        this.activeTool.handlePointerUp(e, this.toolContext);
    }
    handleKeyDown(e) {
        this.activeTool.handleKeyDown(e, this.toolContext);
    }
    handleKeyUp(e) {
        this.activeTool.handleKeyUp(e, this.toolContext);
    }
}
//# sourceMappingURL=tool_manager.js.map