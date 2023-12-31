// 2023-10-08 PLEASE NOTE: I've just now made the deviation field not do anything and instead made it pick colour pairs of a distance that hasn't come up often in the histogram. To do: Make it a setting you can pick at the start for whether to use one behaviour or the other. Also To do: Make this new colour picking method not sometimes take ages to calculate...

let colorA, colorB;
let results = [];

let name, histogramBinsToFill;
let gridR, gridG, gridB;


let numBins = 60; 
const maxDistance = Math.sqrt(255**2 + 255**2 + 255**2);
const binSize = maxDistance/numBins;

function initializeHistogramData(numBins) {
    const histogramData = new Array(numBins).fill(null).map(() => ({ correct: 0, total: 0 }));
    return histogramData;
}

let histogramData = initializeHistogramData(numBins);

function updateHistogramData(binSize) {
    // Reset the histogramData
    histogramData.forEach(bin => {
        bin.correct = 0;
        bin.total = 0;
    });

    results.forEach(res => {
        const distance = Math.sqrt(
            (res.aRed - res.bRed) ** 2 +
            (res.aGreen - res.bGreen) ** 2 +
            (res.aBlue - res.bBlue) ** 2
        );
        const bin = Math.min(histogramData.length - 1, Math.floor(distance / binSize));
        histogramData[bin].total++;
        if (res.isCorrect) histogramData[bin].correct++;
    });
}

function updateHistogram(colorA, colorB, isCorrect) {
    const distance = Math.sqrt(
        (colorA[0] - colorB[0]) ** 2 +
        (colorA[1] - colorB[1]) ** 2 +
        (colorA[2] - colorB[2]) ** 2
    );
    const binIndex = Math.floor(distance / binSize);
    
    histogramData[binIndex].total += 1;
    if (isCorrect) histogramData[binIndex].correct += 1;
}

function initGrids() {
    const gridSize = 256; // Assuming the grid spans the full color space
    const gridDivisions = 25; // Number of divisions in the grid, you can adjust this
    
    // Grid for Red (XY plane)
    gridR = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x444444);
    gridR.rotation.z = Math.PI / 2; // Rotate to align with YZ plane
    gridR.position.set(0, 255/2, 255/2); // Positioned at the B = 0 plane

    // Grid for Green (XZ plane)
    gridG = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x444444);
    gridG.position.set(255/2, 0, 255/2); // Positioned at the B = 0 plane

    // Grid for Blue (YZ plane)
    gridB = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x444444);
    gridB.rotation.x = Math.PI / 2; // Rotate to align with XZ plane
    gridB.position.set(255/2, 255/2, 0); // Positioned at the R = 0 plane
    
    // Apply defaults
    if (document.getElementById("gridToggle").checked) {
        scene.add(gridR);
        scene.add(gridG);
        scene.add(gridB);
    }
}

document.getElementById("start").addEventListener("click", function() {
    const fileInput = document.getElementById("csvUpload");
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();

        reader.onload = function(event) {
            const csvData = event.target.result;
            parseCSV(csvData);
            // After parsing, start the test
            startTest();
        };

        reader.readAsText(file);
    } else {
        startTest();
    }
});

function startTest() {
    name = document.getElementById("name").value;
    if (!name) {
        alert("Please enter your name.");
        return;
    }
    
    histogramBinsToFill = document.getElementById("histogramBinsToFill").value;

    // Disable name and histogramBinsToFill inputs
    document.getElementById("name").disabled = true;
    document.getElementById("histogramBinsToFill").disabled = true;

    // Hide the instructions
    document.getElementById("instructions").style.display = "none";
    
    // Show the memorising screen
    document.getElementById("content").style.display = "block";
    
    // Assuming binSize is defined somewhere, if not, define it.
    updateHistogramData(binSize); 
    setColors();
}

document.getElementById("continue").addEventListener("click", function() {
    // Fade to black
    document.body.style.backgroundColor = "black";
    document.getElementById("content").style.display = "none";
    document.getElementById("waitingMessage").style.display = "block"; // Show waiting message
    let counter = 8;
    document.getElementById("countdown").textContent = counter;
    const interval = setInterval(() => {
        counter--;
        document.getElementById("countdown").textContent = counter;
        if (counter < 0) {
            clearInterval(interval);
        }
    }, 1000);
    
    setTimeout(function() {
        document.getElementById("waitingMessage").style.display = "none"; // Hide waiting message
        const random = Math.random();
        const chosenColor = random > 0.5 ? colorA : colorB;
        document.getElementById("testColor").querySelector(".color").style.backgroundColor = `rgb(${chosenColor[0]}, ${chosenColor[1]}, ${chosenColor[2]})`;

        // Hiding the memorize screen and showing the choice screen
        document.getElementById('content').style.display = 'none';
        document.getElementById('choiceScreen').style.display = 'block';

        document.body.style.backgroundColor = "#111"; // change background to dark grey

        // Store the chosenColor directly, not just its visual representation
        if (random > 0.5) {
            document.getElementById("testColor").chosenColor = colorA;
        } else {
            document.getElementById("testColor").chosenColor = colorB;
        }
    }, 8000);
});

document.getElementById("chooseA").addEventListener("click", function() {
    checkChoice("a");
});

document.getElementById("chooseB").addEventListener("click", function() {
    checkChoice("b");
});

// Three.js setup
let scene, camera, renderer;

function initThreeJS() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("resultsCanvas").appendChild(renderer.domElement);

    // Add controls to allow the cube to be rotated
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    // Set the orbit center to the middle of the RGB cube
    controls.target.set(127.5, 127.5, 127.5);

    // Reposition the camera
    camera.position.set(127.5, 127.5, 627.5); // Z is adjusted to pull the camera back
    camera.lookAt(127.5, 127.5, 127.5);
    
    initGrids();
}

initThreeJS();


// Helper function: Convert HSV to RGB
function hsvToRgb(h, s, v) {
    let r, g, b;
    let i;
    let f, p, q, t;

    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    s /= 100;
    v /= 100;

    if(s == 0) {
        r = g = b = v;
        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch(i) {
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
        default: // case 5:
            r = v;
            g = p;
            b = q;
    }

    return new THREE.Color(r, g, b);
}

// Add event listeners to toggles for immediate updates.
document.getElementById("whiteLinesToggle").addEventListener("change", visualizeResults);
document.getElementById("darkBlueLinesToggle").addEventListener("change", visualizeResults);
document.getElementById("lightPrevColsToggle").addEventListener("change", visualizeResults);
document.getElementById("gridDotsToggle").addEventListener("change", visualizeResults);
document.getElementById("greyOutlinesToggle").addEventListener("change", visualizeResults);
document.getElementById("gridToggle").addEventListener('change', visualizeResults);
document.getElementById("normalizeToggle").addEventListener('change', visualizeResults);

function visualizeResults() {
    // Clear previous items in the scene
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }

    // Lines visualization
    results.forEach(res => {
        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(res.aRed, res.aGreen, res.aBlue));
        geometry.vertices.push(new THREE.Vector3(res.bRed, res.bGreen, res.bBlue));

        let material;
        if (document.getElementById("whiteLinesToggle").checked && !res.isCorrect) {
            material = new THREE.LineBasicMaterial({color: 0xffffff});
        } else if (document.getElementById("darkBlueLinesToggle").checked && res.isCorrect) {
            material = new THREE.LineBasicMaterial({color: 0x335555});
        } else {
            return; // Skip adding the line if none of the conditions match
        }
        
        const line = new THREE.Line(geometry, material);
        scene.add(line);
    });

    // Check if the light grey dots toggle is checked
    if (document.getElementById("lightPrevColsToggle").checked) {
        const alreadyDrawn = [];  // To keep track of drawn colors and avoid duplicates

        results.forEach(res => {
            const colorA = [res.aRed, res.aGreen, res.aBlue];
            const colorB = [res.bRed, res.bGreen, res.bBlue];

            // If colorA hasn't been drawn, draw it and mark as drawn
            if (!colorExistsInArray(colorA, alreadyDrawn)) {
                drawDot(colorA);
                alreadyDrawn.push(colorA);
            }
            
            // If colorB hasn't been drawn, draw it and mark as drawn
            if (!colorExistsInArray(colorB, alreadyDrawn)) {
                drawDot(colorB);
                alreadyDrawn.push(colorB);
            }
        });
    }
    
    function drawDot(color) {
        // Check if the grey outlines toggle is checked
        if (document.getElementById("greyOutlinesToggle").checked) {
            // Draw a larger light grey dot for the halo effect
            let dotGeometry = new THREE.Geometry();
            dotGeometry.vertices.push(new THREE.Vector3(color[0], color[1], color[2]));
            let dotMaterial = new THREE.PointsMaterial({ size: 5, sizeAttenuation: true, color: 0xd3d3d3 }); // light grey for the halo
            let dot = new THREE.Points(dotGeometry, dotMaterial);
            scene.add(dot);
        }

        // Draw the smaller dot with the actual color over it
        let dotGeometry = new THREE.Geometry();
        dotGeometry.vertices.push(new THREE.Vector3(color[0], color[1], color[2]));
        let dotMaterial = new THREE.PointsMaterial({ size: 3, sizeAttenuation: true, color: new THREE.Color(`rgb(${color[0]}, ${color[1]}, ${color[2]})`) });
        let dot = new THREE.Points(dotGeometry, dotMaterial);
        scene.add(dot);
    }

    // Standard RGB Colors Visualization
    if (document.getElementById("gridDotsToggle").checked) {
        const step = 25;
        for (let r = 0; r <= 255; r += step) {
            for (let g = 0; g <= 255; g += step) {
                for (let b = 0; b <= 255; b += step) {
                    const dotGeometry = new THREE.Geometry();
                    dotGeometry.vertices.push(new THREE.Vector3(r, g, b));

                    const color = new THREE.Color(`rgb(${r}, ${g}, ${b})`);
                    const dotMaterial = new THREE.PointsMaterial({ size: 3, sizeAttenuation: true, color: color });

                    const dot = new THREE.Points(dotGeometry, dotMaterial);
                    scene.add(dot);
                }
            }
        }
    }

    // Check grid toggle and add/remove grids accordingly
    if (document.getElementById("gridToggle").checked) {
        if (!scene.children.includes(gridR)) {
            scene.add(gridR);
        }
        if (!scene.children.includes(gridG)) {
            scene.add(gridG);
        }
        if (!scene.children.includes(gridB)) {
            scene.add(gridB);
        }
    } else {
        if (scene.children.includes(gridR)) {
            scene.remove(gridR);
        }
        if (scene.children.includes(gridG)) {
            scene.remove(gridG);
        }
        if (scene.children.includes(gridB)) {
            scene.remove(gridB);
        }
    }
    
    const histogramDiv = document.getElementById("histogram2D");
    while (histogramDiv.lastChild && histogramDiv.lastChild.tagName !== 'H3' && histogramDiv.lastChild.tagName !== 'LABEL' && histogramDiv.lastChild.tagName !== 'INPUT') {
        histogramDiv.removeChild(histogramDiv.lastChild);
    }
    
    // Desired maximum height for the histogram bars
    const maxHeight = 100;

    // Calculate combined heights for each bin
    const combinedHeights = histogramData.map(bin => bin.total);

    // Find the maximum combined height
    const maxCombinedHeight = Math.max(...combinedHeights);

    // Determine if we're normalizing the histogram
    const normalizeHistogram = document.getElementById("normalizeToggle").checked;

    // Adjust the scaling factor based on normalization requirement
    let scale;
    if (normalizeHistogram) {
        const nonZeroBins = histogramData.filter(bin => bin.total > 0);
        const maxNonZeroHeight = Math.max(...nonZeroBins.map(bin => bin.total));
        scale = maxHeight / maxNonZeroHeight;
    } else {
        scale = maxHeight / maxCombinedHeight;
    }
    
    // Create and position histogram bars
    const barWidth = 15; // Increased width

    // Later, when you set the xOffset for histogram bars:
    let xOffset = 0;

    // Find out the maximum bar height, to position squares right below
    let maxBarHeight = 0;

    histogramData.forEach((binData) => {
        let scaledHeight;
        if (document.getElementById("normalizeToggle").checked && binData.total > 0) {
            scaledHeight = maxHeight;
        } else {
            scaledHeight = binData.total * scale;
        }
        
        if (scaledHeight > maxBarHeight) {
            maxBarHeight = scaledHeight;
        }
    });
    
    let squareYOffset = -2 * barWidth;
    
    let squareSize = barWidth;  // Assuming the squares are of the same width as bars
    let yOffset = -20;  // This determines the vertical gap between histogram bars and squares.

    // Create rows for squares
    let whiteRow = document.createElement("div");
    whiteRow.style.position = "absolute";
    whiteRow.style.bottom = yOffset + "px";
    whiteRow.style.left = "0";

    let greyRow = document.createElement("div");
    greyRow.style.position = "absolute";
    greyRow.style.bottom = (yOffset - squareSize) + "px";  // Placed below the white squares
    greyRow.style.left = "0";

    document.getElementById("histogram2D").appendChild(whiteRow);
    document.getElementById("histogram2D").appendChild(greyRow);
    
    histogramData.forEach((binData, index) => {
        let scaledHeight;
        if (document.getElementById("normalizeToggle").checked && binData.total > 0) {
            scaledHeight = maxHeight; // Set each non-zero column's height to maxHeight
        } else {
            scaledHeight = combinedHeights[index] * scale;
        }
        
        const correctFraction = binData.correct / binData.total;
        const correctHeight = correctFraction * scaledHeight;
        const incorrectHeight = scaledHeight - correctHeight;

        const barWhite = document.createElement("div");
        barWhite.style.width = barWidth + "px";
        barWhite.style.height = incorrectHeight + "px";
        barWhite.style.backgroundColor = "#e6e6e6";  // Updated color
        barWhite.style.position = "absolute";
        barWhite.style.bottom = "0";
        barWhite.style.left = xOffset + "px";

        const barGrey = document.createElement("div");
        barGrey.style.width = barWidth + "px";
        barGrey.style.height = correctHeight + "px";
        barGrey.style.backgroundColor = "#333333";  // Updated color
        barGrey.style.position = "absolute";
        barGrey.style.bottom = incorrectHeight + "px"; 
        barGrey.style.left = xOffset + "px";
        
        const histogramDiv = document.getElementById("histogram2D");
        histogramDiv.style.height = (maxHeight + 3 * barWidth + 10) + "px"; // Adjusted to include 2 rows of squares and the gaps.
        
        document.getElementById("histogram2D").appendChild(barWhite);
        document.getElementById("histogram2D").appendChild(barGrey);
        
        xOffset += barWidth;
    });
    
    histogramData.forEach((binData, index) => {
        // Determine the grey value for the square
        let binCenter = binSize * (index + 0.5);
        let greyValue = 255 - Math.floor(255 * binCenter / maxDistance);

        // Create white square for top row
        const whiteSquare = document.createElement("div");
        whiteSquare.style.width = barWidth + "px";
        whiteSquare.style.height = barWidth + "px";
        whiteSquare.style.backgroundColor = "#FFFFFF";
        whiteSquare.style.position = "absolute";
        whiteSquare.style.bottom = squareYOffset + "px"; 
        whiteSquare.style.left = index * barWidth + "px";

        // Create grey square for bottom row
        const greySquare = document.createElement("div");
        greySquare.style.width = barWidth + "px";
        greySquare.style.height = barWidth + "px"; 
        greySquare.style.backgroundColor = `rgb(${greyValue},${greyValue},${greyValue})`;
        greySquare.style.position = "absolute";
        greySquare.style.bottom = (squareYOffset + barWidth) + "px";
        greySquare.style.left = index * barWidth + "px";

        document.getElementById("histogram2D").appendChild(whiteSquare);
        document.getElementById("histogram2D").appendChild(greySquare);
    });

    // Animation logic
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();
}


// Function to check if a color exists in an array
function colorExistsInArray(color, colorArray) {
    return colorArray.some(existingColor => arraysEqual(existingColor, color));
}

document.getElementById("showResults").addEventListener("click", function() {
    document.getElementById("content").style.display = "none";
    document.getElementById("resultsCanvas").style.display = "block"; // Show the 3D visualization
    visualizeResults();
});

document.getElementById("download").addEventListener("click", function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');  // Months are 0-11 in JS
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}_${hour}-${minute}-${second}`;
    const filename = `ColorTest_${name}__${formattedDate}.csv`;

    let csv = `Name,A Red,A Green,A Blue,B Red,B Green,B Blue,Choice,Is Correct\n`;
    results.forEach(res => {
        csv += `${res.name},${res.aRed},${res.aGreen},${res.aBlue},${res.bRed},${res.bGreen},${res.bBlue},${res.choice},${res.isCorrect}\n`;
    });
    
    const blob = new Blob([csv], {type: "text/csv"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

document.getElementById("backToResults").addEventListener("click", function() {
    document.getElementById("resultsCanvas").style.display = "none";
    document.getElementById("content").style.display = "block";
});


// The task is to generate two colours both within the RGB cube which are a distance apart which falls into the least populated bin of the first bins of the histogram.
function setColors() {
    console.log('Histogram totals:', histogramData.map(bin => bin.total));

    // 1. Find the bin with the smallest height among the first histogramBinsToFill bins
    const minBin = histogramData.slice(0, histogramBinsToFill).reduce((min, bin) => (bin.total < min.total) ? bin : min, {total: Infinity});
    const minBinIndex = histogramData.indexOf(minBin);
    console.log(`minBinIndex: ${minBinIndex}, minBin:`, minBin);

    // 2. Choose a random distance within the bin
    const minDistance = minBinIndex * binSize;
    const maxDistance = minDistance + binSize;
    const chosenDistance = Math.random() * (maxDistance - minDistance) + minDistance;
    
    // 3. Generate two colors that are `chosenDistance` apart
    let attempts = 0;
    while(attempts < 1000) {  // limiting the while loop to 1000 iterations to avoid potential infinite loops
        // Select a random colorA
        colorA = randomRgb();
        
        // Ensure randomDirectionVector and chosenDistance are defined elsewhere in your code
        const directionVector = randomDirectionVector(chosenDistance);
        
        // Check if the resulting colorB is within the RGB space
        colorB = colorA.map((channel, index) => channel + directionVector[index]).map(Math.floor);
        if(colorB.every(channel => channel >= 0 && channel <= 255)) {
            // Ensure distanceBetween is defined elsewhere in your code
            const actualDistance = distanceBetween(colorA, colorB);
            if(minDistance <= actualDistance && actualDistance < maxDistance) {
                console.log(`actualDistance: ${actualDistance}, resultingBin: ${Math.floor(actualDistance / binSize)}`);
                // Ensure updateUI is defined elsewhere in your code
                updateUI(colorA, colorB);
                return; // Colors found, exit the function
            }
        }
        attempts++;
    }

    console.warn("Failed to find suitable colors after 1000 attempts.");
}

function randomRgb() {
    return [Math.random() * 256, Math.random() * 256, Math.random() * 256].map(Math.floor);
}

function randomDirectionVector(length) {
    // Generate a random 3D unit vector
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.sin(phi) * Math.sin(theta);
    const z = Math.cos(phi);
    
    // Scale the vector to the desired length
    return [x * length, y * length, z * length];
}

// Modify the following code so that if the hues are identical, it omits the part about the hue being more one hue or the other
function distanceBetween(color1, color2) {
    return Math.sqrt(
        Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2)
    );
}

function getClosestHueName(hue) {
    const hues = {
        Red: 0,
        Orange: 30,
        Yellow: 60,
        YellowGreen: 90,
        Green: 120,
        SpringGreen: 150,
        Cyan: 180,
        Azure: 210,
        Blue: 240,
        Violet: 270,
        Magenta: 300,
        Rose: 330
    };

    let name = 'Red';
    let minDifference = Math.abs(hue - hues.Red);

    for (let hueName in hues) {
        let difference = Math.abs(hue - hues[hueName]);
        if (difference < minDifference) {
            minDifference = difference;
            name = hueName;
        }
    }

    return name;
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if(max === min){
        h = s = 0;  // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}

function getLightnessAdjective(lightness, saturation) {
    if (lightness > 60) return 'Light';
    if (lightness < 40) return 'Dark';
    if (saturation < 50) return 'Dull';
    return '';
}

function getNextHueName(hue, referenceHue) {
    const hues = {
        Red: 0,
        Orange: 30,
        Yellow: 60,
        YellowGreen: 90,
        Green: 120,
        SpringGreen: 150,
        Cyan: 180,
        Azure: 210,
        Blue: 240,
        Violet: 270,
        Magenta: 300,
        Rose: 330
    };

    const hueNames = Object.keys(hues);
    const referenceHueName = getClosestHueName(referenceHue);
    const referenceIndex = hueNames.indexOf(referenceHueName);

    // Calculate the hue difference accounting for wrap-around at 0/360
    const hueDifference = ((hue - referenceHue + 180 + 360) % 360) - 180;

    // Determine the direction to the next hue name
    const direction = hueDifference > 0 ? 1 : -1;

    // Get the next hue name in the specified direction
    const nextIndex = (referenceIndex + direction + hueNames.length) % hueNames.length;
    return hueNames[nextIndex];
}

function getDifferenceDescription(valueA, valueB, high, low) {
    if (valueA > valueB) return low;
    if (valueA < valueB) return high;
    return '';
}

function getCircularDistance(value1, value2, max) {
    const delta = Math.abs(value1 - value2) % max;
    return Math.min(delta, max - delta);
}

function getNextHueName(hue, referenceHue) {
    const hues = {
        Red: 0,
        Orange: 30,
        Yellow: 60,
        YellowGreen: 90,
        Green: 120,
        SpringGreen: 150,
        Cyan: 180,
        Azure: 210,
        Blue: 240,
        Violet: 270,
        Magenta: 300,
        Rose: 330
    };
    
    const hueNames = Object.keys(hues);
    const referenceHueName = getClosestHueName(referenceHue);
    const referenceIndex = hueNames.indexOf(referenceHueName);
    
    const nextHueIndex = (referenceIndex + 1) % hueNames.length;
    const prevHueIndex = (referenceIndex - 1) % hueNames.length;
    
    const nextHueName = hueNames[nextHueIndex];
    const prevHueName = hueNames[prevHueIndex];
    
    const distanceToNextHue = getCircularDistance(hue, hues[nextHueName], 360);
    const distanceToPrevHue = getCircularDistance(hue, hues[prevHueName], 360);
    
    return distanceToNextHue < distanceToPrevHue ? nextHueName : prevHueName;
}

function updateUI(colorA, colorB) {
    const [hA, sA, lA] = rgbToHsl(colorA[0], colorA[1], colorA[2]);
    const [hB, sB, lB] = rgbToHsl(colorB[0], colorB[1], colorB[2]);

    const hueNameA = getClosestHueName(hA);
    let hueNameB = getClosestHueName(hB);

    const adjectiveA = getLightnessAdjective(lA, sA);
    let adjectiveB = getLightnessAdjective(lB, sB);

    let descriptionA = adjectiveA ? `${adjectiveA} ${hueNameA}` : hueNameA;
    let descriptionB = adjectiveB ? `${adjectiveB} ${hueNameB}` : hueNameB;

    // Check if descriptions would have been the same
    if (descriptionA === descriptionB) {
        const lightnessDesc = getDifferenceDescription(lA, lB, 'Lighter', 'Darker');
        const saturationDesc = getDifferenceDescription(sA, sB, 'More Vivid', 'Duller');
        let hueDifferenceDesc = '';

        // If hues are not identical, determine the hue difference description
        if (Math.abs(hA - hB) > 0.5 || Math.abs(hA - hB) < 359.5) {  // Tolerance to account for minor differences
            const nextClosestHueNameB = getNextHueName(hB, hA);
            hueDifferenceDesc = `More ${nextClosestHueNameB}`;
        }

        // Construct descriptionB without extra spaces
        descriptionB = [lightnessDesc, saturationDesc, hueDifferenceDesc, hueNameB].filter(Boolean).join(' ');
    }

    const elementA = document.getElementById("a");
    const elementB = document.getElementById("b");

    elementA.querySelector(".color").style.backgroundColor = `rgb(${colorA[0]}, ${colorA[1]}, ${colorA[2]})`;
    elementA.querySelector(".color").title = descriptionA;

    elementB.querySelector(".color").style.backgroundColor = `rgb(${colorB[0]}, ${colorB[1]}, ${colorB[2]})`;
    elementB.querySelector(".color").title = descriptionB;
}

function checkChoice(choice) {
    const testColor = document.getElementById("testColor").chosenColor;
    const isCorrect = (choice === "a" && arraysEqual(colorA, testColor)) || 
                      (choice === "b" && arraysEqual(colorB, testColor));
    
    updateHistogram(colorA, colorB, isCorrect);

    results.push({
        aRed: colorA[0],
        aGreen: colorA[1],
        aBlue: colorA[2],
        bRed: colorB[0],
        bGreen: colorB[1],
        bBlue: colorB[2],
        choice: choice,
        isCorrect: isCorrect,
        name: name
    });
    
    extractMemorizedColors();

    // Reset to main screen
    document.getElementById("choiceScreen").style.display = "none";
    document.getElementById("content").style.display = "block"; 
    setColors();
}

let memorizedColors = [];

function extractMemorizedColors() {
    results.forEach(res => {
        const colorA = [res.aRed, res.aGreen, res.aBlue];
        const colorB = [res.bRed, res.bGreen, res.bBlue];

        // Add colors to memorizedColors if not already present
        if (!colorExistsInArray(colorA, memorizedColors)) {
            memorizedColors.push(colorA);
        }
        if (!colorExistsInArray(colorB, memorizedColors)) {
            memorizedColors.push(colorB);
        }
    });
}

// Helper function to check if a color already exists in an array
function colorExistsInArray(color, colorArray) {
    return colorArray.some(arrayColor => arraysEqual(color, arrayColor));
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function parseCSV(csvData) {
    const rows = csvData.split("\n");
    results = []; // Clear existing results

    for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) {
            // Skipping empty line
            continue;
        }

        const cells = rows[i].split(",");

        if (cells.length !== 9) {
            // Skipping invalid or incomplete line
            continue;
        }

        // Parsing and validating color values
        const aRed = parseInt(cells[1], 10);
        const aGreen = parseInt(cells[2], 10);
        const aBlue = parseInt(cells[3], 10);
        const bRed = parseInt(cells[4], 10);
        const bGreen = parseInt(cells[5], 10);
        const bBlue = parseInt(cells[6], 10);

        if (isNaN(aRed) || isNaN(aGreen) || isNaN(aBlue) ||
            isNaN(bRed) || isNaN(bGreen) || isNaN(bBlue)) {
            // Invalid color values, skipping line
            continue;
        }

        // Adding parsed data to results array
        results.push({
            name: cells[0].trim(),
            aRed: aRed,
            aGreen: aGreen,
            aBlue: aBlue,
            bRed: bRed,
            bGreen: bGreen,
            bBlue: bBlue,
            choice: cells[7].trim(),
            isCorrect: cells[8].trim() === "true" || cells[8].trim() === "TRUE"
        });
    }
    
    visualizeResults(); // Visualize the loaded data
}

// Initialize
setColors();