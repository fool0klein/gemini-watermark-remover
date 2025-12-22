import { WatermarkEngine } from './engine.js';

document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    
    // Images
    const originalImage = document.getElementById('originalImage');
    const processedImage = document.getElementById('processedImage');
    
    // Metadata Fields
    const originalSize = document.getElementById('originalSize');
    const resultSize = document.getElementById('resultSize');
    const resultStatus = document.getElementById('resultStatus');
    
    // Buttons & Overlay
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    let engine = null;

    // --- Init ---
    try {
        engine = await WatermarkEngine.create();
    } catch (e) {
        alert("Error: Could not load background assets. Please ensure 'assets/bg_48.png' and 'assets/bg_96.png' exist.");
    }

    // --- Event Listeners ---
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Drag & Drop Logic
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    uploadArea.addEventListener('dragover', () => uploadArea.classList.add('border-gemini-blue', 'bg-blue-50'));
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('border-gemini-blue', 'bg-blue-50'));
    
    uploadArea.addEventListener('drop', (e) => {
        uploadArea.classList.remove('border-gemini-blue', 'bg-blue-50');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    resetBtn.addEventListener('click', () => {
        previewSection.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        fileInput.value = '';
        originalImage.src = '';
        processedImage.src = '';
    });

    // --- Processing Logic ---
    async function handleFiles(files) {
        if (!files.length) return;
        const file = files[0];
        
        if (!file.type.match('image.*')) {
            alert("Please upload a valid image (PNG, JPG, WebP)");
            return;
        }

        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex');

        try {
            if (!engine) engine = await WatermarkEngine.create();
            
            const result = await engine.process(file);
            
            // 1. Update Images
            originalImage.src = result.originalSrc;
            const processedUrl = URL.createObjectURL(result.blob);
            processedImage.src = processedUrl;
            
            // 2. Update Metadata (Top Right Corner)
            const sizeText = `${result.width} × ${result.height} px`;
            originalSize.textContent = sizeText;
            resultSize.textContent = sizeText;
            resultStatus.textContent = "Watermark Removed"; // Set status text
            
            // 3. Setup Download
            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = processedUrl;
                a.download = `clean_${file.name.replace(/\.[^/.]+$/, "")}.png`;
                a.click();
            };

            // 4. Show Results
            uploadArea.classList.add('hidden');
            previewSection.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            alert("An error occurred during processing.");
        } finally {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.classList.remove('flex');
        }
    }
});