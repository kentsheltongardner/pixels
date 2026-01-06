// When doing shaders, have a triangle that encompasses the entire offscreen canvas to avoid edge artifacts

// Make all changes through ImageData (CPU)
// When we want to use a shader, upload the ImageData as a texture to a WebGL / OffscreenCanvas WebGL context
// Run the shader to produce a new texture
// Download the texture back into ImageData (via readPixels or drawImage -> getImageData)
// Commit back to the 2D canvas for display/compositing

import Layer from './layer.js'
import ColorPicker from './color_picker.js'
import type { RGBColor } from './colors.js'

const DEFAULT_WIDTH = 256
const DEFAULT_HEIGHT = 256

export default class EditorCanvas {
    private width: number
    private height: number
    private originX: number = 0
    private originY: number = 0
    private scale: number
    private spaceKeyPressed: boolean
    private mouseX: number
    private mouseY: number
    private leftMouseButtonDown: boolean
    private rightMouseButtonDown: boolean
    private colorPicker: ColorPicker

    private offscreenCanvas: OffscreenCanvas
    private displayCanvas: HTMLCanvasElement
    private displayCtx: CanvasRenderingContext2D
    private offscreenCtx: OffscreenCanvasRenderingContext2D
    private mousePositionContainer: HTMLDivElement

    private layers: Layer[] = []

    constructor(colorPicker: ColorPicker) {
        this.colorPicker          = colorPicker
        this.width                = DEFAULT_WIDTH
        this.height               = DEFAULT_HEIGHT
        this.scale                = 1
        this.spaceKeyPressed      = false
        this.mouseX               = 0
        this.mouseY               = 0
        this.leftMouseButtonDown  = false
        this.rightMouseButtonDown = false

        this.displayCanvas        = document.getElementById('editor-canvas') as HTMLCanvasElement
        this.displayCtx           = this.displayCanvas.getContext('2d') as CanvasRenderingContext2D

        this.updateCanvasSize()

        this.offscreenCanvas      = new OffscreenCanvas(this.width, this.height)
        this.offscreenCtx         = this.offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D
        const defaultLayer        = new Layer(this.width, this.height)

        this.mousePositionContainer = document.getElementById('mouse-position-container') as HTMLDivElement


        this.layers.push(defaultLayer)
        this.render()
        this.addEventListeners()
    }

    private addEventListeners(): void {
        this.displayCanvas.addEventListener('pointerdown', e => this.handlePointerDown(e))
        this.displayCanvas.addEventListener('pointermove', e => this.handlePointerMove(e))
        this.displayCanvas.addEventListener('pointerup', e => this.handlePointerUp(e))
        this.displayCanvas.addEventListener('pointerleave', () => this.handlePointerLeave())
        this.displayCanvas.addEventListener('pointercancel', e => this.handlePointerUp(e))
        this.displayCanvas.addEventListener('wheel', e => this.handleWheel(e))
        this.displayCanvas.addEventListener('contextmenu', e => e.preventDefault())

        // Listen for mouse leave on window to catch when mouse leaves browser entirely
        window.addEventListener('mouseleave', () => this.handleWindowMouseLeave())
        window.addEventListener('blur', () => this.handleWindowBlur())

        window.addEventListener('resize', () => this.handleResize())
        window.addEventListener('keydown', e => this.handleKeyDown(e))
        window.addEventListener('keyup', e => this.handleKeyUp(e))
        
        // Listen for mouse move globally to update position even when over containers
        window.addEventListener('mousemove', e => this.handleGlobalMouseMove(e))
    }

    private handlePointerDown(e: PointerEvent): void {
        // Capture the pointer so we receive all events even if pointer leaves the canvas/browser
        this.displayCanvas.setPointerCapture(e.pointerId)
        
        if (e.button === 0) {
            this.leftMouseButtonDown = true
        } else if (e.button === 2) {
            this.rightMouseButtonDown = true
        }

        if (!this.spaceKeyPressed) {
            if (this.leftMouseButtonDown) {
                this.drawPixelAtMousePosition(this.colorPicker.primaryColor)
            } else if (this.rightMouseButtonDown) {
                this.drawPixelAtMousePosition(this.colorPicker.secondaryColor)
            }
        }
    }

    private drawPixelAtMousePosition(color: RGBColor): void {
        const x = this.displayToBitmapX(this.mouseX)
        if (x < 0 || x >= this.width) {
            return
        }
        const y = this.displayToBitmapY(this.mouseY)
        if (y < 0 || y >= this.height) {
            return
        }
        const topLayer = this.layers[this.layers.length - 1] as Layer
        topLayer.setPixel(x, y, color)
        topLayer.commitEdits()
        this.render()
    }

    private handlePointerMove(e: PointerEvent): void {
        const newMouseX = e.offsetX 
        const newMouseY = e.offsetY 
        const movementX = (newMouseX - this.mouseX) / this.scale
        const movementY = (newMouseY - this.mouseY) / this.scale
        this.mouseX = newMouseX
        this.mouseY = newMouseY

        if (this.spaceKeyPressed && this.leftMouseButtonDown         ) {
            this.originX += movementX
            this.originY += movementY
            this.render()
        } else {
            if (this.leftMouseButtonDown) {
                this.drawPixelAtMousePosition(this.colorPicker.primaryColor)
            } else if (this.rightMouseButtonDown) {
                this.drawPixelAtMousePosition(this.colorPicker.secondaryColor)
            }
        }
        this.displayMousePosition()
    }

    private handlePointerUp(e: PointerEvent): void {
        // Release pointer capture
        if (this.displayCanvas.hasPointerCapture(e.pointerId)) {
            this.displayCanvas.releasePointerCapture(e.pointerId)
        }
        
        if (e.button === 0) {
            this.leftMouseButtonDown = false
        } else if (e.button === 2) {
            this.rightMouseButtonDown = false
        }
    }

    private handlePointerLeave(): void {
        if (this.leftMouseButtonDown || this.rightMouseButtonDown) {
            this.leftMouseButtonDown = false
            this.rightMouseButtonDown = false
        }
    }

    private handleWindowMouseLeave(): void {
        this.leftMouseButtonDown = false
        this.rightMouseButtonDown = false
    }

    private handleWindowBlur(): void {
        this.leftMouseButtonDown = false
        this.rightMouseButtonDown = false
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

    private updateCanvasSize(): void {
        // Use clientWidth/clientHeight for more reliable sizing of absolutely positioned elements
        const cssWidth = this.displayCanvas.clientWidth
        const cssHeight = this.displayCanvas.clientHeight
        
        if (cssWidth === 0 || cssHeight === 0) {
            // Canvas not yet laid out, try getBoundingClientRect as fallback
            const rect = this.displayCanvas.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) {
                // Still not ready, schedule for next frame
                requestAnimationFrame(() => this.updateCanvasSize())
                return
            }
            this.displayCanvas.width = rect.width
            this.displayCanvas.height = rect.height
            this.originX = Math.floor(rect.width / 2 - this.width / 2 * this.scale)
            this.originY = Math.floor(rect.height / 2 - this.height / 2 * this.scale)
        } else {
            this.displayCanvas.width = cssWidth
            this.displayCanvas.height = cssHeight
            this.originX = Math.floor(cssWidth / 2 - this.width / 2 * this.scale)
            this.originY = Math.floor(cssHeight / 2 - this.height / 2 * this.scale)
        }
    }

    private handleResize(): void {
        this.updateCanvasSize()
        this.render()
    }

    private handleWheel(e: WheelEvent): void {
        e.preventDefault()
        
        const oldScale   = this.scale
        const scaleDelta = Math.sign(e.deltaY)
        const newScale   = Math.max(1, this.scale - scaleDelta)
        
        if (newScale !== oldScale) {
            this.zoomTo(newScale, )
            this.render()
        }
    }

    private zoomTo(scale: number): void {
        const canvasX = (this.mouseX - this.originX * this.scale) / this.scale
        const canvasY = (this.mouseY - this.originY * this.scale) / this.scale
        this.scale    = scale
        this.originX  = (this.mouseX - canvasX * this.scale) / this.scale
        this.originY  = (this.mouseY - canvasY * this.scale) / this.scale
        this.displayMousePosition()
    }

    private displayToBitmapX(displayX: number): number {
        return Math.floor((displayX - this.originX * this.scale) / this.scale)
    }

    private displayToBitmapY(displayY: number): number {
        return Math.floor((displayY - this.originY * this.scale) / this.scale)
    }

    private handleGlobalMouseMove(e: MouseEvent): void {
        // Convert global mouse coordinates to canvas-relative coordinates
        const rect = this.displayCanvas.getBoundingClientRect()
        const canvasX = e.clientX - rect.left
        const canvasY = e.clientY - rect.top
        
        // Only update mouse position variables if we're not actively interacting
        // (panning or drawing) to preserve fidelity of movement calculations
        const isInteracting = this.leftMouseButtonDown || this.rightMouseButtonDown
        if (!isInteracting) {
            this.mouseX = canvasX
            this.mouseY = canvasY
            // Only update display when not interacting to avoid fluctuations during panning
            this.displayMousePositionWithCoords(canvasX, canvasY)
        }
        // During panning/drawing, display is updated by handlePointerMove to ensure consistency
    }

    private displayMousePosition(): void {
        this.displayMousePositionWithCoords(this.mouseX, this.mouseY)
    }

    private displayMousePositionWithCoords(x: number, y: number): void {
        const bitmapX = this.displayToBitmapX(x)
        const bitmapY = this.displayToBitmapY(y)
        this.mousePositionContainer.textContent = `x: ${bitmapX}, y: ${bitmapY}` 
    }
 
    private render(): void {
        this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height)
 
        const x = this.originX * this.scale
        const y = this.originY * this.scale

        this.displayCtx.imageSmoothingEnabled = false

        for (const layer of this.layers) {
            this.offscreenCtx.drawImage(layer.canvas, 0, 0)
        }

        this.displayCtx.drawImage(this.offscreenCanvas, x, y, this.width * this.scale, this.height * this.scale)
    }
}