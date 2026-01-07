import type CanvasManager from './canvas_manager.js'
import type ToolManager from './tool_manager.js'
import type ColorPickerManager from './color_picker_manager.js'

const MAX_SCALE = 128
const MIN_SCALE = 1 / 4

export default class InputManager {
    private canvasManager: CanvasManager
    private toolManager: ToolManager
    private colorPickerManager: ColorPickerManager

    // Mouse state
    private mouseX: number = 0
    private mouseY: number = 0
    private leftMouseButtonDown: boolean = false
    private rightMouseButtonDown: boolean = false

    // Keyboard state
    private spaceKeyPressed: boolean = false

    constructor(canvasManager: CanvasManager, toolManager: ToolManager, colorPickerManager: ColorPickerManager) {
        this.canvasManager      = canvasManager
        this.toolManager        = toolManager
        this.colorPickerManager = colorPickerManager

        const canvas            = document.getElementById('editor-canvas') as HTMLCanvasElement

        canvas.addEventListener('pointerdown', e => this.handlePointerDown(e))
        canvas.addEventListener('pointermove', e => this.handlePointerMove(e))
        canvas.addEventListener('pointerup', e => this.handlePointerUp(e))

        canvas.addEventListener('wheel', e => this.handleWheel(e), { passive: false })
        canvas.addEventListener('contextmenu', e => e.preventDefault())

        window.addEventListener('keydown', e => this.handleKeyDown(e))
        window.addEventListener('keyup', e => this.handleKeyUp(e))

        window.addEventListener('resize', () => this.handleResize())
    }

    private handlePointerDown(e: PointerEvent): void {
        // Handle color selection with alt key
        if (e.altKey) {
            this.canvasManager.selectColorAtPosition(e.offsetX, e.offsetY, e.button)
            return
        } 

        // Update mouse position
        this.mouseX = e.offsetX
        this.mouseY = e.offsetY

        // Update button state
        if (e.button === 0) {
            this.leftMouseButtonDown = true
        } else if (e.button === 2) {
            this.rightMouseButtonDown = true
        }

        // If space is pressed with left mouse button, we're panning - don't dispatch to tool
        if (this.spaceKeyPressed && e.button === 0) {
            // Capture pointer for panning
            const canvas = this.canvasManager.getDisplayCanvas()
            canvas.setPointerCapture(e.pointerId)
            return
        }

        // Otherwise, dispatch to active tool
        this.toolManager.handlePointerDown(e)
    }

    private handlePointerMove(e: PointerEvent): void {
        const newMouseX = e.offsetX 
        const newMouseY = e.offsetY 
        const movementX = (newMouseX - this.mouseX) / this.canvasManager.getScale()
        const movementY = (newMouseY - this.mouseY) / this.canvasManager.getScale()
        this.mouseX = newMouseX
        this.mouseY = newMouseY

        // Handle panning with space + mouse drag
        if (this.spaceKeyPressed && this.leftMouseButtonDown) {
            this.canvasManager.pan(movementX, movementY)
            this.canvasManager.updateMousePosition(this.mouseX, this.mouseY)
            return
        }
        
        // Update mouse position display
        this.canvasManager.updateMousePosition(this.mouseX, this.mouseY)
        
        // Dispatch to active tool
        this.toolManager.handlePointerMove(e)
    }

    private handlePointerUp(e: PointerEvent): void {
        // Update button state
        if (e.button === 0) {
            this.leftMouseButtonDown = false
        } else if (e.button === 2) {
            this.rightMouseButtonDown = false
        }

        // Dispatch to active tool
        this.toolManager.handlePointerUp(e)
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.code === 'Space') {
            this.spaceKeyPressed = true
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        if (e.code === 'Space') {
            this.spaceKeyPressed = false
        }
    }

    private handleWheel(e: WheelEvent): void {
        e.preventDefault()
        
        const oldScale = this.canvasManager.getScale()
        const scaleDelta = Math.sign(e.deltaY)

        if (scaleDelta === 0) {
            return
        }

        let newScale = oldScale * (scaleDelta === 1 ? 0.5 : 2)

        if (newScale > MAX_SCALE) {
            newScale = MAX_SCALE
        } else if (newScale < MIN_SCALE) {
            newScale = MIN_SCALE
        }
        
        if (newScale !== oldScale) {
            this.canvasManager.zoomAtPosition(newScale, this.mouseX, this.mouseY)
            this.canvasManager.updateMousePosition(this.mouseX, this.mouseY)
        }
    }

    private handleResize(): void {
        this.canvasManager.handleResize()
    }
}