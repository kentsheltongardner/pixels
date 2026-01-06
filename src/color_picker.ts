import type { RGBColor, HSVColor } from './colors.js'
import type Palette from './palette.js'

export default class ColorPicker {
    // ============================================================================
    // Color State
    // ============================================================================
    public primaryColor: RGBColor = { r: 0, g: 0, b: 0, a: 255 }
    public secondaryColor: RGBColor = { r: 0, g: 0, b: 0, a: 255 }
    private activeColor: RGBColor = this.primaryColor
    private currentHue: number = 0

    // ============================================================================
    // DOM Element References
    // ============================================================================
    private primarySelector: HTMLDivElement
    private secondarySelector: HTMLDivElement
    private primaryIndicator: HTMLDivElement
    private secondaryIndicator: HTMLDivElement
    private sliderR: HTMLInputElement
    private sliderG: HTMLInputElement
    private sliderB: HTMLInputElement
    private sliderA: HTMLInputElement
    private inputR: HTMLInputElement
    private inputG: HTMLInputElement
    private inputB: HTMLInputElement
    private inputA: HTMLInputElement
    private hexInput: HTMLInputElement
    private hexCopyIcon: HTMLImageElement
    private colorPickerCanvas: HTMLCanvasElement
    private colorPickerCtx: CanvasRenderingContext2D
    private hueSlider: HTMLInputElement
    private paletteSelector: HTMLDivElement

    // ============================================================================
    // Drag State
    // ============================================================================
    private isDraggingPalette: boolean = false
    private documentPaletteMouseMoveHandler: ((e: MouseEvent) => void) | null = null
    private documentPaletteMouseUpHandler: (() => void) | null = null

    private palette: Palette

    constructor(palette: Palette) {
        this.palette = palette

        // Initialize DOM element references
        this.primarySelector    = document.getElementById('primary-selector') as HTMLDivElement
        this.secondarySelector  = document.getElementById('secondary-selector') as HTMLDivElement
        this.primaryIndicator   = document.getElementById('primary-selector-indicator') as HTMLDivElement
        this.secondaryIndicator = document.getElementById('secondary-selector-indicator') as HTMLDivElement
        this.sliderR            = document.getElementById('red-slider') as HTMLInputElement
        this.sliderG            = document.getElementById('green-slider') as HTMLInputElement
        this.sliderB            = document.getElementById('blue-slider') as HTMLInputElement
        this.sliderA            = document.getElementById('opacity-slider') as HTMLInputElement
        this.inputR             = document.getElementById('red-input') as HTMLInputElement
        this.inputG             = document.getElementById('green-input') as HTMLInputElement
        this.inputB             = document.getElementById('blue-input') as HTMLInputElement
        this.inputA             = document.getElementById('opacity-input') as HTMLInputElement
        this.hexInput           = document.getElementById('hex-input') as HTMLInputElement
        this.hexCopyIcon        = document.getElementById('hex-copy-icon') as HTMLImageElement
        this.colorPickerCanvas  = document.getElementById('color-picker-canvas') as HTMLCanvasElement
        this.hueSlider          = document.getElementById('hue-slider') as HTMLInputElement
        this.paletteSelector    = document.getElementById('palette-selector') as HTMLDivElement

        this.colorPickerCtx     = this.colorPickerCanvas.getContext('2d') as CanvasRenderingContext2D

        // Setup event listeners
        this.addEventListeners()

        // Initialize UI
        this.resetCanvases()
        this.updateUI()

        // Setup resize observers
        this.setupResizeObservers()
    }

    // ============================================================================
    // Color Conversion Utilities
    // ============================================================================

    private rgbToHSV(r: number, g: number, b: number, a: number): HSVColor {
        r /= 255
        g /= 255
        b /= 255
        a /= 255

        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const v   = max
        const d   = max - min
        const s   = max === 0 ? 0 : d / max

        let h = 0
        if (max !== min) {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
            }
        }

        return { h, s, v, a }
    }

    private hsvToRGB(h: number, s: number, v: number): RGBColor {
        const i = Math.floor(h * 6)
        const f = h * 6 - i
        const p = v * (1 - s)
        const q = v * (1 - f * s)
        const t = v * (1 - (1 - f) * s)

        let r: number, g: number, b: number
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break
            case 1: r = q; g = v; b = p; break
            case 2: r = p; g = v; b = t; break
            case 3: r = p; g = q; b = v; break
            case 4: r = t; g = p; b = v; break
            case 5: r = v; g = p; b = q; break
            default: r = 0; g = 0; b = 0
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
            a: 255
        }
    }

    private channelToHex(value: string): string {
        return parseInt(value).toString(16).padStart(2, '0').toUpperCase()
    }

    private rgbToHex(r: string, g: string, b: string): string {
        return `${this.channelToHex(r)}${this.channelToHex(g)}${this.channelToHex(b)}`
    }

    private rgbToCSSColor(color: RGBColor): string {
        const alpha = color.a / 255
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
    }

    private rgbToCSSColorOpaque(color: RGBColor): string {
        return `rgb(${color.r}, ${color.g}, ${color.b})`
    }

    // ============================================================================
    // Color State Management
    // ============================================================================

    private getCurrentHSV(): HSVColor {
        const r = this.activeColor.r
        const g = this.activeColor.g
        const b = this.activeColor.b
        const a = this.activeColor.a
        return this.rgbToHSV(r, g, b, a)
    }

    private updateHueAndPaletteFromRGB(): void {
        const r   = this.activeColor.r
        const g   = this.activeColor.g
        const b   = this.activeColor.b
        const a   = this.activeColor.a
        const hsv = this.rgbToHSV(r, g, b, a)
        if (hsv.s > 0) {
            this.currentHue = hsv.h
        }
    }

    // ============================================================================
    // UI Update Methods
    // ============================================================================

    private updateUI(updateCanvases: boolean = true): void {
        // Update hue and palette positions from current RGB (only if not from canvas selection)
        if (updateCanvases) {
            this.updateHueAndPaletteFromRGB()
        }

        const r = this.activeColor.r.toString()
        const g = this.activeColor.g.toString()
        const b = this.activeColor.b.toString()
        const a = this.activeColor.a.toString()

        this.inputR.value   = r
        this.inputG.value   = g
        this.inputB.value   = b
        this.inputA.value   = a
        this.sliderR.value  = r
        this.sliderG.value  = g
        this.sliderB.value  = b
        this.sliderA.value  = a
        this.hexInput.value = this.rgbToHex(r, g, b)
        
        // Only update canvases and selector positions if requested (skip when update comes from canvas selection)
        if (updateCanvases) {
            this.updateColorPickerCanvas()
            this.updatePaletteSelectorPosition()
            this.updateHueSliderValue()
        }
        
        // Always update color swatches and opacity slider gradient
        this.updateColorSwatches()
        this.updateOpacitySliderGradient()
    }

    private updateColorSwatches(): void {
        this.primarySelector.style.backgroundColor   = this.rgbToCSSColor(this.primaryColor)
        this.secondarySelector.style.backgroundColor = this.rgbToCSSColor(this.secondaryColor)
        
        // Update text color for active selector (indicators updated only when switching active color)
        if (this.activeColor === this.primaryColor) {
            const color = this.primaryColor.r > 128 ? '#000' : '#fff'
            this.primarySelector.style.color = color
            this.primaryIndicator.style.backgroundColor = color
        } else if (this.activeColor === this.secondaryColor) {
            const color = this.secondaryColor.r > 128 ? '#000' : '#fff'
            this.secondarySelector.style.color = color
            this.secondaryIndicator.style.backgroundColor = color
        }
    }

    private updateOpacitySliderGradient(): void {
        const r = this.activeColor.r
        const g = this.activeColor.g
        const b = this.activeColor.b
        const gradient = `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1)), var(--checkered-background)`
        
        // Apply to all vendor-specific pseudo-elements using a style element
        const styleId = 'opacity-slider-gradient-style'
        let style = document.getElementById(styleId) as HTMLStyleElement
        
        if (!style) {
            style = document.createElement('style')
            style.id = styleId
            document.head.appendChild(style)
        }
        
        style.textContent = `
            #opacity-slider::-webkit-slider-runnable-track {
                background: linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1)), var(--checkered-background);
                background-position: var(--opacity-slider-background-position);
                background-size: var(--opacity-slider-background-size);
                background-repeat: var(--opacity-slider-background-repeat);
            }
            #opacity-slider::-moz-range-track {
                background: linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1)), var(--checkered-background);
                background-position: var(--opacity-slider-background-position);
                background-size: var(--opacity-slider-background-size);
                background-repeat: var(--opacity-slider-background-repeat);
            }
            #opacity-slider::-ms-track {
                background: linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1)), var(--checkered-background);
                background-position: var(--opacity-slider-background-position);
                background-size: var(--opacity-slider-background-size);
                background-repeat: var(--opacity-slider-background-repeat);
            }
        `
    }

    // ============================================================================
    // Canvas Rendering
    // ============================================================================

    private resetCanvases(): void {
        this.colorPickerCanvas.width  = this.colorPickerCanvas.offsetWidth
        this.colorPickerCanvas.height = this.colorPickerCanvas.offsetHeight
    }

    private updateColorPickerCanvas(): void {
        // Ensure canvas is properly sized
        if (this.colorPickerCanvas.width === 0 || this.colorPickerCanvas.height === 0) {
            this.resetCanvases()
        }
        
        const width     = this.colorPickerCanvas.width
        const height    = this.colorPickerCanvas.height
        
        if (width === 0 || height === 0) {
            return
        }
        
        const imageData = this.colorPickerCtx.createImageData(width, height)
        const data      = imageData.data

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const saturation = x / width
                const value      = 1 - (y / height)
                const color      = this.hsvToRGB(this.currentHue, saturation, value)
                const index      = (y * width + x) * 4
                data[index]      = color.r
                data[index + 1]  = color.g
                data[index + 2]  = color.b
                data[index + 3]  = 255
            }
        }

        this.colorPickerCtx.putImageData(imageData, 0, 0)
    }

    private updateHueSliderValue(): void {
        // Convert hue from 0-1 range to 0-360 degrees for the slider
        this.hueSlider.value = Math.round(this.currentHue * 360).toString()
    }

    private updatePaletteSelectorPosition(): void {
        const hsv = this.getCurrentHSV()
        const rect = this.colorPickerCanvas.getBoundingClientRect()
        const x = hsv.s * rect.width
        const y = (1 - hsv.v) * rect.height
        this.paletteSelector.style.left = `${x}px`
        this.paletteSelector.style.top = `${y}px`
        this.paletteSelector.style.boxShadow = hsv.v > 0.5 ? '0 0 2px #0008 inset' : '0 0 2px #fff8 inset'
        this.paletteSelector.style.backgroundColor = this.rgbToCSSColorOpaque(this.activeColor)
    }


    // ============================================================================
    // Input Handlers
    // ============================================================================

    private handleRGBInput(input: HTMLInputElement): void {
        if (input.value === '') return

        input.value = input.value.replace(/[^0-9]/g, '')
        const value = parseInt(input.value)
        
        if (value < 0) {
            input.value = '0'
        } else if (value > 255) {
            input.value = '255'
        }
    }

    private handleInputRSubmit(): void {
        if (this.inputR.value !== '') {
            this.activeColor.r = parseInt(this.inputR.value)
        }
        this.updateUI()
    }

    private handleInputGSubmit(): void {
        if (this.inputG.value !== '') {
            this.activeColor.g = parseInt(this.inputG.value)
        }
        this.updateUI()
    }

    private handleInputBSubmit(): void {
        if (this.inputB.value !== '') {
            this.activeColor.b = parseInt(this.inputB.value)
        }
        this.updateUI()
    }

    private handleInputASubmit(): void {
        if (this.inputA.value !== '') {
            this.activeColor.a = parseInt(this.inputA.value)
        }
        this.updateUI()
    }

    private handleHexInput(): void {
        if (this.hexInput.value.length > 6) {
            this.hexInput.value = this.hexInput.value.slice(0, 6)
        }
        this.hexInput.value = this.hexInput.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase()
    }

    private handleHexInputSubmit(): void {
        const value = this.hexInput.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase()
        this.hexInput.value = value
        if (value.length === 6) {
            const r = parseInt(value.slice(0, 2), 16)
            const g = parseInt(value.slice(2, 4), 16)
            const b = parseInt(value.slice(4, 6), 16)
            this.activeColor.r = r
            this.activeColor.g = g
            this.activeColor.b = b
        }
        this.updateUI()
    }

    private handleHexCopy(): void {
        navigator.clipboard.writeText('#' + this.hexInput.value)
    }

    // ============================================================================
    // Color Selection
    // ============================================================================

    private selectPrimaryColor(): void {
        this.primarySelector.classList.add('active')
        this.secondarySelector.classList.remove('active')
        this.activeColor = this.primaryColor
        // Update indicators when switching active color (not on every color update)
        if (this.primaryIndicator) {
            const color = this.primaryColor.r > 128 ? '#000' : '#fff'
            this.primaryIndicator.style.backgroundColor = color
        }
        if (this.secondaryIndicator) {
            this.secondaryIndicator.style.backgroundColor = 'transparent'
        }
        this.updateUI()
    }

    private selectSecondaryColor(): void {
        this.primarySelector.classList.remove('active')
        this.secondarySelector.classList.add('active')
        this.activeColor = this.secondaryColor
        // Update indicators when switching active color (not on every color update)
        if (this.secondaryIndicator) {
            const color = this.secondaryColor.r > 128 ? '#000' : '#fff'
            this.secondaryIndicator.style.backgroundColor = color
        }
        if (this.primaryIndicator) {
            this.primaryIndicator.style.backgroundColor = 'transparent'
        }
        this.updateUI()
    }

    // ============================================================================
    // Hue Slider Handler
    // ============================================================================

    private handleHueSlider(): void {
        // Convert slider value (0-360) to hue (0-1)
        const hueDegrees = parseInt(this.hueSlider.value)
        this.currentHue = hueDegrees / 360
        
        const hsv = this.getCurrentHSV()
        const rgb = this.hsvToRGB(this.currentHue, hsv.s, hsv.v)
        this.activeColor.r = rgb.r
        this.activeColor.g = rgb.g
        this.activeColor.b = rgb.b
        
        this.updateUI(false)
        this.updateColorPickerCanvas()
        this.updatePaletteSelectorPosition()
    }

    // ============================================================================
    // Canvas Interaction - Palette
    // ============================================================================

    private updatePaletteFromPosition(clientX: number, clientY: number): void {
        const rect                                 = this.colorPickerCanvas.getBoundingClientRect()
        const x                                    = clientX - rect.left
        const y                                    = clientY - rect.top
        const clampedX                             = Math.max(0, Math.min(rect.width, x))
        const clampedY                             = Math.max(0, Math.min(rect.height, y))
        this.paletteSelector.style.left            = `${Math.round(clampedX)}px`
        this.paletteSelector.style.top             = `${Math.round(clampedY)}px`
        const saturation                           = Math.max(0, Math.min(1, clampedX / rect.width))
        const value                                = Math.max(0, Math.min(1, 1 - (clampedY / rect.height)))
        this.paletteSelector.style.boxShadow       = value > 0.5 ? '0 0 2px #0008 inset' : '0 0 2px #fff8 inset'
        const rgb                                  = this.hsvToRGB(this.currentHue, saturation, value)
        this.activeColor.r                         = rgb.r
        this.activeColor.g                         = rgb.g
        this.activeColor.b                         = rgb.b
        this.paletteSelector.style.backgroundColor = this.rgbToCSSColorOpaque(rgb)
        this.updateUI(false)
    }


    private startPaletteDrag(e: MouseEvent): void {
        e.preventDefault()
        this.isDraggingPalette = true
        
        this.documentPaletteMouseMoveHandler = (e: MouseEvent) => {
            if (this.isDraggingPalette) {
                // Only update the currently active color
                this.updatePaletteFromPosition(e.clientX, e.clientY)
            }
        }
        
        this.documentPaletteMouseUpHandler = () => {
            this.stopPaletteDrag()
        }
        
        document.addEventListener('mousemove', this.documentPaletteMouseMoveHandler)
        document.addEventListener('mouseup', this.documentPaletteMouseUpHandler)
    }

    private stopPaletteDrag(): void {
        this.isDraggingPalette = false
        
        if (this.documentPaletteMouseMoveHandler) {
            document.removeEventListener('mousemove', this.documentPaletteMouseMoveHandler)
            this.documentPaletteMouseMoveHandler = null
        }
        
        if (this.documentPaletteMouseUpHandler) {
            document.removeEventListener('mouseup', this.documentPaletteMouseUpHandler)
            this.documentPaletteMouseUpHandler = null
        }
    }

    // ============================================================================
    // Event Listener Setup
    // ============================================================================

    private addEventListeners(): void {
        // Slider updates
        this.sliderR.addEventListener('input', () => {
            this.activeColor.r = parseInt(this.sliderR.value)
            this.updateUI()
        })
        this.sliderG.addEventListener('input', () => {
            this.activeColor.g = parseInt(this.sliderG.value)
            this.updateUI()
        })
        this.sliderB.addEventListener('input', () => {
            this.activeColor.b = parseInt(this.sliderB.value)
            this.updateUI()
        })
        this.sliderA.addEventListener('input', () => {
            this.activeColor.a = parseInt(this.sliderA.value)
            this.updateUI()
        })

        // RGB input handlers
        this.inputR.addEventListener('input', () => this.handleRGBInput(this.inputR))
        this.inputG.addEventListener('input', () => this.handleRGBInput(this.inputG))
        this.inputB.addEventListener('input', () => this.handleRGBInput(this.inputB))
        this.inputA.addEventListener('input', () => this.handleRGBInput(this.inputA))

        this.inputR.addEventListener('change', () => this.handleInputRSubmit())
        this.inputG.addEventListener('change', () => this.handleInputGSubmit())
        this.inputB.addEventListener('change', () => this.handleInputBSubmit())
        this.inputA.addEventListener('change', () => this.handleInputASubmit())

        this.inputR.addEventListener('blur', () => this.handleInputRSubmit())
        this.inputG.addEventListener('blur', () => this.handleInputGSubmit())
        this.inputB.addEventListener('blur', () => this.handleInputBSubmit())
        this.inputA.addEventListener('blur', () => this.handleInputASubmit())

        // Hex input handlers
        this.hexInput.addEventListener('input', () => this.handleHexInput())
        this.hexInput.addEventListener('change', () => this.handleHexInputSubmit())
        this.hexInput.addEventListener('blur', () => this.handleHexInputSubmit())

        this.hexCopyIcon.addEventListener('click', () => this.handleHexCopy())


        this.primarySelector.addEventListener('click', () => this.selectPrimaryColor())
        this.secondarySelector.addEventListener('click', () => this.selectSecondaryColor())

        // Hue slider
        this.hueSlider.addEventListener('input', () => this.handleHueSlider())

        // Canvas interactions
        this.colorPickerCanvas.addEventListener('mousedown', e => {
            // Only update the currently active color
            this.updatePaletteFromPosition(e.clientX, e.clientY)
            this.startPaletteDrag(e)
        })
        this.colorPickerCanvas.addEventListener('contextmenu', e => e.preventDefault())
        this.colorPickerCanvas.addEventListener('click', e => {
            // Only update the currently active color
            this.updatePaletteFromPosition(e.clientX, e.clientY)
        })

        // Palette selector drag handling
        this.paletteSelector.addEventListener('mousedown', e => {
            e.preventDefault()
            e.stopPropagation()
            // Only update the currently active color
            this.updatePaletteFromPosition(e.clientX, e.clientY)
            this.startPaletteDrag(e)
        })
        this.paletteSelector.addEventListener('contextmenu', e => e.preventDefault())
    }

    private setupResizeObservers(): void {
        window.addEventListener('resize', () => {
            this.resetCanvases()
            this.updateColorPickerCanvas()
            this.updatePaletteSelectorPosition()
        })

        const resizeObserver = new ResizeObserver(() => {
            this.resetCanvases()
            this.updateColorPickerCanvas()
            this.updatePaletteSelectorPosition()
        })

        const colorPickerContainer = this.colorPickerCanvas.parentElement
        if (colorPickerContainer) {
            resizeObserver.observe(colorPickerContainer)
        }
        resizeObserver.observe(this.colorPickerCanvas)
    }
}