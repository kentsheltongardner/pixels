export default class ColorPicker {
    palette;
    // Colors
    primaryColor = { r: 0, g: 0, b: 0, a: 255 };
    secondaryColor = { r: 255, g: 255, b: 255, a: 255 };
    activeColor = this.primaryColor;
    // DOM elements
    primarySelector;
    secondarySelector;
    primaryIndicator;
    secondaryIndicator;
    sliderR;
    sliderG;
    sliderB;
    sliderA;
    inputR;
    inputG;
    inputB;
    inputA;
    hexInput;
    hexCopyIcon;
    colorPickerCanvas;
    colorPickerCtx;
    hueSlider;
    paletteSelector;
    colorPickerDragging;
    constructor(palette) {
        this.palette = palette;
        this.primarySelector = document.getElementById('primary-selector');
        this.secondarySelector = document.getElementById('secondary-selector');
        this.primaryIndicator = document.getElementById('primary-selector-indicator');
        this.secondaryIndicator = document.getElementById('secondary-selector-indicator');
        this.sliderR = document.getElementById('red-slider');
        this.sliderG = document.getElementById('green-slider');
        this.sliderB = document.getElementById('blue-slider');
        this.sliderA = document.getElementById('opacity-slider');
        this.inputR = document.getElementById('red-input');
        this.inputG = document.getElementById('green-input');
        this.inputB = document.getElementById('blue-input');
        this.inputA = document.getElementById('opacity-input');
        this.hexInput = document.getElementById('hex-input');
        this.hexCopyIcon = document.getElementById('hex-copy-icon');
        this.colorPickerCanvas = document.getElementById('color-picker-canvas');
        this.hueSlider = document.getElementById('hue-slider');
        this.paletteSelector = document.getElementById('palette-selector');
        this.colorPickerCtx = this.colorPickerCanvas.getContext('2d');
        this.colorPickerDragging = false;
        this.addEventListeners();
        this.resetColorPickerCanvas();
        this.updateUI();
        this.setupResizeObservers();
    }
    // Color conversion
    // Adapted from Foley and van Dam algorithm
    // https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB
    rgbToHSV(r, g, b, a) {
        r /= 255;
        g /= 255;
        b /= 255;
        a /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const v = max;
        const d = max - min;
        const s = max === 0 ? 0 : d / max;
        let h = 0;
        if (max !== min) {
            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / d + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / d + 4) / 6;
                    break;
            }
        }
        return { h, s, v, a };
    }
    // Adapted from Foley and van Dam algorithm
    // https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV
    hsvToRGB(h, s, v) {
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        let r, g, b;
        switch (i % 6) {
            case 0:
                r = v;
                g = t;
                b = p;
                break;
            case 1:
                r = q;
                g = v;
                b = p;
                break;
            case 2:
                r = p;
                g = v;
                b = t;
                break;
            case 3:
                r = p;
                g = q;
                b = v;
                break;
            case 4:
                r = t;
                g = p;
                b = v;
                break;
            case 5:
                r = v;
                g = p;
                b = q;
                break;
            default:
                r = 0;
                g = 0;
                b = 0;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
            a: 255
        };
    }
    channelToHex(value) {
        return parseInt(value).toString(16).padStart(2, '0').toUpperCase();
    }
    rgbToHex(r, g, b) {
        return `${this.channelToHex(r)}${this.channelToHex(g)}${this.channelToHex(b)}`;
    }
    rgbToCSSColor(color) {
        const alpha = color.a / 255;
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    }
    rgbToCSSColorOpaque(color) {
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
    // Color state
    getCurrentHSV() {
        const r = this.activeColor.r;
        const g = this.activeColor.g;
        const b = this.activeColor.b;
        const a = this.activeColor.a;
        return this.rgbToHSV(r, g, b, a);
    }
    // UI update
    updateUI(updateCanvases = true) {
        const r = this.activeColor.r.toString();
        const g = this.activeColor.g.toString();
        const b = this.activeColor.b.toString();
        const a = this.activeColor.a.toString();
        this.inputR.value = this.sliderR.value = r;
        this.inputG.value = this.sliderG.value = g;
        this.inputB.value = this.sliderB.value = b;
        this.inputA.value = this.sliderA.value = a;
        this.hexInput.value = this.rgbToHex(r, g, b);
        if (updateCanvases) {
            this.updateHueSliderValue();
            this.updateColorPickerCanvas();
            this.updatePaletteSelectorPosition();
        }
        this.updateColorSelectors();
        this.updateOpacitySliderGradient();
    }
    updateColorSelector(selector, indicator, color) {
        selector.style.backgroundColor = this.rgbToCSSColor(color);
        const contrastColor = color.r > 128 ? '#000' : '#fff';
        selector.style.color = contrastColor;
        indicator.style.backgroundColor = contrastColor;
    }
    updateColorSelectors() {
        this.updateColorSelector(this.primarySelector, this.primaryIndicator, this.primaryColor);
        this.updateColorSelector(this.secondarySelector, this.secondaryIndicator, this.secondaryColor);
    }
    updateOpacitySliderGradient() {
        const r = this.activeColor.r;
        const g = this.activeColor.g;
        const b = this.activeColor.b;
        const styleId = 'opacity-slider-gradient-style';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
        const attributes = `
            background: linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1)), var(--checkered-background);
            background-position: var(--opacity-slider-background-position);
            background-size: var(--opacity-slider-background-size);
            background-repeat: var(--opacity-slider-background-repeat);
        `;
        style.textContent = `
            #opacity-slider::-webkit-slider-runnable-track {${attributes}}
            #opacity-slider::-moz-range-track {${attributes}}
            #opacity-slider::-ms-track {${attributes}}
        `;
    }
    resetColorPickerCanvas() {
        this.colorPickerCanvas.width = this.colorPickerCanvas.offsetWidth;
        this.colorPickerCanvas.height = this.colorPickerCanvas.offsetHeight;
    }
    updateColorPickerCanvas() {
        const width = this.colorPickerCanvas.width;
        const height = this.colorPickerCanvas.height;
        const imageData = this.colorPickerCtx.createImageData(width, height);
        const data = imageData.data;
        const max = parseInt(this.hueSlider.max);
        const hueDegrees = parseInt(this.hueSlider.value);
        const currentHue = hueDegrees / max;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const saturation = x / width;
                const value = 1 - (y / height);
                const color = this.hsvToRGB(currentHue, saturation, value);
                const index = (y * width + x) * 4;
                data[index] = color.r;
                data[index + 1] = color.g;
                data[index + 2] = color.b;
                data[index + 3] = 255;
            }
        }
        this.colorPickerCtx.putImageData(imageData, 0, 0);
    }
    updateHueSliderValue() {
        const max = parseInt(this.hueSlider.max);
        const currentHue = this.getCurrentHSV().h;
        this.hueSlider.value = Math.round(currentHue * max).toString();
    }
    updatePaletteSelectorPosition() {
        const hsv = this.getCurrentHSV();
        const rect = this.colorPickerCanvas.getBoundingClientRect();
        const x = hsv.s * rect.width;
        const y = (1 - hsv.v) * rect.height;
        this.paletteSelector.style.left = `${x}px`;
        this.paletteSelector.style.top = `${y}px`;
        this.paletteSelector.style.borderColor = hsv.v > 0.5 ? '#0008' : '#fff8';
        this.paletteSelector.style.backgroundColor = this.rgbToCSSColorOpaque(this.activeColor);
    }
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    // Input handlers
    handleChannelInput(input) {
        if (input.value === '')
            return;
        input.value = input.value.replace(/[^0-9]/g, '');
        const value = parseInt(input.value);
        input.value = this.clamp(value, 0, 255).toString();
    }
    handleChannelInputSubmit(input, channel) {
        if (input.value !== '') {
            this.activeColor[channel] = parseInt(input.value, 10);
        }
        this.updateUI();
    }
    handleChannelSliderInput(slider, channel) {
        this.activeColor[channel] = this.clamp(parseInt(slider.value), 0, 255);
        this.updateUI();
    }
    handleHexInput() {
        if (this.hexInput.value.length > 6) {
            this.hexInput.value = this.hexInput.value.slice(0, 6);
        }
        this.hexInput.value = this.hexInput.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    }
    handleHexInputSubmit() {
        const value = this.hexInput.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
        this.hexInput.value = value;
        if (value.length === 6) {
            const r = parseInt(value.slice(0, 2), 16);
            const g = parseInt(value.slice(2, 4), 16);
            const b = parseInt(value.slice(4, 6), 16);
            this.activeColor.r = r;
            this.activeColor.g = g;
            this.activeColor.b = b;
        }
        this.updateUI();
    }
    handleHexCopy() {
        navigator.clipboard.writeText('#' + this.hexInput.value);
    }
    selectPrimaryColor() {
        this.primaryIndicator.classList.add('active');
        this.secondaryIndicator.classList.remove('active');
        this.activeColor = this.primaryColor;
        this.updateUI();
    }
    selectSecondaryColor() {
        this.primaryIndicator.classList.remove('active');
        this.secondaryIndicator.classList.add('active');
        this.activeColor = this.secondaryColor;
        this.updateUI();
    }
    handleHueSliderInput() {
        const max = parseInt(this.hueSlider.max);
        const hueDegrees = parseInt(this.hueSlider.value);
        const currentHue = hueDegrees / max;
        const hsv = this.getCurrentHSV();
        const rgb = this.hsvToRGB(currentHue, hsv.s, hsv.v);
        this.activeColor.r = rgb.r;
        this.activeColor.g = rgb.g;
        this.activeColor.b = rgb.b;
        this.updateUI(false);
        this.updateColorPickerCanvas();
        this.updatePaletteSelectorPosition();
    }
    updatePaletteFromPosition(clientX, clientY) {
        const rect = this.colorPickerCanvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const clampedX = Math.max(0, Math.min(rect.width, x));
        const clampedY = Math.max(0, Math.min(rect.height, y));
        this.paletteSelector.style.left = `${Math.round(clampedX)}px`;
        this.paletteSelector.style.top = `${Math.round(clampedY)}px`;
        const saturation = Math.max(0, Math.min(1, clampedX / rect.width));
        const value = Math.max(0, Math.min(1, 1 - (clampedY / rect.height)));
        this.paletteSelector.style.borderColor = value > 0.5 ? '#0008' : '#fff8';
        const max = parseInt(this.hueSlider.max);
        const hueDegrees = parseInt(this.hueSlider.value);
        const currentHue = hueDegrees / max;
        const rgb = this.hsvToRGB(currentHue, saturation, value);
        this.activeColor.r = rgb.r;
        this.activeColor.g = rgb.g;
        this.activeColor.b = rgb.b;
        this.paletteSelector.style.backgroundColor = this.rgbToCSSColorOpaque(rgb);
        this.updateUI(false);
    }
    handleColorPickerPointerDown(e) {
        this.colorPickerCanvas.setPointerCapture(e.pointerId);
        this.updatePaletteFromPosition(e.clientX, e.clientY);
        this.colorPickerDragging = true;
    }
    handleColorPickerPointerMove(e) {
        if (this.colorPickerDragging) {
            this.updatePaletteFromPosition(e.clientX, e.clientY);
        }
    }
    handleColorPickerPointerUp(e) {
        this.colorPickerCanvas.releasePointerCapture(e.pointerId);
        this.colorPickerDragging = false;
    }
    addEventListeners() {
        this.sliderR.addEventListener('input', () => this.handleChannelSliderInput(this.sliderR, 'r'));
        this.sliderG.addEventListener('input', () => this.handleChannelSliderInput(this.sliderG, 'g'));
        this.sliderB.addEventListener('input', () => this.handleChannelSliderInput(this.sliderB, 'b'));
        this.sliderA.addEventListener('input', () => this.handleChannelSliderInput(this.sliderA, 'a'));
        this.hueSlider.addEventListener('input', () => this.handleHueSliderInput());
        this.inputR.addEventListener('input', () => this.handleChannelInput(this.inputR));
        this.inputG.addEventListener('input', () => this.handleChannelInput(this.inputG));
        this.inputB.addEventListener('input', () => this.handleChannelInput(this.inputB));
        this.inputA.addEventListener('input', () => this.handleChannelInput(this.inputA));
        const channelSubmitEvents = ['change', 'blur'];
        channelSubmitEvents.forEach(event => {
            this.inputR.addEventListener(event, () => this.handleChannelInputSubmit(this.inputR, 'r'));
            this.inputG.addEventListener(event, () => this.handleChannelInputSubmit(this.inputG, 'g'));
            this.inputB.addEventListener(event, () => this.handleChannelInputSubmit(this.inputB, 'b'));
            this.inputA.addEventListener(event, () => this.handleChannelInputSubmit(this.inputA, 'a'));
        });
        this.hexInput.addEventListener('input', () => this.handleHexInput());
        this.hexInput.addEventListener('change', () => this.handleHexInputSubmit());
        this.hexInput.addEventListener('blur', () => this.handleHexInputSubmit());
        this.hexCopyIcon.addEventListener('click', () => this.handleHexCopy());
        this.primarySelector.addEventListener('click', () => this.selectPrimaryColor());
        this.secondarySelector.addEventListener('click', () => this.selectSecondaryColor());
        this.colorPickerCanvas.addEventListener('pointerdown', e => this.handleColorPickerPointerDown(e));
        this.colorPickerCanvas.addEventListener('pointermove', e => this.handleColorPickerPointerMove(e));
        this.colorPickerCanvas.addEventListener('pointerup', e => this.handleColorPickerPointerUp(e));
        this.colorPickerCanvas.addEventListener('contextmenu', e => e.preventDefault());
    }
    setupResizeObservers() {
        window.addEventListener('resize', () => {
            this.resetColorPickerCanvas();
            this.updateColorPickerCanvas();
            this.updatePaletteSelectorPosition();
        });
        const resizeObserver = new ResizeObserver(() => {
            this.resetColorPickerCanvas();
            this.updateColorPickerCanvas();
            this.updatePaletteSelectorPosition();
        });
        const colorPickerContainer = this.colorPickerCanvas.parentElement;
        if (colorPickerContainer) {
            resizeObserver.observe(colorPickerContainer);
        }
        resizeObserver.observe(this.colorPickerCanvas);
    }
}
//# sourceMappingURL=color_picker.js.map