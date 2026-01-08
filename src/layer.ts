import type { RGBColor } from './colors.js'
import PixelShader from './pixel_shader.js'

export default class Layer {
    public canvas: OffscreenCanvas
    public ctx: OffscreenCanvasRenderingContext2D

    private width: number
    private height: number
    private visible: boolean
    private opacity: number

    constructor(width: number, height: number) {
        this.visible   = true
        this.opacity   = 1
        this.width     = width
        this.height    = height
        this.canvas    = new OffscreenCanvas(this.width, this.height)
        this.ctx       = this.canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D

        this.ctx.clearRect(0, 0, this.width, this.height)
    }

    setPixel(x: number, y: number, color: RGBColor) {
        this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`
        this.ctx.fillRect(x, y, 1, 1)
    }
    
    getPixel(x: number, y: number): RGBColor {
        const imageData = this.ctx.getImageData(x, y, 1, 1)
        return {
            r: imageData.data[0]!,
            g: imageData.data[1]!,
            b: imageData.data[2]!,
            a: imageData.data[3]!
        }
    }

    executePixelShader(shader: PixelShader) {
        
    }
}