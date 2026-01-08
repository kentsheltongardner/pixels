import PixelShader from './pixel_shader.js';
export default class Layer {
    canvas;
    ctx;
    width;
    height;
    visible;
    opacity;
    constructor(width, height) {
        this.visible = true;
        this.opacity = 1;
        this.width = width;
        this.height = height;
        this.canvas = new OffscreenCanvas(this.width, this.height);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    setPixel(x, y, color) {
        this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
        this.ctx.fillRect(x, y, 1, 1);
    }
    getPixel(x, y) {
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        return {
            r: imageData.data[0],
            g: imageData.data[1],
            b: imageData.data[2],
            a: imageData.data[3]
        };
    }
    executePixelShader(shader) {
    }
}
//# sourceMappingURL=layer.js.map