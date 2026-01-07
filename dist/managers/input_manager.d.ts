import type CanvasManager from './canvas_manager.js';
import type ToolManager from './tool_manager.js';
import type ColorPickerManager from './color_picker_manager.js';
export default class InputManager {
    private canvasManager;
    private toolManager;
    private colorPickerManager;
    private mouseX;
    private mouseY;
    private leftMouseButtonDown;
    private rightMouseButtonDown;
    private spaceKeyPressed;
    constructor(canvasManager: CanvasManager, toolManager: ToolManager, colorPickerManager: ColorPickerManager);
    private handlePointerDown;
    private handlePointerMove;
    private handlePointerUp;
    private handleKeyDown;
    private handleKeyUp;
    private handleWheel;
    private handleResize;
}
//# sourceMappingURL=input_manager.d.ts.map