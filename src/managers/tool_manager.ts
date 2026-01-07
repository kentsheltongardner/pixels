import PencilTool from '../tools/pencil_tool.js'
import RectangleTool from '../tools/rectangle_tool.js'
import SelectTool from '../tools/select_tool.js'
import type { Tool, ToolContext } from '../tools/tool.js'

export default class ToolManager {
    private activeTool: Tool
    private pencilTool: PencilTool

    private toolContext: ToolContext
    private toolButtons: NodeListOf<HTMLDivElement>

    private toolButtonIdMap: Record<string, Tool> = {
        'select-tool-button': new SelectTool(),
        'pencil-tool-button': new PencilTool(),
        'rectangle-tool-button': new RectangleTool(),
    }

    constructor(toolContext: ToolContext) {
        this.toolContext = toolContext
        this.pencilTool  = new PencilTool()
        this.activeTool  = this.pencilTool
        this.toolButtons = document.querySelectorAll('.tool-button') as NodeListOf<HTMLDivElement>

        for (const toolButton of this.toolButtons) {
            toolButton.addEventListener('click', () => this.selectTool(toolButton))
        }
    }

    private selectTool(toolButton: HTMLDivElement) {
        const id = toolButton.id

        const newTool = this.toolButtonIdMap[id]

        if (!newTool || newTool === this.activeTool) {
            return
        }

        this.activeTool.handleDeactivate(this.toolContext)
        this.activeTool = newTool
        this.activeTool.handleActivate(this.toolContext)
        for (const toolButton of this.toolButtons) {
            toolButton.classList.remove('selected')
        }
        toolButton.classList.add('selected')
    }

    public handlePointerDown(e: PointerEvent): void {
        this.activeTool.handlePointerDown(e, this.toolContext)
    }

    public handlePointerMove(e: PointerEvent): void {
        this.activeTool.handlePointerMove(e, this.toolContext)
    }

    public handlePointerUp(e: PointerEvent): void {
        this.activeTool.handlePointerUp(e, this.toolContext)
    }

    public handleKeyDown(e: KeyboardEvent): void {
        this.activeTool.handleKeyDown(e, this.toolContext)
    }

    public handleKeyUp(e: KeyboardEvent): void {
        this.activeTool.handleKeyUp(e, this.toolContext)
    }
}