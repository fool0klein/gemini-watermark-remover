const ALPHA_THRESHOLD = 0.002;
const MAX_ALPHA = 0.99;
const LOGO_VALUE = 255;

export function removeWatermark(imageData, alphaMap, position) {
    const { x, y, width, height } = position;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const imgIdx = ((y + row) * imageData.width + (x + col)) * 4;
            const alphaIdx = row * width + col;
            
            let alpha = alphaMap[alphaIdx];
            if (alpha < ALPHA_THRESHOLD) continue;
            alpha = Math.min(alpha, MAX_ALPHA);

            for (let c = 0; c < 3; c++) {
                const watermarked = imageData.data[imgIdx + c];
                // Reverse Alpha Blending Formula
                const original = (watermarked - alpha * LOGO_VALUE) / (1.0 - alpha);
                imageData.data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)));
            }
        }
    }
}