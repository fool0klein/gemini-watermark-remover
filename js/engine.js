import { calculateAlphaMap } from './alphaMap.js';
import { removeWatermark } from './blendModes.js';

export class WatermarkEngine {
    constructor(bg48, bg96) {
        this.bg48 = bg48;
        this.bg96 = bg96;
        this.alphaMaps = {};
    }

    static async create() {
        const loadImage = (src) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });

        try {
            const [bg48, bg96] = await Promise.all([
                loadImage('./assets/bg_48.png'),
                loadImage('./assets/bg_96.png')
            ]);
            return new WatermarkEngine(bg48, bg96);
        } catch (e) {
            console.error("Failed to load assets. Ensure assets/bg_48.png exists.");
            throw e;
        }
    }

    getWatermarkInfo(width, height) {
        const isLarge = width > 1024 && height > 1024;
        const size = isLarge ? 96 : 48;
        const margin = isLarge ? 64 : 32;
        
        return {
            size,
            x: width - margin - size,
            y: height - margin - size,
            width: size, 
            height: size
        };
    }

    async getAlphaMap(size) {
        if (this.alphaMaps[size]) return this.alphaMaps[size];
        
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(size === 48 ? this.bg48 : this.bg96, 0, 0);
        
        const map = calculateAlphaMap(ctx.getImageData(0, 0, size, size));
        this.alphaMaps[size] = map;
        return map;
    }

    async process(imageFile) {
        const img = await new Promise((resolve) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.src = URL.createObjectURL(imageFile);
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const config = this.getWatermarkInfo(canvas.width, canvas.height);
        
        const alphaMap = await this.getAlphaMap(config.size);
        removeWatermark(imageData, alphaMap, config);
        
        ctx.putImageData(imageData, 0, 0);
        
        return {
            blob: await new Promise(r => canvas.toBlob(r)),
            originalSrc: img.src,
            width: img.width,
            height: img.height
        };
    }
}