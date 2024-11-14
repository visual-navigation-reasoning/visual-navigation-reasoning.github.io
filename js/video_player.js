// Retrieve all images in assets/real_results, all named 00000000.png, 00000001.png, etc.
const realImageUrls = Array.from({length: 1030}, (_, i) => `assets/real_results/${i.toString().padStart(8, "0")}.png`);
const simImageUrls = Array.from({length: 454}, (_, i) => `assets/sim_results/${(i+1).toString().padStart(8, "0")}.png`);

const realPreloadedImagesData = [];
const simPreloadedImagesData = [];
let realCurrentIndex = 0;
let simCurrentIndex = 0;

let realAccumulatedImage = null;
let simAccumulatedImage = null;
let realFrameCount = 0;
let simFrameCount = 0;

const realAccumulateButton = document.getElementById('real-accumulate-button');
const realPlayButton = document.getElementById('real-play-button');

const simAccumulateButton = document.getElementById('sim-accumulate-button');
const simPlayButton = document.getElementById('sim-play-button');

let realTimeout = null;
let simTimeout = null;

const realProgressBar  = document.getElementById('real-progress-bar');
const simProgressBar  = document.getElementById('sim-progress-bar');
realProgressBar.style.width = "0%";
simProgressBar.style.width = "0%";

// Initialize the pixel counters array globally
let realPixelCounts = null;
let simPixelCounts = null;


function preloadImagesData(imageUrls, callback, preloadedBuffer, progressBar) {
    let loadedCount = 0;
    imageUrls.forEach((url, index) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            // Draw the image on a temporary canvas
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext("2d", {willReadFrequently: true});
            context.drawImage(img, 0, 0);
            preloadedBuffer[index] = canvas.toDataURL("image/png");

            loadedCount++;
            progressBar.style.width = `${(loadedCount / imageUrls.length) * 100}%`;
            // Check if all images are loaded
            if (loadedCount === imageUrls.length) {
                callback();
            }
        };
    });
}

function startRealOccupancy() {
    document.getElementById("real-map-image").style.display = "block";
    document.getElementById("real-progress-container").remove();
    realTimeout = setTimeout(displayRealImage, 100);
}

function startSimOccupancy() {
    document.getElementById("sim-map-image").style.display = "block";
    document.getElementById("sim-progress-container").remove();
    simTimeout = setTimeout(displaySimImage, 100);
}


realAccumulateButton.addEventListener('click', () => {

    // Check if the bootstrap button is active
    realAccumulateButton.active = !realAccumulateButton.active;
    realAccumulateButton.textContent = realAccumulateButton.active ? 'Show single probing' : 'Accumulate probings';

    // Change the color of the button
    realAccumulateButton.classList.toggle('btn-primary');
    realAccumulateButton.classList.toggle('btn-secondary');
});

realPlayButton.addEventListener('click', () => {

    // Check if the bootstrap button is active
    realPlayButton.active = !realPlayButton.active;
    realPlayButton.textContent = realPlayButton.active ? 'Pause' : 'Play';

    // Change the color of the button
    realPlayButton.classList.toggle('btn-primary');
    realPlayButton.classList.toggle('btn-secondary');

    if (realPlayButton.active) {
        displayRealImage();
    }
})


simAccumulateButton.addEventListener('click', () => {

    // Check if the bootstrap button is active
    simAccumulateButton.active = !simAccumulateButton.active;
    simAccumulateButton.textContent = simAccumulateButton.active ? 'Show single probing' : 'Accumulate probings';

    // Change the color of the button
    simAccumulateButton.classList.toggle('btn-primary');
    simAccumulateButton.classList.toggle('btn-secondary');
});

simPlayButton.addEventListener('click', () => {

    // Check if the bootstrap button is active
    simPlayButton.active = !simPlayButton.active;
    simPlayButton.textContent = simPlayButton.active ? 'Pause' : 'Play';

    // Change the color of the button
    simPlayButton.classList.toggle('btn-primary');
    simPlayButton.classList.toggle('btn-secondary');

    if (simPlayButton.active) {
        displaySimImage();
    }
})

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            simPlayButton.active = false;
            simPlayButton.textContent = 'Play';
            simPlayButton.classList.remove('btn-secondary');
            simPlayButton.classList.add('btn-primary');


            realPlayButton.active = false;
            realPlayButton.textContent = 'Play';
            realPlayButton.classList.remove('btn-secondary');
            realPlayButton.classList.add('btn-primary');
        }
    });
}, {threshold: 0.1}); // Adjust threshold as needed

// Start observing the button
observer.observe(document.getElementById('occupancy-map-container'));


function displaySimImage() {
    if (simCurrentIndex >= simPreloadedImagesData.length) {
        simCurrentIndex = 0; // Loop back to start
    }
    const currentImageDataUrl = simPreloadedImagesData[simCurrentIndex];

    if (simAccumulateButton.active) {
        accumulateImage(currentImageDataUrl, true);
    } else {
        // Display only the current image, not accumulated
        const imgElement = document.getElementById("sim-occ-image");
        imgElement.src = currentImageDataUrl;

        // Reset accumulated image and pixelCounts
        simAccumulatedImage = null;
        simPixelCounts = null;
        simFrameCount = 0;

        // Set size of the image to match the size of the map
        imgElement.onload = () => {
            imgElement.style.width = "100%";
            imgElement.style.height = "auto";
        }
    }

    simCurrentIndex++;
    if (simPlayButton.active) {
        simTimeout = setTimeout(displaySimImage, 100); // Adjust time interval as needed
    } else {
        clearTimeout(simTimeout);
    }
}


function displayRealImage() {
    if (realCurrentIndex >= realPreloadedImagesData.length) {
        realCurrentIndex = 0; // Loop back to start
    }
    const currentImageDataUrl = realPreloadedImagesData[realCurrentIndex];

    if (realAccumulateButton.active) {
        accumulateImage(currentImageDataUrl);
    } else {
        // Display only the current image, not accumulated
        const imgElement = document.getElementById("real-occ-image");
        imgElement.src = currentImageDataUrl;

        // Reset accumulated image and pixelCounts
        realAccumulatedImage = null;
        realPixelCounts = null;
        realFrameCount = 0;

        // Set size of the image to match the size of the map
        imgElement.onload = () => {
            imgElement.style.width = "100%";
            imgElement.style.height = "auto";
        }
    }

    realCurrentIndex++;
    if (realPlayButton.active) {
        realTimeout = setTimeout(displayRealImage, 100); // Adjust time interval as needed
    } else {
        clearTimeout(realTimeout);
    }
}

function accumulateImage(currentImageDataUrl, isSim = false) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", {willReadFrequently: true});

    const newImage = new Image();
    newImage.src = currentImageDataUrl;
    newImage.onload = () => {
        // Determine which accumulated canvas and image element to use based on the isSim flag
        const accumulatedImageCanvas = isSim ? simAccumulatedImage : realAccumulatedImage;
        const imgElement = document.getElementById(isSim ? "sim-occ-image" : "real-occ-image");

        // Initialize accumulated canvas and pixelCounts on the first frame
        if (!accumulatedImageCanvas) {
            const newAccumulatedCanvas = document.createElement("canvas");
            newAccumulatedCanvas.width = newImage.width;
            newAccumulatedCanvas.height = newImage.height;
            newAccumulatedCanvas.getContext("2d", {willReadFrequently: true}).drawImage(newImage, 0, 0);

            if (isSim) {
                simAccumulatedImage = newAccumulatedCanvas;
                simPixelCounts = new Uint32Array(newImage.width * newImage.height).fill(1);
                simFrameCount = 1;
            } else {
                realAccumulatedImage = newAccumulatedCanvas;
                realPixelCounts = new Uint32Array(newImage.width * newImage.height).fill(1);
                realFrameCount = 1;
            }
        } else {
            canvas.width = newImage.width;
            canvas.height = newImage.height;

            // Draw the current accumulated image onto the temporary canvas
            context.drawImage(accumulatedImageCanvas, 0, 0);

            // Draw the new frame on top of the temporary canvas
            context.drawImage(newImage, 0, 0);

            // Get image data from both the accumulated image and the new image
            const tempImageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const tempPixels = tempImageData.data;

            const accumulatedCtx = accumulatedImageCanvas.getContext("2d", {willReadFrequently: true});
            const accumulatedImageData = accumulatedCtx.getImageData(0, 0, accumulatedImageCanvas.width, accumulatedImageCanvas.height);
            const accumulatedPixels = accumulatedImageData.data;

            // Use the correct pixel count array based on the case
            const pixelCounts = isSim ? simPixelCounts : realPixelCounts;

            // Blend each pixel based on transparency
            for (let i = 0; i < accumulatedPixels.length; i += 4) {
                const alpha = tempPixels[i + 3]; // Alpha channel of the new image

                if (alpha > 0) {
                    // Update the accumulated color based on the number of times this pixel was non-transparent
                    const count = pixelCounts[i / 4];
                    accumulatedPixels[i] = (accumulatedPixels[i] * count + tempPixels[i]) / (count + 1);     // Red
                    accumulatedPixels[i + 1] = (accumulatedPixels[i + 1] * count + tempPixels[i + 1]) / (count + 1); // Green
                    accumulatedPixels[i + 2] = (accumulatedPixels[i + 2] * count + tempPixels[i + 2]) / (count + 1); // Blue
                    accumulatedPixels[i + 3] = Math.min(255, (accumulatedPixels[i + 3] * count + alpha) / (count + 1)); // Alpha

                    // Increment the non-transparent pixel count for this pixel
                    pixelCounts[i / 4] = count + 1;
                }
            }

            // Update the accumulated canvas with the blended result
            accumulatedCtx.putImageData(accumulatedImageData, 0, 0);
            isSim ? simFrameCount++ : realFrameCount++;
        }

        // Update the displayed image with the data URL of the accumulated canvas
        if (accumulatedImageCanvas) {
            imgElement.src = accumulatedImageCanvas.toDataURL();
        }

    };
}


preloadImagesData(realImageUrls, startRealOccupancy, realPreloadedImagesData, realProgressBar);
preloadImagesData(simImageUrls, startSimOccupancy, simPreloadedImagesData, simProgressBar);