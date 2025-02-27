const costmap_margins = {top: 10, right: 10, bottom: 30, left: 10, width: 300, height: 300};
const episodeSelect = document.getElementById("episodeSelect");
for (let i = 0; i < 20; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Episode ${i + 1}`;
    episodeSelect.appendChild(option);
}
episodeSelect.value = 0;

const goals = [
    [9.044485078655432, 11.850556097454007],
    [6.960701479152645, 5.922217349050317],
    [0.4747945137211067, 11.468988090892392],
    [4.4367736610287665, -0.09412142447294691],
    [5.111777515902549, -5.376760288767162],
    [7.342225036383715, -4.965888377099521],
    [0.9150144181549376, 2.7526339635131194],
    [13.534651705088152, 3.7504657489915587],
    [8.222664847099987, 0.7276223988656962],
    [10.805288291867713, 7.565704928762064],
    [3.4025215992931717, 10.394461658906382],
    [-2.354962507950711, 1.536146674150391],
    [13.802336803470403, 0.9031885341815613],
    [0.09373193310508476, 9.062929439990214],
    [12.821658305810335, 7.707511228253735],
    [7.951001889486642, -0.32424232779740514],
    [8.54160911582357, 3.455595484522995],
    [0.5685090770796606, 6.881075518432583],
    [7.550039731706233, 11.88140038844787],
    [0.5339908462599272, 2.958005845575922],
]

const reductionFactor = 6;


const sliderSigma = document.getElementById("sigma-slider");
const sliderPosThreshold = document.getElementById("pos-thresh-slider");
const sliderNegThreshold = document.getElementById("neg-thresh-slider");
const xColorScaler = d3.scaleLinear().domain([0, 1])
const yColorScaler = d3.scaleLinear().domain([0, 1])

function colorBlender(X, Y) {
    const xNorm = xColorScaler(X);
    const yNorm = yColorScaler(Y);

    // Define the color points for each corner of the triangle
    const white = d3.rgb(255, 255, 255);
    const blue = d3.rgb(255, 0, 0);
    const red = d3.rgb(0, 0, 255);
    const green = d3.rgb(0, 255, 0);

    // Calculate weights based on position within the triangle
    const weightWhite = (1 - xNorm) * (1 - yNorm);
    const weightBlue = xNorm * (1 - yNorm);
    const weightRed = (1 - xNorm) * yNorm;
    const weightGreen = xNorm * yNorm;

    // Interpolate by combining the colors based on their weights
    const interpolatedColor = d3.rgb(white.r * weightWhite + blue.r * weightBlue + red.r * weightRed + green.r * weightGreen, white.g * weightWhite + blue.g * weightBlue + red.g * weightRed + green.g * weightGreen, white.b * weightWhite + blue.b * weightBlue + red.b * weightRed + green.b * weightGreen);

    return interpolatedColor.toString();
}


function buildGrid(imgHeight, imgWidth, positions, scores, positive_only, xScale, yScale) {
    const grid = new Float32Array(imgHeight * imgWidth).fill(0); // Using a 1D Float32Array for faster access
    const sigmaSquared = sliderSigma.value ** 2;
    const posThreshold = sliderPosThreshold.value * d3.max(scores);
    const negThreshold = sliderNegThreshold.value * d3.min(scores)
    const xOffset = xScale.range()[0];
    const yOffset = yScale.range()[1];
    const invReductionFactor = 1 / reductionFactor;

    positions = positions.map(([px, py]) => [xScale(px), yScale(py)]); // Pre-scale positions

    // Precompute the maximum range for the Gaussian kernel
    const maxDistance = Math.sqrt(4 * sigmaSquared);  // e.g., within 2σ

    positions.forEach(([px, py], i) => {
        const score = scores[i];
        if ((score > 0 && positive_only) || (score < 0 && !positive_only)) {
            const thresholdedScore = positive_only ? Math.min(score, posThreshold) : Math.max(score, negThreshold);

            // Convert pixel-space position to grid indices
            const centerX = Math.round((px - xOffset) * invReductionFactor);
            const centerY = Math.round((py - yOffset) * invReductionFactor);

            // Determine the pixel range affected by this Gaussian
            const radius = Math.ceil(maxDistance * invReductionFactor);
            const minX = Math.max(0, centerX - radius);
            const maxX = Math.min(imgWidth - 1, centerX + radius);
            const minY = Math.max(0, centerY - radius);
            const maxY = Math.min(imgHeight - 1, centerY + radius);

            // Calculate the Gaussian contribution for each affected cell within radius
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const dx = (x * reductionFactor + xOffset) - px;
                    const dy = (y * reductionFactor + yOffset) - py;
                    const distSquared = dx * dx + dy * dy;

                    if (distSquared <= 4 * sigmaSquared) {
                        const gaussianValue = thresholdedScore * Math.exp(-distSquared / (2 * sigmaSquared));
                        const gridIndex = y * imgWidth + x;
                        grid[gridIndex] += gaussianValue;
                    }
                }
            }
        }
    });

    // Convert 1D grid back to 2D array format if necessary
    return Array.from({length: imgHeight}, (_, y) => Array.from({length: imgWidth}, (_, x) => positive_only ? grid[y * imgWidth + x] : -grid[y * imgWidth + x]));
}


d3.json("assets/costmap.json").then(async data => {
    function update() {

        let episode_data = data[episodeSelect.value];
        for (let i = 0; i < 3; i++) {

            let positions = episode_data[`sample_${i + 1}`].position;
            let scores = episode_data[`sample_${i + 1}`].cost;

            const gridPos = buildGrid(reducedHeight, reducedWidth, positions, scores, true, xScale, yScale);
            const gridNeg = buildGrid(reducedHeight, reducedWidth, positions, scores, false, xScale, yScale);

            let gridPosFlat = []
            gridPos.forEach(row => {
                row.forEach(cell => {
                    gridPosFlat.push(cell)
                })
            })

            let gridNegFlat = []
            gridNeg.forEach(row => {
                row.forEach(cell => {
                    gridNegFlat.push(cell)
                })
            })

            xColorScaler.domain([0, sliderPosThreshold.value * d3.max(gridPosFlat)]);
            yColorScaler.domain([0, sliderNegThreshold.value * d3.max(gridNegFlat)]);

            d3.select(`#costmap_sample${i + 1}`).selectAll("rect").remove()
            d3.select(`#costmap_sample${i + 1}`).selectAll("rect")
                .data(gridPosFlat)
                .enter()
                .append("rect")
                .attr("x", (d, i) => {
                     // Scale up the position for x-axis
                    return (i % reducedWidth) * reductionFactor + xScale.range()[0];
                })
                .attr("y", (d, i) => {
                     // Scale up the position for y-axis
                    return Math.floor(i / reducedWidth) * reductionFactor + yScale.range()[1];
                })
                .attr("width", reductionFactor) // Scale the width of each rect
                .attr("height", reductionFactor) // Scale the height of each rect
                .attr("fill", (d, i) => colorBlender(d, gridNegFlat[i]))
                .attr("fill-opacity", 0.5);

            d3.select(`#costmap_sample${i + 1}`).selectAll("circle").remove()
            d3.select(`#costmap_sample${i + 1}`).selectAll("#costmap_circle")
                .data(positions)
                .enter()
                .append("circle")
                .attr("id", "costmap_circle")
                .attr("cx", d => xScale(d[0]))
                .attr("cy", d => yScale(d[1]))
                .attr("r", 2)

            const startId = episodeSelect.value - 1 < 0 ? 19 : episodeSelect.value - 1
            let start = goals[startId]
            let goal = goals[episodeSelect.value % 20]
            d3.select(`#costmap_sample${i + 1}`).selectAll("#costmap_start").remove()
            d3.select(`#costmap_sample${i + 1}`).selectAll("#costmap_goal").remove()
            d3.select(`#costmap_sample${i + 1}`).append("circle")
                .attr("id", "costmap_start")
                .attr("cx", xScale(start[1]))
                .attr("cy", yScale(-start[0]))
                .attr("r", 5)
                .attr("fill", "green")

            d3.select(`#costmap_sample${i + 1}`).append("circle")
                .attr("id", "costmap_goal")
                .attr("cx", xScale(goal[1]))
                .attr("cy", yScale(-goal[0]))
                .attr("r", 5)
                .attr("fill", "red")
        }
    }

    for (let i = 0; i < 20; i++) {
        data[i]["sample_1"].position.shift()
        data[i]["sample_2"].position.shift()
        data[i]["sample_3"].position.shift()
    }

    let reducedWidth = null;
    let reducedHeight = null;

    const container = d3.select("#costmap-plot")
    const col1 = container.append("div").attr("class", "col text-center");
    const col2 = container.append("div").attr("class", "col text-center");
    const col3 = container.append("div").attr("class", "col text-center");

    const cols = [col1, col2, col3]

    const svgs = cols.map((col, i) => {
        return col.append("svg")
            .attr("id", `costmap_sample${i + 1}`)
            .attr("viewBox", `0 0 ${costmap_margins.width} ${costmap_margins.height}`)
            .attr("width", '100%')
            .attr("height", '100%')
            .attr("preserveAspectRatio", "xMidYMid meet")
    })

    svgs.forEach((svg, i) => {
        svg.append("image")
            .attr("id", `costmap_image${i + 1}`)
            .attr('x', costmap_margins.left)
            .attr('y', costmap_margins.top)
            .attr("xlink:href", "assets/occupancy.bmp")
            .attr("width", costmap_margins.width - costmap_margins.left - costmap_margins.right)
            .attr("height", costmap_margins.height - costmap_margins.top - costmap_margins.bottom)
    })

    const xScale = d3.scaleLinear()
        .domain([-6.713828086853027, 14.106171447783709])
        .range([costmap_margins.left, costmap_margins.width - costmap_margins.right])
    const yScale = d3.scaleLinear()
        .domain([-16.0518543086946, 5.128145217895508])
        .range([costmap_margins.height - costmap_margins.bottom, costmap_margins.top])

    const imgWidth = parseInt(xScale.range()[1] - xScale.range()[0])
    const imgHeight = parseInt(yScale.range()[0] - yScale.range()[1])

    reducedWidth = Math.round(imgWidth / reductionFactor);
    reducedHeight = Math.round(imgHeight / reductionFactor);


    sliderSigma.addEventListener("input", () => {
        document.getElementById("sigmaValue").textContent = sliderSigma.value;
        update()

    })
    sliderPosThreshold.addEventListener("input", () => {
        document.getElementById("posThreshValue").textContent = sliderPosThreshold.value;
        update()
    })

    sliderNegThreshold.addEventListener("input", () => {
        document.getElementById("negThreshValue").textContent = sliderNegThreshold.value;
        update()
    })

    function resetSliders() {
        sliderPosThreshold.value = 1.0
        sliderNegThreshold.value = 1.0
        sliderSigma.value = 10;
        document.getElementById("sigmaValue").textContent = sliderSigma.value;
        document.getElementById("posThreshValue").textContent = sliderPosThreshold.value;
        document.getElementById("negThreshValue").textContent = sliderNegThreshold.value;
    }

    episodeSelect.addEventListener("change", () => {
        resetSliders()
        update()
    })


    resetSliders()
    update()
})

