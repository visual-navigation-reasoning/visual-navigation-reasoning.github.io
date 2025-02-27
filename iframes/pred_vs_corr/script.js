// Set dimensions and margins
const margin = {top: 40, right: 5, bottom: 60, left: 90, width: 2000, height: 500};

const dist_to_legend = 250

const demo_action_sequences = [
    [4, 4, 4, 4, 22, 22, 23, 22, 21, 23, 22, 22, 21, 21, 22],
    // [5, 3, 3, 3, 21, 3, 23, 23, 11, 23, 9, 23, 22, 17, 21],
    [5, 3, 3, 23, 11, 21, 23, 22, 21, 22, 23, 21, 21, 21, 21],
    [17, 22, 21, 22, 22, 21, 21, 21, 22, 22, 22, 21, 21, 21, 23],
    [22, 22, 22, 23, 25, 23, 22, 22, 22, 21, 23, 22, 22, 22, 21],
]
const demo_action_sequence_instant = [
    [21, 23, 23, 1, 23, 23, 22, 22, 22, 22, 22, 1, 1, 22, 6],
    // [1, 17, 17, 17, 1, 1, 1, 1, 17, 17, 17, 11, 11, 11, 11],
    [3, 23, 1, 1, 23, 23, 22, 6, 23, 23, 23, 11, 11, 11, 11],
    [21, 23, 1, 22, 23, 22, 23, 22, 21, 22, 23, 1, 11, 11, 1],
    [1, 1, 1, 22, 22, 22, 22, 22, 22, 22, 1, 22, 22, 22, 22],
]
var default_params = {
    damp: {v: {acc: 0.7, brk: 0.7}, w: {acc: 0.7, brk: 0.7}},
    time: {v: {acc: 0.26, brk: 0.24}, w: {acc: 0.28, brk: 0.27}},
    maxvel: {v: 0.996, w: 2.914}
}


var default_params_instant = {
    damp: {v: {acc: 0.5, brk: 0.5}, w: {acc: 0.5, brk: 0.5}},
    time: {v: {acc: 0.3333333, brk: 0.3333333}, w: {acc: 0.3333333, brk: 0.3333333}},
    maxvel: {v: 0.996, w: 2.914}
}



const svg = d3.select("#prediction-correction")
    .append("svg")
    .attr("viewBox", `0 0 ${margin.width} ${margin.height}`)
    .attr("width", '100%')
    .attr("height", '100%')
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g");


const gt_positions = demo_action_sequences.map(
    actionSeq => simulateDBelief(
        default_params,
        actionSeq,
        false
    )
)

const gt_positions_instant = demo_action_sequence_instant.map(
    actionSeq => simulateDBelief(
        default_params_instant,
        actionSeq,
        true
    )
)

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


tooltip_svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", tooltip_svg.attr("width"))
    .attr("height", tooltip_svg.attr("height"))
    .attr("fill", "#EFEFEF")
    .attr("rx", 5)


const tooltip_xScale = d3.scaleLinear().range([10, 190])
const tooltip_yScale = d3.scaleLinear().range([190, 10])


function simulateDBelief(params, actionSeq, is_instant = false) {
    let state = {
        acc: {v: 0, w: 0},
        vel: {v: 0, w: 0},
        pos: {x: 0, y: 0, theta: 0}
    }
    const num_steps = (is_instant) ? 1 : 10
    let physics_param = getPhysicsParams(params)
    const dt = (is_instant) ? 1 / 3 : 1 / 30
    let positions = []
    for (let i = 0; i < actionSeq.length; i++) {
        const cmd = actionIdToCommand(actionSeq[i], max_vel);
        for (let step = 0; step < num_steps; step++) {
            state = dynamics(state, cmd, physics_param, dt)
        }
        positions.push({x: state.pos.x, y: state.pos.y})
    }
    return positions
}

// Add Axis
tooltip_svg.append("g")
    .attr("id", "tooltip-x-axis")


tooltip_svg.append("g")
    .attr("id", "tooltip-y-axis")

const seqColorMap = d3.scaleOrdinal(d3.schemeTableau10)

d3.csv("assets/data_d28_dyn.csv").then(data_dyn => {
    d3.csv("assets/data_d28_odom.csv").then(data_odom => {
        d3.csv("assets/data_d28_instant_odom.csv").then(data_odom_instant => {
            d3.csv("assets/data_d28_instant_dyn.csv").then(data_dyn_instant => {


                const graph_size = (margin.width - dist_to_legend) / 2
                const xScale = d3.scaleLinear()
                    .range([margin.left, graph_size])
                    .domain([0, 2.0])

                const yScale = d3.scaleLinear()
                    .range([margin.height - margin.bottom, margin.top])

                const xScale2 = d3.scaleLinear()
                    .range([graph_size + margin.left, margin.width - margin.right - dist_to_legend - margin.right])
                    .domain([0, 2.0])


                const yScale2 = d3.scaleLinear()
                    .range([margin.height - margin.bottom, margin.top])

                // Add graph titles
                svg.append("text")
                    .attr("transform", `translate(${xScale(1.0)},${margin.top / 2})`)
                    .style("text-anchor", "middle")
                    .text("D28-dynamics")
                    .style("font-size", "2.5rem")
                    .style("font-weight", "bold")

                svg.append("text")
                    .attr("transform", `translate(${xScale2(1.0)},${margin.top / 2 + 10})`)
                    .style("text-anchor", "middle")
                    .text("D28-instant")
                    .style("font-size", "2.5rem")
                    .style("font-weight", "bold")

                // Add grid and background
                svg.append("rect")
                    .attr("x", margin.left)
                    .attr("y", margin.top)
                    .attr("width", graph_size - margin.left)
                    .attr("height", margin.height - margin.top - margin.bottom)
                    .attr("fill", "#EFEFEF")
                    .attr("stroke", "#9B9B9B")

                svg.append("rect")
                    .attr("x", graph_size + margin.left)
                    .attr("y", margin.top)
                    .attr("width", graph_size - margin.left - 2 * margin.right)
                    .attr("height", margin.height - margin.top - margin.bottom)
                    .attr("fill", "#EFEFEF")
                    .attr("stroke", "#9B9B9B")

                // Add a legend
                const legend_fontsize = "2rem"
                let legend = svg.append("g")
                    // .attr("opacity", 0.75)
                    .attr("transform", `translate(${margin.width - dist_to_legend - margin.right},${margin.top + 5})`)

                const legend_height = 200
                legend.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", dist_to_legend)
                    .attr("height", legend_height)
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
                    .attr("transform", (d, i) => `translate(20,${20 + i * (dist_to_legend - 40) / 4})`)
                    .attr("class", "legend-item")
                    .each(function (d) {
                        let item = d3.select(this)
                        item.append("circle")
                            .attr("cx", -5)
                            .attr("cy", 0)
                            .attr("r", 10)
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
                        .style("font-size", "1.5rem")

                    svg.append("g")
                        .attr("id", "y-axis")
                        .attr("transform", `translate(${xScale(0)},0)`)
                        .call(d3.axisLeft(yScale))
                        .style("font-size", "1.5rem")

                    svg.append("g")
                        .attr("id", "x-axis2")
                        .attr("transform", `translate(0,${yScale2(0)})`)
                        .call(d3.axisBottom(xScale2))
                        .style("font-size", "1.5rem")

                    svg.append("g")
                        .attr("id", "y-axis2")
                        .attr("transform", `translate(${xScale2(0)},0)`)
                        .call(d3.axisLeft(yScale2))
                        .style("font-size", "1.5rem")


                    // Add labels
                    svg.append("text")
                        .attr("transform", `translate(${margin.width / 2 - dist_to_legend / 2},${margin.height})`)
                        .style("text-anchor", "middle")
                        .text("Distance to belief")
                        .style("font-size", "2rem")

                    svg.append("text")
                        .attr("id", "y-label")
                        .attr("transform", `translate(${0},${margin.height / 2}) rotate(-90)`)
                        .style("text-anchor", "middle")
                        .attr("dominant-baseline", "hanging")
                        .text(metric)
                        .style("font-size", "2rem")


                    // Plot data points
                    svg.selectAll(".dot_dyn")
                        .data(data_dyn)
                        .enter().append("circle")
                        .attr("class", "dot_dyn")
                        .attr("cx", d => xScale(d.distance))
                        .attr("cy", d => yScale(d[metric]))
                        .attr("r", 5)
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


                            const pred_corr_params = {
                                damp: {
                                    v: {acc: d["forward_acc_damp"], brk: d["forward_brk_damp"]},
                                    w: {acc: d["turn_acc_damp"], brk: d["turn_brk_damp"]}
                                }, time: {
                                    v: {acc: d["forward_acc_time"], brk: d["forward_brk_time"]},
                                    w: {acc: d["turn_acc_time"], brk: d["turn_brk_time"]}
                                }, maxvel: {v: d["forward_max_vel"], w: d["turn_max_vel"]}
                            }

                            positions = demo_action_sequences.map(
                                actionSeq => simulateDBelief(pred_corr_params, actionSeq)
                            )
                            updateTooltip(
                                event,
                                positions,
                                (d.test_type === "damping") ? "Damping" : (d.test_type === "time") ? "Response Time" : "Max Velocity",
                                d.distance,
                                false
                            )

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
                        .attr("r", 5)
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
                            let positions = demo_action_sequence_instant.map(
                                actionSeq => simulateDBelief(pred_corr_params, actionSeq)
                            )

                            updateTooltip(
                                event,
                                positions,
                                (d.test_type === "damping") ? "Damping" : (d.test_type === "time") ? "Response Time" : "Max Velocity",
                                d.distance,
                                true
                            )
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
                        .attr("r", 5)
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


                            let noisy_pos = gt_positions.map(
                                (d) => add_noise(d, bias, covar_xx, covar_xth, covar_thth)
                            )
                            updateTooltip(
                                event,
                                noisy_pos,
                                "Odometry noise",
                                d.distance,
                                false
                            )
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
                        .attr("r", 5)
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

                            let noisy_pos = gt_positions_instant.map(
                                (d) => add_noise(d, bias, covar_xx, covar_xth, covar_thth)
                            )
                            updateTooltip(
                                event,
                                noisy_pos,
                                "Odometry noise",
                                d.distance,
                                true
                            )


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
                        .style("font-size", "2rem")

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

function updateTooltip(event, positions, txt, distance, isInstant) {
    kalman_tooltip.transition()
        .duration(200)
        .style("opacity", 1)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");


    let current_gt_pos = (isInstant) ? gt_positions_instant : gt_positions

    const [xMax, xMin] = d3.extent(current_gt_pos.map(d => d.map(d => d.x)).flat())
    const [yMax, yMin] = d3.extent(current_gt_pos.map(d => d.map(d => d.y)).flat())
    const maxRange = d3.max([Math.abs(xMin), Math.abs(xMax), Math.abs(yMin), Math.abs(yMax)])
    const f = 1.1;
    tooltip_xScale.domain([f * maxRange, -f * maxRange])
    tooltip_yScale.domain([f * maxRange, -f * maxRange])

    d3.select("#tooltip-y-axis")
        .attr("transform", `translate(${tooltip_xScale(0)},0)`)
        .call(d3.axisLeft(tooltip_yScale).ticks(5))
        .attr("font-size", "1rem")
        .attr("color", "#000000")

    d3.select("#tooltip-x-axis")
        .attr("transform", `translate(0,${tooltip_yScale(0)})`)
        .call(d3.axisBottom(tooltip_xScale).ticks(5))
        .attr("font-size", "1rem")
        .attr("color", "#000000")

    const shift = 5
    for (let i=0; i<shift; i++) {
        let dummy = seqColorMap(i)
    }
    tooltip_svg.selectAll(".GT-path").remove()
    tooltip_svg.selectAll(".GT-path")
        .data(current_gt_pos)
        .enter()
        .append("path")
        .attr("class", "GT-path")
        .datum(d => d.map((d) => [d.x, d.y]))
        .attr("fill", "none")
        .attr("stroke", (d, i) => seqColorMap(i+shift))
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => tooltip_xScale(d[0]))
            .y(d => tooltip_yScale(d[1])))

    tooltip_svg.selectAll(".pred-path").remove()
    tooltip_svg.selectAll(".pred-path")
        .data(positions)
        .enter()
        .append("path")
        .attr("class", "pred-path")
        .datum(d => d.map((d) => [d.x, d.y]))
        .attr("fill", "none")
        .attr("stroke", (d, i) => seqColorMap(i+shift))
        .attr("stroke-dasharray", "5,5")
        .attr("stroke-width", 1)
        .attr("d", d3.line()
            .x(d => tooltip_xScale(d[0]))
            .y(d => tooltip_yScale(d[1])))

    // Paint the area between gt_positions and positions
    tooltip_svg.selectAll(".areas").remove()
    tooltip_svg.selectAll(".areas")
        .data(current_gt_pos.map((d, i) => [d, positions[i]]))
        .enter()
        .append("path")
        .attr("class", "areas")
        .datum(d => [d[0].map(d => [d.x, d.y]), d[1].map(d => [d.x, d.y])])
        .attr("fill", (d, i) => seqColorMap(i+shift))
        .attr("fill-opacity", 0.2)
        .attr("stroke", "none")
        .attr("d", d => {
            let area = d3.area()
                .x(d => tooltip_xScale(d[0]))
                .y0(d => tooltip_yScale(d[1]))
            // Add (0, 0) to at first and last point to close the area
            d[0].unshift([0, 0])
            d[1].unshift([0, 0])
            return area(d[0].concat(d[1].reverse()))
        })

    tooltip_text.selectAll("*").remove()
    tooltip_text.append("h6")
        .text(txt)
        .attr("class", "text-center")

    tooltip_text.append("p")
        .text(`Dist. to belief: ${parseFloat(distance).toFixed(4)}`)
}

function dynamics(
    state,
    cmd,
    physics_params, dt = 1 / 30
) {
    let acc_sqf = physics_params.acc_sqf
    let brk_sqf = physics_params.brk_sqf
    let acc_2zf = physics_params.acc_2zf
    let brk_2zf = physics_params.brk_2zf
    let acc_sat = physics_params.acc_sat
    let brk_sat = physics_params.brk_sat
    let max_vel = physics_params.max_vel

    err = {v: cmd.v - state.vel.v, w: cmd.w - state.vel.w}
    is_acc = {v: err.v * state.vel.v >= 0, w: err.w * state.vel.w >= 0}
    sqf = {v: is_acc.v ? acc_sqf.v : brk_sqf.v, w: is_acc.w ? acc_sqf.w : brk_sqf.w}
    _2zf = {v: is_acc.v ? acc_2zf.v : brk_2zf.v, w: is_acc.w ? acc_2zf.w : brk_2zf.w}
    sat = {v: is_acc.v ? acc_sat.v : brk_sat.v, w: is_acc.w ? acc_sat.w : brk_sat.w}

    jerk = {v: sqf.v * err.v - _2zf.v * state.acc.v, w: sqf.w * err.w - _2zf.w * state.acc.w}

    state.acc.v += dt * jerk.v
    state.acc.w += dt * jerk.w

    state.acc.v = Math.min(Math.max(state.acc.v, -sat.v), sat.v)
    state.acc.w = Math.min(Math.max(state.acc.w, -sat.w), sat.w)

    state.vel.v += dt * state.acc.v
    state.vel.w += dt * state.acc.w

    state.vel.v = Math.min(Math.max(state.vel.v, 0), max_vel.v)
    state.vel.w = Math.min(Math.max(state.vel.w, -max_vel.w), max_vel.w)


    state.pos.theta += dt * state.vel.w
    state.pos.x += dt * state.vel.v * Math.cos(state.pos.theta)
    state.pos.y += dt * state.vel.v * Math.sin(state.pos.theta)

    return state
}

function simulateTrajectory(params) {
    let state = {
        acc: {v: 0, w: 0},
        vel: {v: 0, w: 0},
        pos: {x: 2.810481, y: 0.45980492, theta: 0.4560953094639628 + 3.1415 / 2}
    }
    let physics_param = getPhysicsParams(params)

    let positions = []
    for (let i = 0; i < actionSequence.length; i++) {
        const cmd = actionIdToCommand(actionSequence[i], max_vel);
        for (let step = 0; step < 10; step++) {
            state = dynamics(state, cmd, physics_param)
        }
        positions.push({x: state.pos.x, y: state.pos.y})
    }
    return positions
}
function getPhysicsParams(params) {
    acc_time = {v: params.time.v.acc, w: params.time.w.acc}
    brk_time = {v: params.time.v.brk, w: params.time.w.brk}
    acc_damp = {v: params.damp.v.acc, w: params.damp.w.acc}
    brk_damp = {v: params.damp.v.brk, w: params.damp.w.brk}
    acc_sat = {v: 2.058, w: 5.082}
    brk_sat = {v: 1.845, w: 3.37}
    max_vel = params.maxvel


    acc_sqf = {v: 1 / acc_time.v ** 2, w: 1 / acc_time.w ** 2}
    brk_sqf = {v: 1 / brk_time.v ** 2, w: 1 / brk_time.w ** 2}
    acc_2zf = {v: 2 * acc_damp.v / acc_time.v, w: 2 * acc_damp.w / acc_time.w}
    brk_2zf = {v: 2 * brk_damp.v / brk_time.v, w: 2 * brk_damp.w / brk_time.w}

    return {
        "acc_sqf": acc_sqf,
        "brk_sqf": brk_sqf,
        "acc_2zf": acc_2zf,
        "brk_2zf": brk_2zf,
        "acc_sat": acc_sat,
        "brk_sat": brk_sat,
        "max_vel": max_vel
    }
}

function actionIdToCommand(actionId, maxvel) {
    const result = [];

    const lin_values = Array.from({length: 4}, (_, l) => l * maxvel.v / 3);
    const ang_values = Array.from({length: 4}, (_, a) => a * maxvel.w / 3);

    lin_values.forEach(lin => {
        ang_values.forEach((ang, a) => {
            const signs = a > 0 ? [1, -1] : [1];
            signs.forEach(s => {
                result.push({"v": lin, "w": s * ang});
            });
        });
    });
    return result[actionId];
}