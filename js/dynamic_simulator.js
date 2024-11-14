const marginStepResponse = {top: 20, right: 10, bottom: 10, left: 30, sep: 40}
const marginSampleTrajectory = {top: 20, right: 10, bottom: 10, left: 30, sep: 40}
const marginActionSpace = {top: 20, right: 10, bottom: 30, left: 10, sep: 40}

const actionSequence = [5, 5, 22, 3, 3, 21, 22, 22, 22, 23, 21, 21, 21, 21, 25, 21, 21, 21, 3, 21, 21, 3, 21, 22, 22, 23, 25, 25, 22, 22, 21, 22, 21, 21, 23, 23, 4, 4, 4, 4, 4, 22, 22, 22, 21, 21, 21, 21, 21, 22, 22, 22, 21, 23, 3, 11, 22, 4, 22, 18, 9, 3, 3, 3, 1, 23, 11, 23, 22, 22, 21, 21, 22, 21, 23, 21, 22, 21, 22, 21, 22, 22, 22, 22, 21, 23, 22, 21, 21, 21, 25, 21, 25, 23, 23, 22, 21, 23, 23, 7, 7, 3, 8, 7, 0, 0, 0,]

var default_params = {
    damp: {v: {acc: 0.7, brk: 0.7}, w: {acc: 0.7, brk: 0.7}},
    time: {v: {acc: 0.26, brk: 0.24}, w: {acc: 0.28, brk: 0.27}},
    maxvel: {v: 0.996, w: 2.914}
}
var params = {
    damp: {v: {acc: 0.7, brk: 0.7}, w: {acc: 0.7, brk: 0.7}},
    time: {v: {acc: 0.26, brk: 0.24}, w: {acc: 0.28, brk: 0.27}},
    maxvel: {v: 0.996, w: 2.914}
}

stepResponseContainer = document.getElementById("dyn-step-response")
sampleTrajectoryContainer = document.getElementById("dyn-sample-traj")
actionSpaceContainer = document.getElementById("dyn-action-space")

var svgStepResponse = d3.select("#dyn-step-response")
    .append("svg")
    .attr("width", '100%')
    .attr("height", '100%')
    .append("g")

var svgSampleTrajectory = d3.select("#dyn-sample-traj")
    .append("svg")
    .attr("width", '100%')
    .attr("height", '100%')
    .append("g")

var svgActionSpace = d3.select("#dyn-action-space")
    .append("svg")
    .attr("width", '100%')
    .attr("height", '100%')
    .append("g")


const xScaleStepResponse = d3.scaleLinear()
    .domain([0, 1])
    .range([marginStepResponse.left, stepResponseContainer.offsetWidth - marginStepResponse.right])
const yScaleStepResponse = d3.scaleLinear()
    .domain([0, 1])
    .range([marginStepResponse.top, stepResponseContainer.offsetHeight - marginStepResponse.bottom])

const xScaleSampleTrajectory = d3.scaleLinear()
    .domain([0, 1])
    .range([marginSampleTrajectory.left, sampleTrajectoryContainer.offsetWidth - marginSampleTrajectory.right])
const yScaleSampleTrajectory = d3.scaleLinear()
    .domain([0, 1])
    .range([marginSampleTrajectory.top, sampleTrajectoryContainer.offsetHeight - marginSampleTrajectory.bottom])

const xScaleActionSpace = d3.scaleLinear()
    .domain([0, 1])
    .range([marginActionSpace.left, actionSpaceContainer.offsetWidth - marginActionSpace.right])
const yScaleActionSpace = d3.scaleLinear()
    .domain([0, 1])
    .range([marginActionSpace.top, actionSpaceContainer.offsetHeight - marginActionSpace.bottom])


const linear_velocity_xScale = d3.scaleLinear()
    .domain([0, 10]) // seconds
    .range([xScaleStepResponse(0), xScaleStepResponse(1)])
const linear_velocity_yScale = d3.scaleLinear()
    .domain([1, 0]) // m/s
    .range([yScaleStepResponse(0), yScaleStepResponse(0.5) - marginStepResponse.sep / 2])
const angular_velocity_xScale = d3.scaleLinear()
    .domain([0, 10]) // seconds
    .range([xScaleStepResponse(0), xScaleStepResponse(1)])
const angular_velocity_yScale = d3.scaleLinear()
    .domain([3.1415, -3.1415]) // rad/s
    .range([yScaleStepResponse(0.5) + marginStepResponse.sep / 2, yScaleStepResponse(1)])

const position_xScale = d3.scaleLinear()
    .domain([-6.713828086853027, 14.106171447783709])
const position_yScale = d3.scaleLinear()
    .domain([-16.0518543086946, 5.128145217895508])

const action_space_xScale = d3.scaleLinear()
    .domain([-1, 1])
    .range([xScaleActionSpace(0), xScaleActionSpace(1)])
const action_space_yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([yScaleActionSpace(1), yScaleActionSpace(0)])

// Add tooltip div to the body
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0)  // Initially hidden
    .style("font-size", "12px")
    .style("box-shadow", "0px 4px 8px rgba(0, 0, 0, 0.3)");

// CSS for tooltip arrow
tooltip.append("div")
    .attr("class", "tooltip-arrow")
    .style("width", 0)
    .style("height", 0)
    .style("border-left", "5px solid transparent")
    .style("border-right", "5px solid transparent")
    .style("border-top", "5px solid rgba(0, 0, 0, 0.7)")
    .style("position", "absolute")
    .style("bottom", "-5px")
    .style("left", "50%")
    .style("transform", "translateX(-50%)");


function drawStepResponse(svg) {
    svg.append("g")
        .attr("transform", "translate(0, " + (linear_velocity_yScale(0)) + ")")
        .call(d3.axisBottom(linear_velocity_xScale)
            .tickValues([2, 4, 6, 8, 10])
        );
    svg.append("g")
        .attr("transform", "translate(" + (linear_velocity_xScale(0)) + ",0)")
        .call(d3.axisLeft(linear_velocity_yScale)
            .tickValues([0, 0.5, 1])
        );

    svg.append("rect")
        .attr("x", linear_velocity_xScale(0))
        .attr("y", linear_velocity_yScale(1))
        .attr("width", linear_velocity_xScale(10) - linear_velocity_xScale(0))
        .attr("height", linear_velocity_yScale(0) - linear_velocity_yScale(1))
        .attr("fill", "steelblue")
        .attr("opacity", 0.2)




    svg.append("g")
        .attr("transform", "translate(0, " + (angular_velocity_yScale(0)) + ")")
        .call(d3.axisBottom(angular_velocity_xScale)
            .tickValues([2, 4, 6, 8, 10])
        );
    svg.append("g")
        .attr("transform", "translate(" + (angular_velocity_xScale(0)) + ",0)")
        .call(d3.axisLeft(angular_velocity_yScale)
            .tickValues([3.1415, 3.1415 / 2, 0, -3.1415 / 2, -3.1415])
            // make the ticks look like pi
            .tickFormat(d3.format(".1f"))
            .tickFormat(d => d === 0 ? "0" : d === 3.1415 ? "π" : d === -3.1415 ? "-π" : d === 3.1415 / 2 ? "π/2" : "-π/2")
        );

    svg.append("rect")
        .attr("x", angular_velocity_xScale(0))
        .attr("y", angular_velocity_yScale(3.1415))
        .attr("width", angular_velocity_xScale(10) - angular_velocity_xScale(0))
        .attr("height", angular_velocity_yScale(-3.1415) - angular_velocity_yScale(3.1415))
        .attr("fill", "#ea3636")
        .attr("opacity", 0.2)

    for (let i = 0; i < 11; i++) {
        svg.append("line")
            .attr("x1", linear_velocity_xScale(i))
            .attr("y1", linear_velocity_yScale(0))
            .attr("x2", linear_velocity_xScale(i))
            .attr("y2", linear_velocity_yScale(1))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.2)

        svg.append("line")
            .attr("x1", linear_velocity_xScale(0))
            .attr("y1", linear_velocity_yScale(i / 10))
            .attr("x2", linear_velocity_xScale(10))
            .attr("y2", linear_velocity_yScale(i / 10))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.2)

        svg.append("line")
            .attr("x1", angular_velocity_xScale(i))
            .attr("y1", angular_velocity_yScale(-3.1415))
            .attr("x2", angular_velocity_xScale(i))
            .attr("y2", angular_velocity_yScale(3.1415))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.2)

        svg.append("line")
            .attr("x1", angular_velocity_xScale(0))
            .attr("y1", angular_velocity_yScale(2*i * 3.1415 / 10 - 3.1415))
            .attr("x2", angular_velocity_xScale(10))
            .attr("y2", angular_velocity_yScale(2*i * 3.1415 / 10 - 3.1415))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.2)
    }

    svg.append("text")
        .attr("x", linear_velocity_xScale(10))
        .attr("y", linear_velocity_yScale(0) - 5)
        .text("Time (s)")
        .attr("text-anchor", "end")
        .attr("font-size", "8px")

    svg.append("text")
        .attr("x", angular_velocity_xScale(10))
        .attr("y", angular_velocity_yScale(0) - 5)
        .text("Time (s)")
        .attr("text-anchor", "end")
        .attr("font-size", "8px")

    svg.append("text")
        .attr("x", linear_velocity_xScale(5))
        .attr("y", linear_velocity_yScale(1) - 5)
        .text("Linear Velocity (m/s)")
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("dominant-baseline", "baseline")

    svg.append("text")
        .attr("x", angular_velocity_xScale(5))
        .attr("y", angular_velocity_yScale(3.1415) - 5)
        .text("Angular Velocity (rad/s)")
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("dominant-baseline", "baseline")


    var velocities = simulateStepResponse(params)

    // Draw commands
    svg.append("path")
        .datum(velocities.map((d, i) => [i / 30, d.v]))
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5")
        .attr("d", d3.line()
            .x(d => linear_velocity_xScale(d[0]))
            .y((d, i) => linear_velocity_yScale(i > 150 ? 0 : 0.7)))

    svg.append("path")
        .datum(velocities.map((d, i) => [i / 30, d.w]))
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5")
        .attr("d", d3.line()
            .x(d => angular_velocity_xScale(d[0]))
            .y((d, i) => angular_velocity_yScale(i > 150 ? 0 : 2)))

    svg.append("path")
        .datum(velocities.map((d, i) => [i / 30, d.v]))
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => linear_velocity_xScale(d[0]))
            .y(d => linear_velocity_yScale(d[1])))
        .attr("opacity", 0.5)

    svg.append("path")
        .datum(velocities.map((d, i) => [i / 30, d.w]))
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => angular_velocity_xScale(d[0]))
            .y(d => angular_velocity_yScale(d[1])))
        .attr("opacity", 0.5)


    svg.append("path")
        .attr("id", "traj_lin")
        .datum(velocities.map((d, i) => [i / 30, d.v]))
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => linear_velocity_xScale(d[0]))
            .y(d => linear_velocity_yScale(d[1])))

    svg.append("path")
        .attr("id", "traj_ang")
        .datum(velocities.map((d, i) => [i / 30, d.w]))
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => angular_velocity_xScale(d[0]))
            .y(d => angular_velocity_yScale(d[1])))

}

function drawSampleTrajectory(svg) {
    const img_width = 694
    const img_height = 706
    const imageAspectRatio = img_width / img_height

    img = svg.append("svg:image")
        .attr('x', xScaleSampleTrajectory(0))
        .attr('y', yScaleSampleTrajectory(0))
        .attr('width', xScaleSampleTrajectory(1) - xScaleSampleTrajectory(0))
        .attr('height', yScaleSampleTrajectory(1) - yScaleSampleTrajectory(0))
        .attr("xlink:href", "assets/map.png")

    let displayWidth, displayHeight;
    const boxWidth = parseInt(img.attr('width'));
    const boxHeight = parseInt(img.attr('height'));
    if (boxWidth / boxHeight > imageAspectRatio) {
        // Constrain by height
        displayHeight = boxHeight;
        displayWidth = boxHeight * imageAspectRatio;
    } else {
        // Constrain by width
        displayWidth = boxWidth;
        displayHeight = boxWidth / imageAspectRatio;
    }

    const adjustedX = parseFloat(img.attr("x")) + (boxWidth - displayWidth) / 2;
    const adjustedY = parseFloat(img.attr("y")) + (boxHeight - displayHeight) / 2;

    position_xScale.range([adjustedX, adjustedX + displayWidth])
    position_yScale.range([adjustedY + displayHeight, adjustedY])

    var positions = simulateTrajectory(params)

    svg.append("circle")
        .attr("cx", position_xScale(positions[0].x))
        .attr("cy", position_yScale(positions[0].y))
        .attr("r", 5)
        .attr("fill", "red")

    svg.append("circle")
        .attr("cx", position_xScale(positions[positions.length - 1].x))
        .attr("cy", position_yScale(positions[positions.length - 1].y))
        .attr("r", 5)
        .attr("fill", "green")


    svg.append("path")
        .datum(positions.map((d, i) => [d.x, d.y]))
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5")
        .attr("d", d3.line()
            .x(d => position_xScale(d[0]))
            .y(d => position_yScale(d[1])))

    svg.append("path")
        .datum(positions.map((d, i) => [d.x, d.y]))
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => position_xScale(d[0]))
            .y(d => position_yScale(d[1])))
        .attr("opacity", 0.5)

    svg.append("path")
        .attr("id", "traj_pos")
        .datum(positions.map((d, i) => [d.x, d.y]))
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => position_xScale(d[0]))
            .y(d => position_yScale(d[1])))
}

function drawActionSpace(svg) {
    svg.append("g")
        .attr("transform", "translate(0, " + (action_space_yScale(0)) + ")")
        .call(d3.axisBottom(action_space_xScale)
            .tickValues([-1, -0.5, 0, 0.5, 1])
        );
    svg.append("g")
        .attr("transform", "translate(" + (action_space_xScale(0)) + ",0)")
        .call(d3.axisLeft(action_space_yScale)
            .tickValues([0.2, 0.4, 0.6, 0.8, 1])
        );
    for (let i = -10; i < 11; i++) {
        svg.append("line")
            .attr("x1", action_space_xScale(i / 10))
            .attr("y1", action_space_yScale(0))
            .attr("x2", action_space_xScale(i / 10))
            .attr("y2", action_space_yScale(1))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.2)

        svg.append("line")
            .attr("x1", action_space_xScale(-1))
            .attr("y1", action_space_yScale(i / 10))
            .attr("x2", action_space_xScale(1))
            .attr("y2", action_space_yScale(i / 10))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.2)
    }

    svg.append("text")
        .attr("x", action_space_xScale(1))
        .attr("y", action_space_yScale(0) - 5)
        .text("X")
        .attr("text-anchor", "end")
        .attr("font-size", "18px")

    svg.append("text")
        .attr("x", action_space_xScale(0) + 5)
        .attr("y", action_space_yScale(1) + 5)
        .text("Y")
        .attr("text-anchor", "start")
        .attr("alignment-baseline", "hanging")
        .attr("font-size", "18px")


    redrawActionSpace()
}

drawStepResponse(svgStepResponse)
drawSampleTrajectory(svgSampleTrajectory)
drawActionSpace(svgActionSpace)


function redraw() {
    velocities = simulateStepResponse(params)
    positions = simulateTrajectory(params)
    traj_lin = svgStepResponse.select("#traj_lin")
    traj_ang = svgStepResponse.select("#traj_ang")
    traj_pos = svgSampleTrajectory.select("#traj_pos")

    traj_lin.datum(velocities.map((d, i) => [i / 30, d.v]))
        .attr("d", d3.line()
            .x(d => linear_velocity_xScale(d[0]))
            .y(d => linear_velocity_yScale(d[1]))
        )

    traj_ang.datum(velocities.map((d, i) => [i / 30, d.w]))
        .attr("d", d3.line()
            .x(d => angular_velocity_xScale(d[0]))
            .y(d => angular_velocity_yScale(d[1]))
        )

    traj_pos.datum(positions.map((d, i) => [d.x, d.y]))
        .attr("d", d3.line()
            .x(d => position_xScale(d[0]))
            .y(d => position_yScale(d[1])))

    redrawActionSpace()

}

function redrawActionSpace() {
    svgActionSpace.selectAll(".action").remove()
    let physics_params = getPhysicsParams(params)

    const cmap = d3.scaleSequential(d3.interpolateRainbow)
        .domain([0, 28])

    for (let i = 0; i < 28; i++) {
        state = {
            acc: {v: 1, w: 0},
            vel: {v: 0, w: 0},
            pos: {x: 0, y: 0, theta: 0}
        }

        cmd = actionIdToCommand(i, params.maxvel)
        for (let step = 0; step < 30; step++) {
            state = dynamics(state, cmd, physics_params)
        }
        // bezier arrow from (0, 0) to (x, y) with anchor point at (0, y)
        const path = d3.path()
        path.moveTo(action_space_xScale(0), action_space_yScale(0))
        path.bezierCurveTo(action_space_xScale(0), action_space_yScale(0), action_space_xScale(0), action_space_yScale(state.pos.x), action_space_xScale(state.pos.y), action_space_yScale(state.pos.x))

        svgActionSpace.append("path")
            .attr("class", "action")
            .attr("d", path)
            .attr("stroke", cmap(i))
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .on("mouseover", function (event) {
                // Show tooltip with action info
                tooltip.style("opacity", 1)
                    .html(`Action ID: ${i}<br>Linear Velocity: ${cmd.v.toFixed(2)}<br>Angular Velocity: ${cmd.w.toFixed(2)}`);
            })
            .on("mousemove", function (event) {
                // Move tooltip to cursor position
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 40}px`);
            })
            .on("mouseout", function () {
                // Hide tooltip
                tooltip.style("opacity", 0);
            });

        svgActionSpace.append("circle")
            .attr("class", "action")
            .datum(cmd)
            .attr("cx", action_space_xScale(state.pos.y))
            .attr("cy", action_space_yScale(state.pos.x))
            .attr("r", 3)
            .attr("fill", cmap(i))
            .on("mouseover", function (event, d) {
                // Show tooltip with action info
                tooltip.style("opacity", 1)
                    .html(`Action ID: ${i}<br>Lin. vel. cmd: ${d.v.toFixed(2)}<br>Ang. vel. cmd.: ${d.w.toFixed(2)}`);
            })
            .on("mousemove", function (event) {
                // Move tooltip to cursor position
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 40}px`);
            })
            .on("mouseout", function () {
                // Hide tooltip
                tooltip.style("opacity", 0);
            });
    }

}


// Import image and draw


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

function dynamics(
    state,
    cmd,
    physics_params
) {
    let acc_sqf = physics_params.acc_sqf
    let brk_sqf = physics_params.brk_sqf
    let acc_2zf = physics_params.acc_2zf
    let brk_2zf = physics_params.brk_2zf
    let acc_sat = physics_params.acc_sat
    let brk_sat = physics_params.brk_sat
    let max_vel = physics_params.max_vel

    const dt = 1 / 30
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


function simulateStepResponse(params) {

    let state = {
        acc: {v: 0, w: 0},
        vel: {v: 0, w: 0},
        pos: {x: 0, y: 0, theta: 0}
    }
    var cmd = {v: 0.7, w: 2}


    var physics_params = getPhysicsParams(params)

    var velocities = []
    for (let t = 0; t < 300; t++) {
        if (t > 150) {
            cmd = {v: 0, w: 0}
        }
        state = dynamics(state, cmd, physics_params)
        velocities.push({v: state.vel.v, w: state.vel.w})
    }
    return velocities
}


// Slider elements
const damping_sliders = [document.getElementById('damp-lin-acc-slider'), document.getElementById('damp-ang-acc-slider'), document.getElementById('damp-lin-brk-slider'), document.getElementById('damp-ang-brk-slider')];
const damping_sliderValues = [document.getElementById('damp-lin-acc-value'), document.getElementById('damp-ang-acc-value'), document.getElementById('damp-lin-brk-value'), document.getElementById('damp-ang-brk-value')];

const time_sliders = [document.getElementById('time-lin-acc-slider'), document.getElementById('time-ang-acc-slider'), document.getElementById('time-lin-brk-slider'), document.getElementById('time-ang-brk-slider')];
const time_sliderValues = [document.getElementById('time-lin-acc-value'), document.getElementById('time-ang-acc-value'), document.getElementById('time-lin-brk-value'), document.getElementById('time-ang-brk-value')];


// Main damping slider
const dampingSlider = document.getElementById('damp-slider');
const timeSlider = document.getElementById('time-slider');

const LinearMaxVelSlider = document.getElementById('lin-maxvel-slider');
const AngularMaxVelSlider = document.getElementById('ang-maxvel-slider');
const LinearMaxVelValue = document.getElementById('lin-maxvel-value');
const AngularMaxVelValue = document.getElementById('ang-maxvel-value');

dampingSlider.value = params.damp.v.acc;
damping_sliders[0].value = params.damp.v.acc;
damping_sliders[1].value = params.damp.w.acc;
damping_sliders[2].value = params.damp.v.brk;
damping_sliders[3].value = params.damp.w.brk;

damping_sliderValues.forEach((value, index) => {
    value.textContent = (Math.round(damping_sliders[index].value * 100) / 100).toFixed(2);
})

timeSlider.value = params.time.v.acc;
time_sliders[0].value = params.time.v.acc;
time_sliders[1].value = params.time.w.acc;
time_sliders[2].value = params.time.v.brk;
time_sliders[3].value = params.time.w.brk;

time_sliderValues.forEach((value, index) => {
    value.textContent = (Math.round(time_sliders[index].value * 100) / 100).toFixed(2);
})

LinearMaxVelSlider.value = params.maxvel.v;
AngularMaxVelSlider.value = params.maxvel.w;
LinearMaxVelValue.textContent = (Math.round(params.maxvel.v * 100) / 100).toFixed(2)
AngularMaxVelValue.textContent = (Math.round(params.maxvel.w * 100) / 100).toFixed(2)

const damping_defaults = [
    default_params.damp.v.acc,
    default_params.damp.w.acc,
    default_params.damp.v.brk,
    default_params.damp.w.brk
]

const time_defaults = [
    default_params.time.v.acc,
    default_params.time.w.acc,
    default_params.time.v.brk,
    default_params.time.w.brk
]

const maxvel_defaults = [
    default_params.maxvel.v,
    default_params.maxvel.w
]

// Update individual slider value displays
damping_sliders.forEach((slider, index) => {
    slider.addEventListener('input', () => {

        // Make the default value magnetic
        if (Math.abs(slider.value - damping_defaults[index]) < 0.05) {
            slider.value = damping_defaults[index];
        }

        v = Math.round(slider.value * 100) / 100;
        damping_sliderValues[index].textContent = v.toFixed(2);

        params.damp.v.acc = damping_sliders[0].value;
        params.damp.w.acc = damping_sliders[1].value;
        params.damp.v.brk = damping_sliders[2].value;
        params.damp.w.brk = damping_sliders[3].value;
        redraw()
    });
});

time_sliders.forEach((slider, index) => {
    slider.addEventListener('input', () => {

        // Make the default value magnetic
        if (Math.abs(slider.value - time_defaults[index]) < 0.05) {
            slider.value = time_defaults[index];
        }

        v = Math.round(slider.value * 100) / 100;
        time_sliderValues[index].textContent = v.toFixed(2);

        params.time.v.acc = time_sliders[0].value;
        params.time.w.acc = time_sliders[1].value;
        params.time.v.brk = time_sliders[2].value;
        params.time.w.brk = time_sliders[3].value;
        redraw()
    });
})

// Update all sliders when main slider is adjusted
dampingSlider.addEventListener('input', () => {
    damping_sliders.forEach((slider, index) => {
        slider.value = dampingSlider.value;
        v = Math.round(dampingSlider.value * 100) / 100;
        damping_sliderValues[index].textContent = v.toFixed(2)
    });
    params.damp.v.acc = damping_sliders[0].value;
    params.damp.w.acc = damping_sliders[1].value;
    params.damp.v.brk = damping_sliders[2].value;
    params.damp.w.brk = damping_sliders[3].value;
    redraw()
});

timeSlider.addEventListener('input', () => {
    time_sliders.forEach((slider, index) => {
        slider.value = timeSlider.value;
        v = Math.round(timeSlider.value * 100) / 100;
        time_sliderValues[index].textContent = v.toFixed(2)
    });
    params.time.v.acc = time_sliders[0].value;
    params.time.w.acc = time_sliders[1].value;
    params.time.v.brk = time_sliders[2].value;
    params.time.w.brk = time_sliders[3].value;
    redraw()
});

LinearMaxVelSlider.addEventListener('input', () => {
    params.maxvel.v = LinearMaxVelSlider.value;

    if (Math.abs(LinearMaxVelSlider.value - maxvel_defaults[0]) < 0.1) {
        LinearMaxVelSlider.value = maxvel_defaults[0];
    }
    // Force two significant figures
    v = Math.round(LinearMaxVelSlider.value * 100) / 100;
    LinearMaxVelValue.textContent = v.toFixed(2)

    redraw()
});

AngularMaxVelSlider.addEventListener('input', () => {
    params.maxvel.w = AngularMaxVelSlider.value;

    if (Math.abs(AngularMaxVelSlider.value - maxvel_defaults[1]) < 0.1) {
        AngularMaxVelSlider.value = maxvel_defaults[1];
    }
    v = Math.round(AngularMaxVelSlider.value * 100) / 100;
    AngularMaxVelValue.textContent = v.toFixed(2)
    redraw()
});

// Reset button
const resetButton = document.getElementById('reset-button');
resetButton.addEventListener('click', () => {
    damping_sliders.forEach((slider, index) => {
        slider.value = damping_defaults[index];
        damping_sliderValues[index].textContent = damping_defaults[index];
    });

    time_sliders.forEach((slider, index) => {
        slider.value = time_defaults[index];
        time_sliderValues[index].textContent = time_defaults[index];
    });

    LinearMaxVelSlider.value = maxvel_defaults[0];
    AngularMaxVelSlider.value = maxvel_defaults[1];
    LinearMaxVelValue.textContent = maxvel_defaults[0];
    AngularMaxVelValue.textContent = maxvel_defaults[1];

    params.damp.v.acc = damping_defaults[0];
    params.damp.w.acc = damping_defaults[1];
    params.damp.v.brk = damping_defaults[2];
    params.damp.w.brk = damping_defaults[3];

    params.time.v.acc = time_defaults[0];
    params.time.w.acc = time_defaults[1];
    params.time.v.brk = time_defaults[2];
    params.time.w.brk = time_defaults[3];

    params.maxvel.v = maxvel_defaults[0];
    params.maxvel.w = maxvel_defaults[1];
    redraw()
})

d3.select("#episode-selector").selectAll("label").on("click", function () {
    const ep = d3.select(this).select("input").attr("id");
    d3.select("#ep-video").attr("src", `assets/episodes/${ep}.mp4`)
});