console.log('hello world!');

// if window width is greater than 960, use innerWidth
// if window height is greater than 500, use innerHeight
var width = Math.max(960, window.innerWidth),
    height = Math.max(500, window.innerHeight);

var pi = Math.PI,
    tau = 2 * pi;

// default map projection setting
// for projections with tiles, we need to use geomercator
var projection = d3.geoMercator()
  .scale(1 / tau)
  .translate([0, 0]);

// telling d3 to use the geomercator projection when drawing paths
var path = d3.geoPath()
  .projection(projection);

var tile = d3.tile()
  .size([width, height]);

// use bitwise operators
// 1 << 11 is the min zoom level and 1 << 24 is the max zoom level
var zoom = d3.zoom()
  .scaleExtent([
    1 << 11,
    1 << 24
  ])
  .on('zoom', zoomed);

// earthquake with the largest magnitude will have a radius of 10 and smallest will have radius 0
var radius = d3.scaleSqrt().range([0, 10]);

// create svg element
var svg = d3.select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

// variable to attend tiles to
var raster = svg.append('g');

// draw all earthquake data on one path element
// render to a single path:
// var vector = svg.append('path');
// render to multiple paths:
var vector = svg.selectAll('path');

// load in data asynchronously
d3.json('data/earthquakes_4326_cali.geojson', function(error, geojson) {
  if (error) throw error;
  
  console.log(geojson);
  
  radius.domain([0, d3.max(geojson.features, function(d) { return d.properties.mag; })]);
  
  path.pointRadius(function(d) {
    return radius(d.properties.mag);
  });
  
  // bind vector data
  // render to a single path:
  // vector = vector.datum(geojson);
  // render to multiple paths:
  vector = vector
    .data(geojson.features)
    .enter().append('path')
    .attr('d', path)
    .on('mouseover', function(d) { console.log(d); });
  
  // specifying longitude and latitude
  var center = projection([-119.665, 37.414]);
  
  // call zoom transform on svg element
  svg.call(zoom)
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(1 << 14)
        .translate(-center[0], -center[1])
    );
});


function zoomed() {
  // grab the transform event
  var transform = d3.event.transform;
  
  var tiles = tile
    .scale(transform.k)
    .translate([transform.x, transform.y])
    ();
  
  console.log(transform.x, transform.y, transform.k);
  
  projection
    .scale(transform.k / tau)
    .translate([transform.x, transform.y]);
  
  // redraw vector
  vector.attr('d', path);
  
  // using D3's general upde pattern to update the positioning of existing tiles
  // remove ones no longer needed
  // and add new ones that are needed when a user is zooming and panning.
  var image = raster
    .attr('transform', stringify(tiles.scale, tiles.translate))
    .selectAll('image')
    .data(tiles, function(d) { return d; });
  
  image.exit().remove();
  
  // add tiles
  // we can add image within attr
  image.enter().append('image')
    .attr('xlink:href', function(d) {
      // return url to images
      return 'http://' + 'abc'[d[1] % 3] + '.basemaps.cartocdn.com/rastertiles/voyager/' +
        d[2] + "/" + d[0] + "/" + d[1] + ".png";
    })
    .attr('x', function(d) { return d[0] * 256; })
    .attr('y', function(d) { return d[1] * 256; })
    .attr('width', 256)
    .attr('height', 256);
}

// stringify function
function stringify(scale, translate) {
  var k = scale / 256,
      r = scale % 1 ? Number : Math.round;
  return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
}