import type { RGBColor } from './colors.js';
import PixelShader from './pixel_shader.js';
export default class Layer {
    canvas: OffscreenCanvas;
    ctx: OffscreenCanvasRenderingContext2D;
    private width;
    private height;
    private visible;
    private opacity;
    constructor(width: number, height: number);
    setPixel(x: number, y: number, color: RGBColor): void;
    getPixel(x: number, y: number): RGBColor;
    executePixelShader(shader: PixelShader): void;
}
//# sourceMappingURL=layer.d.ts.map