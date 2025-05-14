
document.addEventListener('DOMContentLoaded', function () {
    const imageUpload = document.getElementById('imageUpload');
    const uploadBtn = document.getElementById('uploadBtn');
    const imagePreview = document.getElementById('imagePreview');
    const asciiArt = document.getElementById('asciiArt');
    const widthInput = document.getElementById('width');
    const contrastInput = document.getElementById('contrast');
    const brightnessInput = document.getElementById('brightness');
    const colorModeSelect = document.getElementById('colorMode');
    const charSetSelect = document.getElementById('charSet');
    const customCharField = document.getElementById('customCharField');
    const customCharacters = document.getElementById('customCharacters');
    const copyBtn = document.getElementById('copyBtn');

    let currentImage = null;

    // Show/hide custom character field
    charSetSelect.addEventListener('change', function () {
        customCharField.style.display = this.value === 'custom' ? 'block' : 'none';
    });

    // Handle file selection
    imageUpload.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                imagePreview.src = event.target.result;
                currentImage = new Image();
                currentImage.src = event.target.result;
                currentImage.onload = function () {
                    convertToAscii();
                }
            }
            reader.readAsDataURL(file);
        }
    });

    // Process button click
    uploadBtn.addEventListener('click', function () {
        if (currentImage) {
            convertToAscii();
        } else {
            alert('Please upload an image first!');
        }
    });

    // Copy button click
    copyBtn.addEventListener('click', function () {
        const textArea = document.createElement('textarea');
        textArea.value = asciiArt.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    });

    // Listen for changes on controls
    widthInput.addEventListener('change', debounce(convertToAscii, 500));
    contrastInput.addEventListener('input', debounce(convertToAscii, 500));
    brightnessInput.addEventListener('input', debounce(convertToAscii, 500));
    colorModeSelect.addEventListener('change', convertToAscii);
    charSetSelect.addEventListener('change', convertToAscii);
    customCharacters.addEventListener('input', debounce(convertToAscii, 500));

    function convertToAscii() {
        if (!currentImage) return;

        const width = parseInt(widthInput.value);
        const contrast = parseInt(contrastInput.value) / 100;
        const brightness = parseInt(brightnessInput.value) / 100;
        const colorMode = colorModeSelect.value;
        const charSetType = charSetSelect.value;

        // Determine character set
        let chars;
        switch (charSetType) {
            case 'simple':
                chars = ' .:-=+*#%@';
                break;
            case 'blocks':
                chars = ' ░▒▓█';
                break;
            case 'custom':
                chars = customCharacters.value || ' .,:;i1tfLCG08@';
                break;
            default: // standard
                chars = ' .,:;i1tfLCG08@';
        }

        // Invert if selected
        if (colorMode === 'inverted') {
            chars = chars.split('').reverse().join('');
        }

        // Calculate height based on aspect ratio
        const aspectRatio = currentImage.height / currentImage.width;
        const height = Math.floor(width * aspectRatio * 0.5); // Multiply by 0.5 to account for character aspect ratio

        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;

        // Apply brightness/contrast adjustments
        ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
        ctx.drawImage(currentImage, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        let result = '';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];

                // Calculate grayscale value
                const gray = 0.3 * r + 0.59 * g + 0.11 * b;

                // Map grayscale to character
                const charIdx = Math.floor(gray * (chars.length - 1) / 255);
                result += chars[charIdx];
            }
            result += '\n';
        }

        asciiArt.textContent = result;

        // Adjust font size based on width for better visibility
        const fontSizeScale = Math.max(1, Math.min(10, 600 / width));
        asciiArt.style.fontSize = `${fontSizeScale}px`;
        asciiArt.style.lineHeight = `${fontSizeScale}px`;
    }

    // Debounce function to limit calls
    function debounce(func, wait) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
});