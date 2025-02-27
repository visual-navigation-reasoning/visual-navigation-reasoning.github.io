const shapleyMargins = {top: 20, right: 70, bottom: 20, left: 100, width: 1000, height: 500};


const shapleySvg = d3.select('#shapley-plot')
    .append('svg')
    .attr('viewBox', `0 0 ${shapleyMargins.width} ${shapleyMargins.height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr("width", '100%')
    .attr("height", '100%')
    .append("g")


const shapleyXScale = d3.scaleLinear()
    .domain([-0.2, 1.1])
    .range([shapleyMargins.left, shapleyMargins.width - shapleyMargins.right]);

const shapleyYScale = d3.scaleBand()
    .domain(["rgb", "scan", "odom", "loc", "prev_act"])
    .range([shapleyMargins.height - shapleyMargins.bottom, shapleyMargins.top])
    .padding(0.1);


const yNum = d3.scaleLinear()
    .range([shapleyYScale.bandwidth() / 2, -shapleyYScale.bandwidth() / 2]);

const properLabels = {
    "rgb": "RGB",
    "scan": "Scan",
    "odom": "Odometry",
    "loc": "Localization",
    "prev_act": "Prev. Action"
}

shapleySvg.append("linearGradient")
    .attr("id", "violinGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .selectAll("stop")
    .data([
        {
            offset: "0%",
            color: "#1872cc"
        },
        {
            offset: "50%",
            color: "#ffffff"
        },
        {
            offset: "100%",
            color: "#dc143c"
        }
    ])
    .enter().append("stop")
    .attr("offset", function (d) {
        return d.offset;
    })
    .attr("stop-color", function (d) {
        return d.color;
    });


shapleySvg.append("rect")
    .attr("x", shapleyMargins.left)
    .attr("y", shapleyMargins.top)
    .attr("width", shapleyMargins.width - shapleyMargins.right - shapleyMargins.left)
    .attr("height", shapleyMargins.height - shapleyMargins.bottom - shapleyMargins.top)
    .style("fill", "url(#violinGradient)")
    .attr("opacity", 0.5)


// Add a grid
shapleySvg.append("g")
    .attr("class", "grid")
    .attr("transform", "translate(0," + (shapleyMargins.height - shapleyMargins.bottom) + ")")
    .call(d3.axisBottom(shapleyXScale)
        .tickSize(-shapleyMargins.height + shapleyMargins.top + shapleyMargins.bottom)
        .tickFormat("")
    )
    .style("color", "white");

shapleySvg.append("g")
    .attr("class", "grid")
    .attr("transform", "translate(" + shapleyMargins.left + ",0)")
    .call(d3.axisLeft(shapleyYScale)
        .tickSize(-shapleyMargins.width + shapleyMargins.left + shapleyMargins.right)
        .tickFormat("")
    )
    .style("color", "white");


// Add a color bar : red = high impact blue = low impact

const colorbarGap = 50
const legend = shapleySvg.append("g")
    .attr("class", "legendLinear")
    .attr("transform", "translate(" + (shapleyMargins.width - 10) + "," + (shapleyMargins.height - shapleyMargins.top - colorbarGap / 2) + ") rotate(-90)");
legend.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", shapleyMargins.height - shapleyMargins.bottom - shapleyMargins.top - colorbarGap)
    .attr("height", 20)
    .style("fill", "url(#violinGradient)")

legend.append("text")
    .attr("transform", "rotate(90)")
    .attr("x", 0)
    .attr("y", 20)
    .text("Low Impact")
    .style("font-size", "1rem")
    // .attr("dominant-baseline", "middle")
    .attr("text-anchor", "middle")


const labels = ["rgb", "scan", "odom", "loc", "prev_act"]
legend.append("text")
    .attr("transform", "rotate(90)")
    .attr("x", 1)
    .attr("y", -shapleyMargins.height + shapleyMargins.bottom + shapleyMargins.top + colorbarGap - 5)
    .text("High Impact")
    .style("font-size", "1rem")
    // .attr("dominant-baseline", "middle")
    .attr("text-anchor", "middle")


const shapleyViolin = shapleySvg.append("g")
const shapleyTooltip = shapleySvg.append("g").attr("opacity", 0)
const shapleyBar = shapleySvg.append("line")
    .attr("x1", shapleyMargins.left)
    .attr("x2", shapleyMargins.left)
    .attr("y1", shapleyMargins.top)
    .attr("y2", shapleyMargins.height - shapleyMargins.bottom)
    .style("stroke", "black").attr("opacity", 0)
    .style("stroke-width", 2);


shapleySvg.append("g")
    .attr("transform", "translate(0," + (shapleyMargins.height - shapleyMargins.bottom) + ")")
    .call(d3.axisBottom(shapleyXScale));

shapleySvg.append("g")
    .attr("id", "y-axis-shapley")
    .attr("transform", "translate(" + shapleyMargins.left + ",0)")
    .call(d3.axisLeft(shapleyYScale)
        // Change tick labels to be more readable
        .tickFormat(function (d) {
            return properLabels[d]
        })
    )
    .style("font-size", "1rem");


let sumStatSPL = []
let maxNumSPL = 0
let sumStatSR = []
let maxNumSR = 0

let currentMetric = d3.select("#violin-selector").selectAll("label").filter(function () {
    return this.control.checked
}).nodes()[0].innerText
let currentSumState = null;
let currentMaxNum = 0;


d3.json("assets/shapley_spl_values.json").then(function (data) {
    var histogram = d3.histogram()
        .value(d => d)
        .domain(shapleyXScale.domain())
        .thresholds(shapleyXScale.ticks(100));

    for (const [key, value] of Object.entries(data)) {
        const bins = histogram(value);
        sumStatSPL.push({key: key, value: bins.map(b => [b.x0, b.length / value.length * 100])});
        maxNumSPL = Math.max(maxNumSPL, sumStatSPL[sumStatSPL.length - 1].value.reduce((a, b) => Math.max(a, b[1]), 0));
    }
    makeViolin()
})


d3.json("assets/shapley_sr_values.json").then(function (data) {
    var histogram = d3.histogram()
        .value(d => d)
        .domain(shapleyXScale.domain())
        .thresholds(shapleyXScale.ticks(100));

    for (const [key, value] of Object.entries(data)) {
        const bins = histogram(value);
        sumStatSR.push({key: key, value: bins.map(b => [b.x0, b.length / value.length * 100])});
        maxNumSR = Math.max(maxNumSR, sumStatSR[sumStatSR.length - 1].value.reduce((a, b) => Math.max(a, b[1]), 0));
    }


})

function updateViolin() {

    yNum.domain([-currentMaxNum, currentMaxNum])
    shapleyViolin.selectAll(".violin")
        .data(currentSumState)
        .select("path")
        .datum(function (d) {
            return (d.value)
        })
        .transition()
        .attr("d", d3.area()
            .x(function (d) {
                return (shapleyXScale(d[0]));
            })
            .y0(function (d) {
                return (yNum(-d[1]));
            })
            .y1(function (d) {
                return (yNum(d[1]));
            })
            .curve(d3.curveCatmullRom)
        )
}

d3.select("#violin-selector").selectAll("label").on("click", function () {
    currentMetric = this.innerText
    if (currentMetric === "SPL") {
        currentSumState = sumStatSPL
        currentMaxNum = maxNumSPL
    } else {
        currentSumState = sumStatSR
        currentMaxNum = maxNumSR
    }
    updateViolin()
})


function makeViolin() {

    if (currentMetric === "SPL") {
        currentSumState = sumStatSPL
        currentMaxNum = maxNumSPL

    } else {
        currentSumState = sumStatSR
        currentMaxNum = maxNumSR
    }

    yNum.domain([-currentMaxNum, currentMaxNum])

    shapleyViolin.selectAll(".violin")
        .data(currentSumState)
        .enter()
        .append("g")
        .attr("class", "violin")
        .attr("transform", function (d) {
            return ("translate(0," + (shapleyYScale(d.key) + shapleyYScale.bandwidth() / 2) + ")");
        })
        .attr("id", d => {
            return "violin-" + d.key
        })
        .append("path")
        .datum(function (d) {
            return (d.value)
        })
        .style("stroke", "white")
        .style("stroke-width", 0)
        .style("fill", "#316cf4")
        .attr("d", d3.area()
            .x(function (d) {
                return (shapleyXScale(d[0]));
            })
            .y0(function (d) {
                return (yNum(-d[1]));
            })
            .y1(function (d) {
                return (yNum(d[1]));
            })
            .curve(d3.curveCatmullRom)
        )
        .on("mouseover", function () {
            const currentLabel = d3.select(this.parentNode).datum().key
            shapleyViolin.selectAll("path").attr("opacity", 0.25)
            shapleySvg.select("#y-axis-shapley").selectAll("text").attr("opacity", 0.25)
            d3.select(this).attr("opacity", 1)
            shapleySvg.select("#y-axis-shapley").selectAll("text").filter(function () {
                const label = d3.select(this).text()
                return label === properLabels[currentLabel]
            }).attr("opacity", 1)
        })
        .on("mouseleave", function () {
            shapleyViolin.selectAll("path").attr("opacity", 1)
            shapleySvg.select("#y-axis-shapley").selectAll("text").attr("opacity", 1)
        })

    const boxHeight = 25
    labels.forEach(label => {
        shapleyTooltip.append("g")
            .attr("id", "tooltip-" + label);

        shapleyTooltip.select("#tooltip-" + label).append("rect")
            .attr("x", 10)
            .attr("y", shapleyYScale(label) - boxHeight / 2 + shapleyYScale.bandwidth() / 2 - 10)
            .attr("width", 75)
            .attr("height", boxHeight)
            .attr("fill", "white")
            .style("opacity", 0.5)
            .attr("rx", 5)

        shapleySvg.select("#tooltip-" + label).append("text")
            .attr("x", 20)
            .attr("y", shapleyYScale(label) + shapleyYScale.bandwidth() / 2 - 10)
            .text("0.00%")
            .style("fill", "black")
            .style("font-size", "1rem")
            .style("text-anchor", "start")
            .style("dominant-baseline", "middle")
    })

    shapleySvg.on("mousemove", function (event) {
        shapleyTooltip.attr("opacity", 1)
        shapleyBar.attr("opacity", 1)
        const x = d3.pointer(event)[0] - 1;
        shapleyBar.attr("x1", x).attr("x2", x)
        shapleyTooltip.attr("transform", "translate(" + x + ",0)")

        let nearestIndex = d3.bisectLeft(shapleyXScale.ticks(100), shapleyXScale.invert(x));

        nearestIndex = Math.min(nearestIndex, 130)

        labels.forEach((label, i) => {
            shapleyTooltip.select("#tooltip-" + label)
                .transition()
                .duration(50)
                .attr("transform", "translate(0," + yNum(currentSumState[i].value[nearestIndex][1]) + ")")
                .select("text")
                .text(currentSumState[i].value[nearestIndex][1].toFixed(2) + "%")
        })
    })
        .on("mouseleave", function () {
            shapleyTooltip.attr("opacity", 0)
            shapleyBar.attr("opacity", 0)
        })
}