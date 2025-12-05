// Reference for structure and approach: 
//    https://www.d3indepth.com/geographic
//

import { select } from 'https://esm.sh/d3-selection';
import { geoPath, geoMercator } from 'https://esm.sh/d3-geo';
import { json } from 'https://esm.sh/d3-fetch';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"; 
// import { sliderBottom } from "https://unpkg.com/d3-simple-slider";

const svg = document.getElementById("svg");
const width = svg.width.baseVal.value;
const height = svg.height.baseVal.value;

console.log(`${width}, ${height}`)
let projection = geoMercator()
	.scale(width / 2.5 / Math.PI)
	.translate([width / 2, height / 2])
	.center([0, 0]);

let geoGenerator = geoPath()
	.projection(projection);

// 
function handleMouseover(e, d) {
//   console.log(`${Object.keys(d.properties)}`);
	let pixelArea = geoGenerator.area(d);
	let bounds = geoGenerator.bounds(d);
	let centroid = geoGenerator.centroid(d);
	let measure = geoGenerator.measure(d);

	select('#content .info')
		.text(d.properties.ADMIN + ' (path.area = ' + pixelArea.toFixed(1) + ' path.measure = ' + measure.toFixed(1) + ')');

	select('#content .bounding-box rect')
		.attr('x', bounds[0][0])
		.attr('y', bounds[0][1])
		.attr('width', bounds[1][0] - bounds[0][0])
		.attr('height', bounds[1][1] - bounds[0][1]);

	select('#content .centroid')
		.style('display', 'inline')
		.attr('transform', 'translate(' + centroid + ')');
}

// Data and color scale
const colorScale = d3.scaleThreshold()
    .domain([20, 30, 50, 60, 80, 100])
    .range(d3.schemeBlues[7]);

function updateMapPlot() {
	// console.log("...UPDATE...");

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
		.on('mouseover', handleMouseover);

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

function initialisePlot(){

	// Get selection options
	const sexArray = rawData.value.map(list => list.Dim1);
	const sexGroups = [...new Set(sexArray)];

	const yearArray = rawData.value.map(list => list.TimeDim);
	const yearGroups = [...new Set(yearArray)];
	
	// Dropdown
	d3.select("#sexOption")
		.selectAll('myOptions')
			.data(sexGroups)
		.enter()
			.append('option')
			.text(function (d){ return d; })
			.attr("value", function (d) { return d; })

	filterSex = d3.select("#sexOption").property("value");

	d3.select("#sexOption").on("input", function(event, d) {
		filterSex = d3.select(this).property("value")
		console.log(`sexFilter: ${filterSex}`);
		updateMapPlot()
		})

	// Slider
	d3.select("#slider")
		.attr("min", Math.min(...yearGroups))
		.attr("max", Math.max(...yearGroups))
		.attr("value", Math.max(...yearGroups))
		.attr("step", "1")
		
	filterYear = +d3.select("#slider").property("value");

	d3.select("#slider").on("input", function(d){
		filterYear = +this.value;
		console.log(`yearFilter: ${filterYear}`);
		updateMapPlot();
	})

	d3.select('#markers')
		.selectAll('myOptions')
			.data(yearGroups)
		.enter()
			.append('option')
			.attr("value", function(d){ return d; })
			.attr("label", function(d){ return d; })
			.text(function (d){ return d; })

	filterData();
}

function filterData() {
	filteredData = rawData.value.filter(function(d){
		return (d.Dim1 === filterSex && d.TimeDim === filterYear);
	});

	filteredDataMap = new Map(filteredData.map(
        jsonValueLine => [jsonValueLine.SpatialDim, jsonValueLine.NumericValue]
      ));
}

let geojson;
let rawData;			// Raw data imported from Json
let filteredData;		// Filtered data in array format
let filteredDataMap;	// Filtered data with value cast to Map() for plotting

let filterYear;
let filterSex;

// let sexGroups;
// let yearGroups;

// REQUEST DATA
Promise.all([
    json("ne_110m_admin_0_map_units.json"),
    json("WHOSIS_000001.json")
  ]).then(function(loadData){

	rawData = loadData[1];
    geojson = loadData[0];
	initialisePlot();
	updateMapPlot();  // Initial drawing for map based on filtered data
  });



///////////////////////////////

const rangeInput = document.getElementById('slider');
const valueDisplay = document.getElementById('sliderOut');

rangeInput.addEventListener('input', function() {
	valueDisplay.textContent = this.value;
})
