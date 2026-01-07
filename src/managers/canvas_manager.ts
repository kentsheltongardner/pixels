// When doing shaders, have a triangle that encompasses the entire offscreen canvas to avoid edge artifacts

// Make all changes through ImageData (CPU)
// When we want to use a shader, upload the ImageData as a texture to a WebGL / OffscreenCanvas WebGL context
// Run the shader to produce a new texture
// Download the texture back into ImageData (via readPixels or drawImage -> getImageData)
// Commit back to the 2D canvas for display/compositing

import Layer from '../layer.js'
import ColorPicker from './color_picker_manager.js'
import type { RGBColor } from '../colors.js'
import type ToolManager from './tool_manager.js'

const DEFAULT_WIDTH = 256
const DEFAULT_HEIGHT = 256 

export default class CanvasManager {
    private width: number
    private height: number
    private originX: number = 0
    private originY: number = 0
    private hasBeenInitialized: boolean = false
    private scale: number
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
    }

    public getScale(): number {
        return this.scale
    }

    public getOriginX(): number {
        return this.originX
    }

    public getOriginY(): number {
        return this.originY
    }

    public getDisplayCanvas(): HTMLCanvasElement {
        return this.displayCanvas
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

    public selectColorAtPosition(mouseX: number, mouseY: number, button: number): void {
        const x = this.displayToBitmapX(mouseX)
        const y = this.displayToBitmapY(mouseY)
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return
        }
        const topLayer = this.layers[this.layers.length - 1] as Layer
        const color = topLayer.getPixel(x, y)
        if (button === 0) {
            this.colorPicker.primaryColor = color
            this.colorPicker.selectPrimaryColor()
        } else if (button === 2) {
            this.colorPicker.secondaryColor = color
            this.colorPicker.selectSecondaryColor()
        }
    }

    public drawPixelAtPosition(mouseX: number, mouseY: number, color: RGBColor): void {
        const x = this.displayToBitmapX(mouseX)
        if (x < 0 || x >= this.width) {
            return
        }
        const y = this.displayToBitmapY(mouseY)
        if (y < 0 || y >= this.height) {
            return
        }
        const topLayer = this.layers[this.layers.length - 1] as Layer
        topLayer.setPixel(x, y, color)
        topLayer.commitEdits()
        this.render()
    }

    public pan(deltaX: number, deltaY: number): void {
        this.originX += deltaX
        this.originY += deltaY
        this.render()
    }

    public updateMousePosition(mouseX: number, mouseY: number): void {
        this.displayMousePositionWithCoords(mouseX, mouseY)
    }

    public zoomAtPosition(scale: number, mouseX: number, mouseY: number): void {
        const canvasX = (mouseX - this.originX * this.scale) / this.scale
        const canvasY = (mouseY - this.originY * this.scale) / this.scale
        this.scale    = scale
        this.originX  = (mouseX - canvasX * this.scale) / this.scale
        this.originY  = (mouseY - canvasY * this.scale) / this.scale
        this.render()
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

    public handleResize(): void {
        this.updateCanvasSize()
        this.render()
    }

    public getPrimaryColor(): RGBColor {
        return this.colorPicker.primaryColor
    }

    public getSecondaryColor(): RGBColor {
        return this.colorPicker.secondaryColor
    }

    public displayToBitmapX(displayX: number): number {
        return Math.floor((displayX - this.originX * this.scale) / this.scale)
    }

    public displayToBitmapY(displayY: number): number {
        return Math.floor((displayY - this.originY * this.scale) / this.scale)
    }

    public drawRectangle(startX: number, startY: number, endX: number, endY: number, color: RGBColor): void {
        const topLayer = this.layers[this.layers.length - 1] as Layer
        const topContext = topLayer.ctx
        topContext.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`
        topContext.fillRect(startX, startY, endX - startX, endY - startY)
        this.render()
    }

    private displayMousePositionWithCoords(x: number, y: number): void {
        const bitmapX                           = this.displayToBitmapX(x)
        const bitmapY                           = this.displayToBitmapY(y)
        this.mousePositionContainer.textContent = `x: ${bitmapX}, y: ${bitmapY}` 
    }
 
    public render(): void {
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