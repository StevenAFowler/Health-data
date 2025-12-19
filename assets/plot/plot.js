// Reference for structure and approach: 
//    https://www.d3indepth.com/geographic
//

import { select } from 'https://esm.sh/d3-selection';
import { geoPath, geoMercator } from 'https://esm.sh/d3-geo';
import { json } from 'https://esm.sh/d3-fetch';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// import { sliderBottom } from "https://unpkg.com/d3-simple-slider";

/////
// Map area
/////

const svgMap = document.getElementById("svgMap");
const widthMap = svgMap.width.baseVal.value;
const heightMap = svgMap.height.baseVal.value;

let projection = geoMercator()
	.scale(widthMap / 2.5 / Math.PI)
	.translate([widthMap / 2, heightMap / 2])
	.center([0, 0]);

let geoGenerator = geoPath()
	.projection(projection);

// 
function handleMouseover(e, d) {
	let pixelArea = geoGenerator.area(d);
	let bounds = geoGenerator.bounds(d);
	// let centroid = geoGenerator.centroid(d);
	let measure = geoGenerator.measure(d);

	select('#content .info')
		.text(`${d.properties.ADMIN} (${d.properties.ADM0_A3})`)
	// .text(d.properties.ADMIN + ' (abb: ' + d.properties.ADM0_A3 + ' path.measure = ' + measure.toFixed(1) + ')');

	select('#content .bounding-box rect')
		.attr('x', bounds[0][0])
		.attr('y', bounds[0][1])
		.attr('width', bounds[1][0] - bounds[0][0])
		.attr('height', bounds[1][1] - bounds[0][1]);

	// select('#content .centroid')
	// 	.style('display', 'inline')
	// 	.attr('transform', 'translate(' + centroid + ')');
}

function handleMouseclick(e, d) {
	console.log(`Click: ${d.properties.ADM0_A3}`)
	filterCountry = d.properties.ADM0_A3;

	select('#plotTitle').text(`${d.properties.ADMIN} (${d.properties.ADM0_A3})`);
	updatePlot();
}

// Data and color scale
// TODO:Change colour scheme and dynamic
const colorScale = d3.scaleThreshold()
	.domain([40, 50, 60, 65, 70, 75, 80])
	.range(d3.schemeYlGnBu[8]);

const legendScale = d3.scaleLinear()
	.domain([40, 50, 60, 65, 70, 75, 80])
	.range([0, 50]);

const legendAxis = d3.axisBottom(legendScale)
	.ticks(8)
	.tickFormat(d3.format(".0f"));

function updateMapPlot() {
	filterData();

	let u = select('#content g.map')
		.selectAll('path')
		.data(geojson.features);

	// Enter
	u.enter()
		.append('path')
		.attr('d', geoGenerator)
		// set the color of each country
		.attr("fill", function (geoJson) {
			geoJson.total = filteredDataMap.get(geoJson.properties.ADM0_A3) || 0;
			// console.log("Color enter...");
			return colorScale(geoJson.total);
		})
		.on('mouseover', handleMouseover)
		.on('click', handleMouseclick);

	// Update
	u
		.attr("fill", function (geoJson) {
			geoJson.total = filteredDataMap.get(geoJson.properties.ADM0_A3) || 0;
			// console.log("Color update...");
			return colorScale(geoJson.total);
		});

	// End
	u.exit().remove();
}

function initialisePlot() {

	// Get selection options
	const sexArray = rawData.value.map(list => list.Dim1);
	const sexGroups = [...new Set(sexArray)];

	const yearArray = rawData.value.map(list => list.TimeDim);
	const yearGroups = [...new Set(yearArray)];

	// TODO: Add colour to legend
	// d3.select('#svgMap')
	// 	.append("g")
	// 	.attr("transform", "translate(0, 550)")
    // 	.call(legendAxis);

	// Dropdown
	d3.select("#sexOption")
		.selectAll('myOptions')
		.data(sexGroups)
		.enter()
		.append('option')
		.text(function (d) { return d; })
		.attr("value", function (d) { return d; })

	filterSex = d3.select("#sexOption").property("value");

	d3.select("#sexOption").on("input", function (event, d) {
		filterSex = d3.select(this).property("value")
		console.log(`sexFilter: ${filterSex}`);
		updateMapPlot()
		updatePlot();
	})

	// Slider
	d3.select("#slider")
		.attr("min", Math.min(...yearGroups))
		.attr("max", Math.max(...yearGroups))
		.attr("value", Math.max(...yearGroups))
		.attr("step", "1")

	filterYear = +d3.select("#slider").property("value");

	d3.select("#slider").on("input", function (d) {
		filterYear = +this.value;
		console.log(`yearFilter: ${filterYear}`);
		updateMapPlot();
	})

	d3.select('#markers')
		.selectAll('myOptions')
		.data(yearGroups)
		.enter()
		.append('option')
		.attr("value", function (d) { return d; })
		.attr("label", function (d) { return d; })
		.text(function (d) { return d; })

	filterData();
}

function filterData() {
	const filteredData = rawData.value.filter(function (d) {
		return (d.Dim1 === filterSex && d.TimeDim === filterYear);
	});

	filteredDataMap = new Map(filteredData.map(
		jsonValueLine => [jsonValueLine.SpatialDim, jsonValueLine.NumericValue]
	));
}

const rangeInput = document.getElementById('slider');
const valueDisplay = document.getElementById('sliderOut');

rangeInput.addEventListener('input', function () {
	valueDisplay.textContent = this.value;
})

/////
// Plot area
/////

// set the dimensions and margins of the graph
const margin = { top: 10, right: 100, bottom: 50, left: 50 },
	widthPlot = widthMap - margin.left - margin.right,
	heightPlot = heightMap / 2 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svgPlot = d3.select("#plotArea")
	.append("svg")
	.attr("width", widthPlot + margin.left + margin.right)
	.attr("height", heightPlot + margin.top + margin.bottom)
	.append("g")
	.attr("transform",
		"translate(" + margin.left + "," + margin.top + ")");

// const svgPlot = d3.select("#plotArea")
// 	.append("svg")
// 	.attr("viewBox", `0 0 ${widthPlot + margin.left + margin.right} ${heightPlot + margin.top + margin.bottom}`)
// 	.append("g")
// 	.attr("transform",
// 		"translate(" + margin.left + "," + margin.top + ")");


let x;
let y;
function plotInitiation() {
	// Add X axis 
	x = d3.scaleLinear()
		.domain([
			d3.min(rawData.value, function (d) { return +d.TimeDim }),
			d3.max(rawData.value, function (d) { return +d.TimeDim })
		])
		.range([0, widthPlot]);
	const xAxis = d3.axisBottom(x)
		.ticks(5)
		.tickFormat(d3.format(".0f"));
	svgPlot.append("g")
		.attr("transform", "translate(0," + heightPlot + ")")
		.call(xAxis);
		// .call(d3.axisBottom(x));

	svgPlot.append("text")
		.attr("text-anchor", "end")
		.attr("x", widthPlot/2 + margin.left)
      	.attr("y", heightPlot + margin.top + 30)
      	.text("Year of estimate");

	// Add Y axis
	y = d3.scaleLinear()
		.domain([
			d3.min(rawData.value, function (d) { return +d.NumericValue }),
			d3.max(rawData.value, function (d) { return +d.NumericValue })
		])
		.range([heightPlot, 0]);
	svgPlot.append("g")
		.call(d3.axisLeft(y));

	svgPlot.append("text")
		.attr("text-anchor", "end")
		.attr("transform", "rotate(-90)")
		.attr("y", -margin.left + 20)
      	.attr("x", -margin.top - heightPlot/2 + 120)
      	.text("Life expectancy at birth (years)");
}

// Updateplot
function updatePlot() {
	let filteredData = rawData.value.filter(function (d) {
		return (d.Dim1 === filterSex &&
			d.SpatialDim === filterCountry);
		// return (d.SpatialDim === filterCountry);
	});

	filteredData = d3.sort(filteredData, d => +d.TimeDim)

	// Create a update selection: bind to the new data
	let u = svgPlot.selectAll(".lineTest")
		.data([filteredData], function (d) { return +d.TimeDim });

	// Update the line
	u
		.enter()
		.append("path")
		.attr("class", "lineTest")
		.merge(u)
		.transition()
		.duration(1000)
		.attr("d", d3.line()
			.x(function (d) { return x(+d.TimeDim); })
			.y(function (d) { return y(+d.NumericValue); }))
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-width", 2.5)
}


/////
// Initialise D3
/////

// Data
let geojson;
let rawData;			// Raw data imported from Json
// let filteredData;		// Filtered data in array format
let filteredDataMap;	// Filtered data with value cast to Map() for plotting

// Active data filters
let filterYear;
let filterSex;
let filterCountry = "CAN";

// REQUEST DATA
Promise.all([
	json("assets/plot/ne_110m_admin_0_map_units.json"),
	json("assets/plot/WHOSIS_000001.json")
]).then(function (loadData) {

	rawData = loadData[1];
	geojson = loadData[0];
	initialisePlot();
	plotInitiation();
	updateMapPlot();  // Initial drawing for map based on filtered data
	updatePlot();
});
