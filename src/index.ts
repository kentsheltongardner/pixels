import ColorPicker from './color_picker.js'
import EditorCanvas from './editor_canvas.js'
import ToolPicker from './tool_picker.js'
import Palette from './palette.js'

document.addEventListener('DOMContentLoaded', () => {
    const toolPicker = new ToolPicker()
    const palette = new Palette()
    const colorPicker = new ColorPicker(palette)
    const editorCanvas = new EditorCanvas(colorPicker)

    const containers = document.querySelectorAll('.container')
    
    const updateExpandedHeights = () => {
        for (const container of containers) {
            if (container.classList.contains('expanded')) {
                const content = container.querySelector('.container-content') as HTMLElement
                if (content) {
                    content.style.maxHeight = content.scrollHeight + 'px'
                }
            }
        }
    }

    for (const container of containers) {
        const title = container.querySelector('.container-title')!
        const content = container.querySelector('.container-content') as HTMLElement

        if (container.classList.contains('expanded')) {
            content.style.maxHeight = content.scrollHeight + 'px'
        }
        
        title.addEventListener('click', () => {
            if (container.classList.contains('expanded')) {
                container.classList.remove('expanded')
                content.style.maxHeight = '0px'
            } else {
                container.classList.add('expanded')
                content.style.maxHeight = content.scrollHeight + 'px'
            }
        })
    }

    // Recalculate heights when window is resized
    window.addEventListener('resize', updateExpandedHeights)
    
    // Recalculate heights when page becomes visible (handles tab switching, etc.)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Use setTimeout to ensure layout has updated
            setTimeout(updateExpandedHeights, 0)
        }
    })
    
    // Use ResizeObserver for more accurate detection of layout changes
    const resizeObserver = new ResizeObserver(() => {
        updateExpandedHeights()
    })
    
    // Observe the main overlay container for layout changes
    const mainOverlay = document.getElementById('main-overlay')
    if (mainOverlay) {
        resizeObserver.observe(mainOverlay)
    }
})