// Set dimensions and margins
const margin = {top: 40, right: 5, bottom: 50, left: 50};

const dist_to_legend = 110


container = document.getElementById("prediction-correction");

const svg = d3.select("#prediction-correction")
    .append("svg")
    .attr("width", '100%')
    .attr("height", '100%')
    .append("g");

// Add a tooltip to how the map on hover
let kalman_tooltip = d3.select("body")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")

// Add map in the tooltip
const tooltip_svg = kalman_tooltip.append("svg")
    .attr("width", 200)
    .attr("height", 200)

const tooltip_text = kalman_tooltip.append("div")
    .attr("class", "tooltip-text")


const tooltip_map = tooltip_svg.append("svg:image")
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', tooltip_svg.attr('width'))
    .attr('height', tooltip_svg.attr('height'))
    .attr("xlink:href", "assets/map.png")

// Small legend
tooltip_svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 110)
    .attr("height", 35)
    .attr("fill", "white")
    .attr("rx", 5)
    .attr("ry", 5)

tooltip_svg.append("line")
    .attr("x1", 10)
    .attr("y1", 10)
    .attr("x2", 30)
    .attr("y2", 10)
    .attr("stroke", "black")
    .attr("stroke-width", 2)

tooltip_svg.append("text")
    .attr("x", 35)
    .attr("y", 15)
    .text("In-domain")
    .style("font-size", "12px")

tooltip_svg.append("line")
    .attr("x1", 10)
    .attr("y1", 25)
    .attr("x2", 30)
    .attr("y2", 25)
    .attr("stroke", "red")
    .attr("stroke-width", 2)

tooltip_svg.append("text")
    .attr("x", 35)
    .attr("y", 30)
    .text("Corrupted")
    .style("font-size", "12px")

let positions = simulateTrajectory(params)
const [tooltip_xScale, tooltip_yScale] = getScalesImg(tooltip_map)

tooltip_svg.append("path")
    .datum(positions.map((d) => [d.x, d.y]))
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("d", d3.line()
        .x(d => tooltip_xScale(d[0]))
        .y(d => tooltip_yScale(d[1])))
tooltip_svg.append("path")
    .attr("id", "pred_corr_path")
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 1)

function getScalesImg(imageObject) {
    const imageAspectRatio = 694 / 706

    let displayWidth, displayHeight;
    const boxWidth = imageObject.node().getBoundingClientRect().width;
    const boxHeight = imageObject.node().getBoundingClientRect().height;
    if (boxWidth / boxHeight > imageAspectRatio) {
        // Constrain by height
        displayHeight = boxHeight;
        displayWidth = boxHeight * imageAspectRatio;
    } else {
        // Constrain by width
        displayWidth = boxWidth;
        displayHeight = boxWidth / imageAspectRatio;
    }

    const adjustedX = parseFloat(imageObject.attr("x")) + (boxWidth - displayWidth) / 2;
    const adjustedY = parseFloat(imageObject.attr("y")) + (boxHeight - displayHeight) / 2;

    const xScale = d3.scaleLinear()
        .domain([-6.713828086853027, 14.106171447783709])
    const yScale = d3.scaleLinear()
        .domain([-16.0518543086946, 5.128145217895508])

    xScale.range([adjustedX, adjustedX + displayWidth])
    yScale.range([adjustedY + displayHeight, adjustedY])

    return [xScale, yScale]
}

d3.csv("assets/data_d28_dyn.csv").then(data_dyn => {
    d3.csv("assets/data_d28_odom.csv").then(data_odom => {
        d3.csv("assets/data_d28_instant_odom.csv").then(data_odom_instant => {
            d3.csv("assets/data_d28_instant_dyn.csv").then(data_dyn_instant => {


                const graph_size = (container.offsetWidth - dist_to_legend) / 2
                const xScale = d3.scaleLinear()
                    .range([margin.left, graph_size])
                    .domain([0, 2.0])

                const yScale = d3.scaleLinear()
                    .range([container.offsetHeight - margin.bottom, margin.top])

                const xScale2 = d3.scaleLinear()
                    .range([graph_size + margin.left, container.offsetWidth - margin.right - dist_to_legend - margin.right])
                    .domain([0, 2.0])


                const yScale2 = d3.scaleLinear()
                    .range([container.offsetHeight - margin.bottom, margin.top])

                // Add graph titles
                svg.append("text")
                    .attr("transform", `translate(${xScale(1.0)},${margin.top / 2})`)
                    .style("text-anchor", "middle")
                    .text("Velocity, disc(28)")
                    .style("font-size", "12px")
                    .style("font-weight", "bold")

                svg.append("text")
                    .attr("transform", `translate(${xScale(1.0)},${margin.top- 5})`)
                    .style("text-anchor", "middle")
                    .text("+ dynamics")
                    .style("font-size", "12px")
                    .style("font-weight", "bold")

                svg.append("text")
                    .attr("transform", `translate(${xScale2(1.0)},${margin.top / 2 + 10})`)
                    .style("text-anchor", "middle")
                    .text("Velocity, disc(28)")
                    .style("font-size", "12px")
                    .style("font-weight", "bold")

                // Add grid and background
                svg.append("rect")
                    .attr("x", margin.left)
                    .attr("y", margin.top)
                    .attr("width", graph_size - margin.left)
                    .attr("height", container.offsetHeight - margin.top - margin.bottom)
                    .attr("fill", "#EFEFEF")
                    .attr("stroke", "#9B9B9B")

                svg.append("rect")
                    .attr("x", graph_size + margin.left)
                    .attr("y", margin.top)
                    .attr("width", graph_size - margin.left - 2 * margin.right)
                    .attr("height", container.offsetHeight - margin.top - margin.bottom)
                    .attr("fill", "#EFEFEF")
                    .attr("stroke", "#9B9B9B")

                // Add a legend
                const legend_fontsize = "12px"
                let legend = svg.append("g")
                    .attr("opacity", 0.75)
                    .attr("transform", `translate(${container.offsetWidth - dist_to_legend - margin.right},${margin.top + 5})`)

                legend.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", 110)
                    .attr("height", 55)
                    .attr("fill", "#FFFFFF")
                    .attr("rx", 5)
                    .attr("ry", 5)
                    .attr("opacity", 0.8)
                    .attr("stroke", "#000000")

                let legend_items = [["Damping", "#3b75af"], ["Response Time", "#ee8636"], ["Max Velocity", "#4f9a3d"], ["Odometry", "#8d69b8"]]

                legend.selectAll(".legend-item")
                    .data(legend_items)
                    .enter()
                    .append("g")
                    .attr("transform", (d, i) => `translate(10,${10 + 12 * i})`)
                    .attr("class", "legend-item")
                    .each(function (d) {
                        let item = d3.select(this)
                        item.append("circle")
                            .attr("cx", 0)
                            .attr("cy", 0)
                            .attr("r", 4)
                            .attr("fill", d[1])

                        item.append("text")
                            .attr("x", 10)
                            .attr("y", 0)
                            .text(d[0])
                            .style("font-size", legend_fontsize)
                            .style("dominant-baseline", "middle")

                    })


                function makeKalmanFigure(metric) {
                    let metric_data = [];

                    [data_dyn, data_odom].forEach(dataset => {
                        dataset.forEach(d => {
                            metric_data.push(+d[metric]);
                        });
                    });
                    yScale.domain([0, d3.max(metric_data)]);

                    let metric_data2 = [];

                    [data_dyn_instant, data_odom_instant].forEach(dataset => {
                        dataset.forEach(d => {
                            metric_data2.push(+d[metric]);
                        });
                    })
                    const maxMetricData2 = d3.max(metric_data2);
                    yScale2.domain([0, maxMetricData2]);


                    // Add X and Y axes
                    svg.append("g")
                        .attr("id", "x-axis")
                        .attr("transform", `translate(0,${yScale(0)})`)
                        .call(d3.axisBottom(xScale))

                    svg.append("g")
                        .attr("id", "y-axis")
                        .attr("transform", `translate(${xScale(0)},0)`)
                        .call(d3.axisLeft(yScale))

                    svg.append("g")
                        .attr("id", "x-axis2")
                        .attr("transform", `translate(0,${yScale2(0)})`)
                        .call(d3.axisBottom(xScale2))

                    svg.append("g")
                        .attr("id", "y-axis2")
                        .attr("transform", `translate(${xScale2(0)},0)`)
                        .call(d3.axisLeft(yScale2))


                    // Add labels
                    svg.append("text")
                        .attr("transform", `translate(${container.offsetWidth / 2},${container.offsetHeight - 10})`)
                        .style("text-anchor", "middle")
                        .text("Distance to belief")

                    svg.append("text")
                        .attr("id", "y-label")
                        .attr("transform", `translate(${margin.left / 3},${container.offsetHeight / 2}) rotate(-90)`)
                        .style("text-anchor", "middle")
                        .text(metric)


                    // Plot data points
                    svg.selectAll(".dot_dyn")
                        .data(data_dyn)
                        .enter().append("circle")
                        .attr("class", "dot_dyn")
                        .attr("cx", d => xScale(d.distance))
                        .attr("cy", d => yScale(d[metric]))
                        .attr("r", 4)
                        .attr("fill", d => {
                            if (d.test_type === "damping") {
                                return "#3b75af";
                            } else if (d.test_type === "time") {
                                return "#ee8636";
                            } else if (d.test_type === "max_vel") {
                                return "#4f9a3d";
                            }
                        })
                        .on("mouseover", function (event, d) {
                            kalman_tooltip.transition()
                                .duration(200)
                                .style("opacity", 1)
                                .style("left", (event.pageX) + "px")
                                .style("top", (event.pageY - 28) + "px");

                            const pred_corr_params = {
                                damp: {
                                    v: {acc: d["forward_acc_damp"], brk: d["forward_brk_damp"]},
                                    w: {acc: d["turn_acc_damp"], brk: d["turn_brk_damp"]}
                                }, time: {
                                    v: {acc: d["forward_acc_time"], brk: d["forward_brk_time"]},
                                    w: {acc: d["turn_acc_time"], brk: d["turn_brk_time"]}
                                }, maxvel: {v: d["forward_max_vel"], w: d["turn_max_vel"]}
                            }
                            let positions = simulateTrajectory(pred_corr_params)

                            tooltip_svg.selectAll("#pred_corr_path")
                                .datum(positions.map((d) => [d.x, d.y]))
                                .attr("d", d3.line()
                                    .x(d => tooltip_xScale(d[0]))
                                    .y(d => tooltip_yScale(d[1])))

                            tooltip_text.selectAll("*").remove()
                            tooltip_text.append("h6")
                                .text((d.test_type === "damping") ? "Damping" : (d.test_type === "time") ? "Response Time" : "Max Velocity")
                                .attr("class", "text-center")

                            tooltip_text.append("p")
                                .text(`Dist. to belief: ${parseFloat(d.distance).toFixed(4)}`)

                        })
                        .on("mouseout", function () {
                            kalman_tooltip.transition()
                                .style("opacity", 0);
                        })


                    svg.selectAll(".dot_dyn_instant")
                        .data(data_dyn_instant)
                        .enter().append("circle")
                        .attr("class", "dot_dyn_instant")
                        .attr("cx", d => xScale2(d.distance))
                        .attr("cy", d => yScale2(d[metric]))
                        .attr("r", 4)
                        .attr("fill", d => {
                            if (d.test_type === "damping") {
                                return "#3b75af";
                            } else if (d.test_type === "time") {
                                return "#ee8636";
                            } else if (d.test_type === "max_vel") {
                                return "#4f9a3d";
                            }
                        })
                        .on("mouseover", function (event, d) {
                            kalman_tooltip.transition()
                                .duration(200)
                                .style("opacity", 1)
                                .style("left", (event.pageX) + "px")
                                .style("top", (event.pageY - 28) + "px");

                            const pred_corr_params = {
                                damp: {
                                    v: {acc: d["forward_acc_damp"], brk: d["forward_brk_damp"]},
                                    w: {acc: d["turn_acc_damp"], brk: d["turn_brk_damp"]}
                                }, time: {
                                    v: {acc: d["forward_acc_time"], brk: d["forward_brk_time"]},
                                    w: {acc: d["turn_acc_time"], brk: d["turn_brk_time"]}
                                }, maxvel: {v: d["forward_max_vel"], w: d["turn_max_vel"]}
                            }
                            let positions = simulateTrajectory(pred_corr_params)

                            tooltip_svg.selectAll("#pred_corr_path")
                                .datum(positions.map((d) => [d.x, d.y]))
                                .attr("d", d3.line()
                                    .x(d => tooltip_xScale(d[0]))
                                    .y(d => tooltip_yScale(d[1])))

                            tooltip_text.selectAll("*").remove()
                            tooltip_text.append("h6")
                                .text((d.test_type === "damping") ? "Damping" : (d.test_type === "time") ? "Response Time" : "Max Velocity")
                                .attr("class", "text-center")

                            tooltip_text.append("p")
                                .text(`Dist. to belief: ${parseFloat(d.distance).toFixed(4)}`)

                        })
                        .on("mouseout", function () {
                            kalman_tooltip.transition()
                                .style("opacity", 0);
                        })


                    svg.selectAll(".dot_odom")
                        .data(data_odom)
                        .enter().append("circle")
                        .attr("class", "dot_odom")
                        .attr("cx", d => xScale(d.distance))
                        .attr("cy", d => yScale(d[metric]))
                        .attr("r", 4)
                        .attr("fill", "#8d69b8")
                        .on("mouseover", function (event, d) {
                            kalman_tooltip.transition()
                                .duration(200)
                                .style("opacity", 1)
                                .style("left", (event.pageX) + "px")
                                .style("top", (event.pageY - 28) + "px");

                            const bias = parseFloat(d.bias)
                            const covar_xx = parseFloat(d.covar_xx)
                            const covar_xth = parseFloat(d.covar_xth)
                            const covar_thth = parseFloat(d.covar_thth)

                            noisy_pos = add_noise(positions, bias, covar_xx, covar_xth, covar_thth)

                            tooltip_svg.selectAll("#pred_corr_path")
                                .datum(noisy_pos.map((d) => [d.x, d.y]))
                                .attr("d", d3.line()
                                    .x(d => tooltip_xScale(d[0]))
                                    .y(d => tooltip_yScale(d[1])))
                            tooltip_text.selectAll("*").remove()
                            tooltip_text.append("h6")
                                .text(`Odometry noise`)
                                .attr("class", "text-center")

                            tooltip_text.append("p")
                                .text(`Dist. to belief: ${parseFloat(d.distance).toFixed(4)}`)

                        })
                        .on("mouseout", function () {
                            kalman_tooltip.transition()
                                .style("opacity", 0);
                        })

                    svg.selectAll(".dot_odom_instant")
                        .data(data_odom_instant)
                        .enter().append("circle")
                        .attr("class", "dot_odom_instant")
                        .attr("cx", d => xScale2(d.distance))
                        .attr("cy", d => yScale2(d[metric]))
                        .attr("r", 4)
                        .attr("fill", "#8d69b8")
                        .on("mouseover", function (event, d) {
                            kalman_tooltip.transition()
                                .duration(200)
                                .style("opacity", 1)
                                .style("left", (event.pageX) + "px")
                                .style("top", (event.pageY - 28) + "px");

                            const bias = parseFloat(d.bias)
                            const covar_xx = parseFloat(d.covar_xx)
                            const covar_xth = parseFloat(d.covar_xth)
                            const covar_thth = parseFloat(d.covar_thth)

                            noisy_pos = add_noise(positions, bias, covar_xx, covar_xth, covar_thth)

                            tooltip_svg.selectAll("#pred_corr_path")
                                .datum(noisy_pos.map((d) => [d.x, d.y]))
                                .attr("d", d3.line()
                                    .x(d => tooltip_xScale(d[0]))
                                    .y(d => tooltip_yScale(d[1])))
                            tooltip_text.selectAll("*").remove()
                            tooltip_text.append("h6")
                                .text(`Odometry noise`)
                                .attr("class", "text-center")

                            tooltip_text.append("p")
                                .text(`Dist. to belief: ${parseFloat(d.distance).toFixed(4)}`)

                        })
                        .on("mouseout", function () {
                            kalman_tooltip.transition()
                                .style("opacity", 0);
                        })

                }

                function updateKalmanFigure(metric) {
                    let metric_data = [];
                    let metric_data2 = [];

                    [data_dyn, data_odom].forEach(dataset => {
                        dataset.forEach(d => {
                            metric_data.push(+d[metric]);
                        });
                    });

                    [data_dyn_instant, data_odom_instant].forEach(dataset => {
                        dataset.forEach(d => {
                            metric_data2.push(+d[metric]);
                        });
                    })

                    yScale.domain([0, d3.max(metric_data)]);
                    yScale2.domain([0, d3.max(metric_data2)]);

                    svg.select("#y-axis")
                        .transition()
                        .duration(1000)
                        .call(d3.axisLeft(yScale))

                    svg.select("#y-axis2")
                        .transition()
                        .duration(1000)
                        .call(d3.axisLeft(yScale2))


                    svg.select("#y-label")
                        .text(metric)

                    svg.selectAll(".dot_dyn")
                        .transition()
                        .duration(1000)
                        .attr("cy", d => yScale(d[metric]))


                    svg.selectAll(".dot_odom")
                        .transition()
                        .duration(1000)
                        .attr("cy", d => yScale(d[metric]))


                    svg.selectAll(".dot_dyn_instant")
                        .transition()
                        .duration(1000)
                        .attr("cy", d => yScale2(d[metric]))


                    svg.selectAll(".dot_odom_instant")
                        .transition()
                        .duration(1000)
                        .attr("cy", d => yScale2(d[metric]))


                }

                makeKalmanFigure("Success")
                d3.select("#metric-selector").selectAll("label").on("click", function () {
                    metric = d3.select(this).select("input").attr("id");
                    updateKalmanFigure(metric)
                });
            })
        })
    })
})


function add_noise(positions, bias, cov_xx, cov_xth, cov_thth) {
    const mu = [bias, 0, 0]
    const sigma = [[cov_xx, 0.0, cov_xth], [0, 1, 0], [cov_xth, 0, cov_thth]]

    drifts = [[0.0, 0.0, 0.0]]
    noisy_positions = []

    for (let i = 1; i < positions.length + 1; i++) {
        noise = generateMultivariateGaussian(mu, sigma, 1)[0]
        noise[1] = 0.0
        drift_th = drifts[i - 1][2] + noise[2]
        costh = Math.cos(drift_th)
        sinth = Math.sin(drift_th)

        drift_x = drifts[i - 1][0] + costh * noise[0] - sinth * noise[1]
        drift_y = drifts[i - 1][1] + sinth * noise[0] + costh * noise[1]

        drifts.push([drift_x, drift_y, drift_th])

        noisy_positions.push({
            x: positions[i - 1].x + drifts[i][0],
            y: positions[i - 1].y + drifts[i][1],
            theta: positions[i - 1].theta + drifts[i][2]
        })
    }
    return noisy_positions
}


function generateMultivariateGaussian(mu, sigma, numSamples) {
    const n = mu.length;
    const cholesky = choleskyDecomposition(sigma);
    const samples = [];

    for (let i = 0; i < numSamples; i++) {
        // Generate a standard normal sample vector
        const standardSample = Array.from({length: n}, () => d3.randomNormal(0, 1)());

        // Apply the Cholesky transformation
        const sample = standardSample.map((_, j) => mu[j] + cholesky[j].reduce((sum, ch, k) => sum + ch * standardSample[k], 0));

        samples.push(sample);
    }

    return samples;
}

/**
 * Cholesky decomposition of a positive-definite matrix.
 * @param {Array} matrix - 2D covariance matrix.
 * @returns {Array} Lower triangular matrix L such that L * L^T = matrix.
 */
function choleskyDecomposition(matrix) {
    const n = matrix.length;
    const L = Array.from({length: n}, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = matrix[i][j];
            for (let k = 0; k < j; k++) {
                sum -= L[i][k] * L[j][k];
            }
            L[i][j] = i === j ? Math.sqrt(sum) : sum / L[j][j];
        }
    }
    return L;
}
