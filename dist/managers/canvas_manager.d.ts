import ColorPicker from './color_picker_manager.js';
import type { RGBColor } from '../colors.js';
export default class CanvasManager {
    private width;
    private height;
    private originX;
    private originY;
    private hasBeenInitialized;
    private scale;
    private colorPicker;
    private offscreenCanvas;
    private displayCanvas;
    private displayCtx;
    private offscreenCtx;
    private mousePositionContainer;
    private layers;
    private checkeredBackgroundPattern;
    constructor(colorPicker: ColorPicker);
    getScale(): number;
    getOriginX(): number;
    getOriginY(): number;
    getDisplayCanvas(): HTMLCanvasElement;
    private loadCheckeredBackground;
    selectColorAtPosition(mouseX: number, mouseY: number, button: number): void;
    drawPixelAtPosition(mouseX: number, mouseY: number, color: RGBColor): void;
    pan(deltaX: number, deltaY: number): void;
    updateMousePosition(mouseX: number, mouseY: number): void;
    zoomAtPosition(scale: number, mouseX: number, mouseY: number): void;
    private updateCanvasSize;
    handleResize(): void;
    getPrimaryColor(): RGBColor;
    getSecondaryColor(): RGBColor;
    displayToBitmapX(displayX: number): number;
    displayToBitmapY(displayY: number): number;
    drawRectangle(startX: number, startY: number, endX: number, endY: number, color: RGBColor): void;
    private displayMousePositionWithCoords;
    render(): void;
}
//# sourceMappingURL=canvas_manager.d.ts.map