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
    private hasBeenInitialized: boolean = false
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
    private checkeredBackgroundPattern: CanvasPattern | null = null

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
        this.loadCheckeredBackground()
        this.render()
        this.addEventListeners()
    }

    private loadCheckeredBackground(): void {
        const checkeredBackground = new Image()
        checkeredBackground.onload = () => {
            const pattern = this.offscreenCtx.createPattern(checkeredBackground, 'repeat') as CanvasPattern
            pattern.setTransform(new DOMMatrix().scale(16, 16))
            this.checkeredBackgroundPattern = pattern
            this.render()
        }
        checkeredBackground.src = './res/images/checkered_background.png'
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

        if (this.spaceKeyPressed && this.leftMouseButtonDown) {
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
        const oldWidth  = this.displayCanvas.width || 0
        const oldHeight = this.displayCanvas.height || 0
        
        const cssWidth  = this.displayCanvas.clientWidth || this.displayCanvas.offsetWidth
        const cssHeight = this.displayCanvas.clientHeight || this.displayCanvas.offsetHeight
        
        this.displayCanvas.width  = cssWidth 
        this.displayCanvas.height = cssHeight
        
        const pixelWidth  = this.displayCanvas.width
        const pixelHeight = this.displayCanvas.height
        
        if (!this.hasBeenInitialized) {
            this.hasBeenInitialized = true
            this.originX = (pixelWidth / 2 - this.width * this.scale / 2) / this.scale
            this.originY = (pixelHeight / 2 - this.height * this.scale / 2) / this.scale
        } else {
            // Calculate what bitmap point is currently at the center of the old display
            const centerDisplayX = oldWidth / 2
            const centerDisplayY = oldHeight / 2
            const centerBitmapX  = (centerDisplayX - this.originX * this.scale) / this.scale
            const centerBitmapY  = (centerDisplayY - this.originY * this.scale) / this.scale
            
            // Adjust origin so the same bitmap point is at the new center (scale remains constant)
            const newCenterDisplayX = pixelWidth / 2
            const newCenterDisplayY = pixelHeight / 2
            this.originX            = (newCenterDisplayX - centerBitmapX * this.scale) / this.scale
            this.originY            = (newCenterDisplayY - centerBitmapY * this.scale) / this.scale
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
            this.zoom(newScale)
            this.render()
        }
    }

    private zoom(scale: number): void {
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
        const rect          = this.displayCanvas.getBoundingClientRect()
        const canvasX       = e.clientX - rect.left
        const canvasY       = e.clientY - rect.top
        const isInteracting = this.leftMouseButtonDown || this.rightMouseButtonDown
        if (!isInteracting) {
            this.mouseX = canvasX
            this.mouseY = canvasY
            this.displayMousePositionWithCoords(canvasX, canvasY)
        }
    }

    private displayMousePosition(): void {
        this.displayMousePositionWithCoords(this.mouseX, this.mouseY)
    }

    private displayMousePositionWithCoords(x: number, y: number): void {
        const bitmapX                           = this.displayToBitmapX(x)
        const bitmapY                           = this.displayToBitmapY(y)
        this.mousePositionContainer.textContent = `x: ${bitmapX}, y: ${bitmapY}` 
    }
 
    private render(): void {
        const canvasWidth  = this.displayCanvas.width
        const canvasHeight = this.displayCanvas.height
        this.displayCtx.clearRect(0, 0, canvasWidth, canvasHeight)
 
        const x                               = this.originX * this.scale
        const y                               = this.originY * this.scale
        this.displayCtx.imageSmoothingEnabled = false

        this.offscreenCtx.imageSmoothingEnabled = false
        
        if (this.checkeredBackgroundPattern) {
            this.offscreenCtx.fillStyle = this.checkeredBackgroundPattern
            this.offscreenCtx.fillRect(0, 0, this.width, this.height)
        } else {
            // Fallback: fill with white if pattern hasn't loaded yet
            this.offscreenCtx.fillStyle = '#ffffff'
            this.offscreenCtx.fillRect(0, 0, this.width, this.height)
        }

        for (const layer of this.layers) {
            this.offscreenCtx.drawImage(layer.canvas, 0, 0)
        }


        this.displayCtx.drawImage(this.offscreenCanvas, x, y, this.width * this.scale, this.height * this.scale)
    }
}