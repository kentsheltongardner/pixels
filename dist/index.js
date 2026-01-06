import ColorPicker from './color_picker.js';
import EditorCanvas from './editor_canvas.js';
import ToolPicker from './tool_picker.js';
import Palette from './palette.js';
document.addEventListener('DOMContentLoaded', () => {
    const toolPicker = new ToolPicker();
    const palette = new Palette();
    const colorPicker = new ColorPicker(palette);
    const editorCanvas = new EditorCanvas(colorPicker);
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