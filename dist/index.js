import ColorPickerManager from './managers/color_picker_manager.js';
import ToolManager from './managers/tool_manager.js';
import PaletteManager from './managers/palette_manager.js';
import InputManager from './managers/input_manager.js';
import CanvasManager from './managers/canvas_manager.js';
document.addEventListener('DOMContentLoaded', () => {
    const paletteManager = new PaletteManager();
    const colorPickerManager = new ColorPickerManager(paletteManager);
    const canvasManager = new CanvasManager(colorPickerManager);
    const toolContext = {
        canvasManager: canvasManager,
        colorPickerManager: colorPickerManager
    };
    const toolManager = new ToolManager(toolContext);
    const inputManager = new InputManager(canvasManager, toolManager, colorPickerManager);
    const containers = document.querySelectorAll('.container');
    const updateExpandedHeights = () => {
        for (const container of containers) {
            if (container.classList.contains('expanded')) {
                const content = container.querySelector('.container-content');
                if (content) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            }
        }
    };
    for (const container of containers) {
        const title = container.querySelector('.container-title');
        const content = container.querySelector('.container-content');
        if (container.classList.contains('expanded')) {
            content.style.maxHeight = content.scrollHeight + 'px';
        }
        title.addEventListener('click', () => {
            if (container.classList.contains('expanded')) {
                container.classList.remove('expanded');
                content.style.maxHeight = '0px';
            }
            else {
                container.classList.add('expanded');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    }
    window.addEventListener('resize', updateExpandedHeights);
});
//# sourceMappingURL=index.js.map