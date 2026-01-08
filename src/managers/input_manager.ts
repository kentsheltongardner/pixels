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

        // If space is pressed with left or right mouse button, we're panning - don't dispatch to tool
        if (this.spaceKeyPressed && (e.button === 0 || e.button === 2)) {
            // Capture pointer for panning (only if not already captured and it's a real event)
            const canvas = this.canvasManager.getDisplayCanvas()
            if (e.isTrusted !== false && !canvas.hasPointerCapture(e.pointerId)) {
                canvas.setPointerCapture(e.pointerId)
            }
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

        // Detect button state changes from e.buttons (works even when pointerdown doesn't fire)
        // e.buttons bitmask: 1 = left, 2 = right, 4 = middle
        const leftPressed = (e.buttons & 1) !== 0
        const rightPressed = (e.buttons & 2) !== 0

        // Handle panning with space + mouse drag (check this first before creating synthetic events)
        // Allow panning while tool is drawing - just don't dispatch move events to tool
        // Support both left and right mouse buttons for panning
        if (this.spaceKeyPressed && (leftPressed || rightPressed)) {
            this.canvasManager.pan(movementX, movementY)
            this.canvasManager.updateMousePosition(this.mouseX, this.mouseY)
            // Update button state
            if (!this.leftMouseButtonDown && leftPressed) {
                this.leftMouseButtonDown = true
            }
            if (!this.rightMouseButtonDown && rightPressed) {
                this.rightMouseButtonDown = true
            }
            // Don't dispatch move to tool while panning - tool drawing is paused but not canceled
            return
        }
        
        // Update button state if buttons were released
        if (this.leftMouseButtonDown && !leftPressed) {
            this.leftMouseButtonDown = false
        }
        if (this.rightMouseButtonDown && !rightPressed) {
            this.rightMouseButtonDown = false
        }
        
        // If a new button was pressed while another is held, simulate pointerdown
        // But only if space is not pressed (to avoid conflicts with panning)
        // IMPORTANT: Only create synthetic events for REAL pointer events, not synthetic ones
        // Check if this is a real event by verifying it's not a synthetic event we created
        if (!this.spaceKeyPressed && e.isTrusted !== false) {
            if (!this.leftMouseButtonDown && leftPressed) {
                // Update state FIRST to prevent loops
                this.leftMouseButtonDown = true
                // Create synthetic pointerdown event
                const syntheticEvent = {
                    ...e,
                    button: 0,
                    buttons: e.buttons,
                    type: 'pointerdown',
                    isTrusted: false
                } as PointerEvent
                this.handlePointerDown(syntheticEvent)
                return // Return early to avoid dispatching move to tool
            }
            
            if (!this.rightMouseButtonDown && rightPressed) {
                // Update state FIRST to prevent loops
                this.rightMouseButtonDown = true
                // Create synthetic pointerdown event
                const syntheticEvent = {
                    ...e,
                    button: 2,
                    buttons: e.buttons,
                    type: 'pointerdown',
                    isTrusted: false
                } as PointerEvent
                this.handlePointerDown(syntheticEvent)
                return // Return early to avoid dispatching move to tool
            }
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
            // Don't cancel tool drawing - allow panning while drawing
        }

        this.toolManager.handleKeyDown(e)
    }

    private handleKeyUp(e: KeyboardEvent): void {
        if (e.code === 'Space') {
            this.spaceKeyPressed = false
            // When space is released, update tool's last position to current mouse position
            // This prevents drawing an unwanted line when resuming drawing after panning
            // We'll do this by dispatching a move event to the tool with current position
            if (this.leftMouseButtonDown || this.rightMouseButtonDown) {
                const canvas = this.canvasManager.getDisplayCanvas()
                // Create a synthetic move event to update tool's last position
                // Include shiftKey state so tools can maintain constraints (e.g., square rectangles)
                const syntheticMoveEvent = {
                    offsetX: this.mouseX,
                    offsetY: this.mouseY,
                    buttons: this.leftMouseButtonDown ? 1 : (this.rightMouseButtonDown ? 2 : 0),
                    shiftKey: e.shiftKey, // Preserve shift key state
                    isTrusted: false
                } as PointerEvent
                this.toolManager.handlePointerMove(syntheticMoveEvent)
            }
        }

        this.toolManager.handleKeyUp(e)
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