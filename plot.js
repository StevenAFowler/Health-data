// Reference for structure and approach: 
//    https://www.d3indepth.com/geographic
//

import { select } from 'https://esm.sh/d3-selection';
import { geoPath, geoMercator } from 'https://esm.sh/d3-geo';
import { json } from 'https://esm.sh/d3-fetch';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"; 

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
  // console.log(`${Object.keys(d.properties)}`);
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

function update(geojson) {
	let u = select('#content g.map')
		.selectAll('path')
		.data(geojson.features);

	u.enter()
		.append('path')
		.attr('d', geoGenerator)
    // set the color of each country
      .attr("fill", function (geoJson) {
        geoJson.total = dataMap.get(geoJson.properties.ADM0_A3) || 0;
        return colorScale(geoJson.total);
      })
		.on('mouseover', handleMouseover);
}

let dataMap;
// REQUEST DATA
Promise.all([
    json("ne_110m_admin_0_map_units.json"),
    json("WHOSIS_000001.json")
  ]).then(function(loadData){
      
    // Extract spacial and value data and cast into Map() type
      dataMap = new Map(loadData[1].value.map(
        jsonValueLine => [jsonValueLine.SpatialDim, jsonValueLine.NumericValue]
      ));

      update(loadData[0])
  });
