export default class ToolPicker {

    private selectToolButton: HTMLDivElement
    private pencilToolButton: HTMLDivElement
    private fillToolButton: HTMLDivElement
    private lineToolButton: HTMLDivElement
    private rectangleToolButton: HTMLDivElement
    private ellipseToolButton: HTMLDivElement
    
    private toolButtons: NodeListOf<HTMLDivElement>

    constructor() {
        this.selectToolButton = document.getElementById('select-tool-button') as HTMLDivElement
        this.pencilToolButton = document.getElementById('pencil-tool-button') as HTMLDivElement
        this.fillToolButton = document.getElementById('fill-tool-button') as HTMLDivElement
        this.lineToolButton = document.getElementById('line-tool-button') as HTMLDivElement
        this.rectangleToolButton = document.getElementById('rectangle-tool-button') as HTMLDivElement
        this.ellipseToolButton = document.getElementById('ellipse-tool-button') as HTMLDivElement

        this.toolButtons = document.querySelectorAll('.tool-button') as NodeListOf<HTMLDivElement>

        for (const toolButton of this.toolButtons) {
            toolButton.addEventListener('click', () => this.selectTool(toolButton))
        }
    }

    private selectTool(toolButton: HTMLDivElement) {
        for (const toolButton of this.toolButtons) {
            toolButton.classList.remove('selected')
        }
        toolButton.classList.add('selected')
    }
}