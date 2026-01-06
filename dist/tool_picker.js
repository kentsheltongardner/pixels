export default class ToolPicker {
    selectToolButton;
    pencilToolButton;
    fillToolButton;
    lineToolButton;
    rectangleToolButton;
    ellipseToolButton;
    toolButtons;
    constructor() {
        this.selectToolButton = document.getElementById('select-tool-button');
        this.pencilToolButton = document.getElementById('pencil-tool-button');
        this.fillToolButton = document.getElementById('fill-tool-button');
        this.lineToolButton = document.getElementById('line-tool-button');
        this.rectangleToolButton = document.getElementById('rectangle-tool-button');
        this.ellipseToolButton = document.getElementById('ellipse-tool-button');
        this.toolButtons = document.querySelectorAll('.tool-button');
        for (const toolButton of this.toolButtons) {
            toolButton.addEventListener('click', () => this.selectTool(toolButton));
        }
    }
    selectTool(toolButton) {
        for (const toolButton of this.toolButtons) {
            toolButton.classList.remove('selected');
        }
        toolButton.classList.add('selected');
    }
}
//# sourceMappingURL=tool_picker.js.map