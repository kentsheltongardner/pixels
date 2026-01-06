import type { RGBColor } from './colors.js';
import PixelShader from './pixel_shader.js';
export default class Layer {
    canvas: OffscreenCanvas;
    private imageData;
    private width;
    private height;
    private ctx;
    private visible;
    private opacity;
    constructor(width: number, height: number);
    setPixel(x: number, y: number, color: RGBColor): void;
    runPixelShader(shader: PixelShader): void;
    commitEdits(): void;
}
//# sourceMappingURL=layer.d.ts.map