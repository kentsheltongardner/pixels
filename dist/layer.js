import PixelShader from './pixel_shader.js';
export default class Layer {
    canvas;
    imageData;
    width;
    height;
    ctx;
    visible;
    opacity;
    constructor(width, height) {
        this.visible = true;
        this.opacity = 1;
        this.width = width;
        this.height = height;
        this.imageData = new ImageData(this.width, this.height);
        this.canvas = new OffscreenCanvas(this.width, this.height);
        this.ctx = this.canvas.getContext('2d');
        this.imageData.data.fill(0);
        this.commitEdits();
    }
    setPixel(x, y, color) {
        this.imageData.data[y * this.width * 4 + x * 4] = color.r;
        this.imageData.data[y * this.width * 4 + x * 4 + 1] = color.g;
        this.imageData.data[y * this.width * 4 + x * 4 + 2] = color.b;
        this.imageData.data[y * this.width * 4 + x * 4 + 3] = color.a;
    }
    runPixelShader(shader) {
    }
    commitEdits() {
        this.ctx.putImageData(this.imageData, 0, 0);
    }
}
//# sourceMappingURL=layer.js.map