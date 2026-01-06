import type { RGBColor } from './colors.js'
import PixelShader from './pixel_shader.js'

export default class Layer {
    public canvas: OffscreenCanvas

    private imageData: ImageData


    private width: number
    private height: number

    private ctx: OffscreenCanvasRenderingContext2D
    private visible: boolean
    private opacity: number

    constructor(width: number, height: number) {
        this.visible   = true
        this.opacity   = 1
        this.width     = width
        this.height    = height
        this.imageData = new ImageData(this.width, this.height)
        this.canvas    = new OffscreenCanvas(this.width, this.height)
        this.ctx       = this.canvas.getContext('2d') as OffscreenCanvasRenderingContext2D

        this.imageData.data.fill(255)
        this.commitEdits()
    }

    setPixel(x: number, y: number, color: RGBColor) {
        this.imageData.data[y * this.width * 4 + x * 4] = color.r
        this.imageData.data[y * this.width * 4 + x * 4 + 1] = color.g
        this.imageData.data[y * this.width * 4 + x * 4 + 2] = color.b
        this.imageData.data[y * this.width * 4 + x * 4 + 3] = 255
    }

    runPixelShader(shader: PixelShader) {
        
    }

    commitEdits() {
        this.ctx.putImageData(this.imageData, 0, 0)
    }
}