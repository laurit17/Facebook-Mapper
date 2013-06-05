// ==UserScript==
// @name       Mapping Facebook Users
// @namespace  http://use.i.E.your.homepage/
// @version    0.1
// @description  by Lauri Takacsi-Nagy
// @include https://www.facebook.com/UCBerkeley
// @require http://code.jquery.com/jquery-latest.min.js
// @require http://d3js.org/d3.v3.min.js
// @require http://d3js.org/d3.geo.projection.v0.min.js
// @require http://d3js.org/topojson.v0.min.js
// @copyright  2012+, You
// ==/UserScript==


var width = 1500, height = 1200;

var svg = d3.select("body").insert("svg", ":first-child")
.attr("width", width)
.attr("height", height);

var projection = d3.geo.mercator()
.scale(1500)
.translate([width / 2, height / 2]);

var path = d3.geo.path()
.projection(projection);

var alreadyMapped = ["Berkeley, California"];
var alreadyAccessed = [];

function handle_JSON(r) {
    var the_JSON = r.responseText;
    console.log('Received JSON');
    //console.log(the_JSON);
    draw_map(JSON.parse(the_JSON));
}

GM_xmlhttpRequest({ method: 'GET', url: "http://www.cs.berkeley.edu/~bodik/world.json", onload: handle_JSON });

function draw_map(world) {
    console.log("Drawing Map");
    var countries = topojson.object(world, world.objects.countries);
    
    svg.selectAll(".country")
    .data(countries.geometries)
    .enter().insert("path", "circle")
    .attr("class", function(d) { return "country " + d.id; })
    .attr("d", path)
    .attr("fill", "#ddc");
    
    svg.insert("path", "circle")
    .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return true; }))
    .attr("d", path)
    .attr("class", "country-boundary")
    .attr("fill", "none")
    .attr("stroke", "#777")
    .attr("stroke-linejoin", "round");
    
    var berkeley_coords = [-122.2727470, 37.87159260];
    var screen_coords = projection(berkeley_coords);
    
    svg.append("svg:circle")
    .attr("cx", screen_coords[0])
    .attr("cy", screen_coords[1])
    .attr("r", 3)
    .attr("fill", "red");
    
}

function parsePage(r) {
    my_regex = RegExp('Lives in <[^<]*');
    matches = r.responseText.match(my_regex);
    if(matches != null) {
        var result = matches[0];
        the_string = result.substring(result.lastIndexOf('>') + 1);
        console.log(the_string);
        get_coords(the_string);
    } else {
        console.log('None found');
    }
}

function getURL(the_url) {
    if(alreadyAccessed.indexOf(the_url) == -1) {
        alreadyAccessed.push(the_url);
    	GM_xmlhttpRequest({ method: 'GET', url: the_url, onload: parsePage});
    }
}

function update() {
    console.log("Updating");
	var comments = document.getElementsByClassName('UFICommentContent');
	var pics = document.getElementsByClassName('pic innerPic');
	var recs = document.getElementsByClassName('fwb');
	var posts = document.getElementsByClassName('actorDescription actorName');
	var more_posts = document.getElementsByClassName("actorDesciption");
    
    var url;
    
    for(var i = 0; i < posts.length; i++) {
    	url = posts[i].getElementsByTagName("a")[0].getAttribute("href");
    	getURL(String(url));
	}

	for(var i = 0; i < comments.length; i++) {
		url = comments[i].getElementsByTagName("a")[0].getAttribute("href");
    	getURL(String(url));
	}

	for(var i = 0; i < more_posts.length; i++) {
    	url = more_posts[i].getElementsByTagName("a")[0].getAttribute("href");
    	getURL(String(url));
	}  
    
    for(var i = 0; i < recs.length; i++) {
		url = recs[i].getAttribute("href");
        getURL(String(url));
    }
    
    for(var i = 0; i < pics.length; i++) {
		url = pics[i].getAttribute("href");
        getURL(String(url));
    }
    
    setTimeout(update, 10000);
}

update();

function get_coords(location_str) {
    if(alreadyMapped.indexOf(location_str == -1)) {
		alreadyMapped.push(location_str);
        var sanitized_str = location_str.trim().replace(' ', '+');
    	var geo_URL = "http://maps.googleapis.com/maps/api/geocode/json?address=" + sanitized_str + "&sensor=false";
    	new GM_xmlhttpRequest({ method: 'GET', url: geo_URL, onload: parseAndDraw});
    }
}

function parseAndDraw(r) {
    geo_info = JSON.parse(r.responseText);
    if(geo_info == null || geo_info.status != "INVALID_REQUEST") {
    	var coords = [geo_info.results[0].geometry.location.lng, geo_info.results[0].geometry.location.lat];
   		var screen_coords = projection(coords);
    }

    
    svg.append("svg:circle")
    .attr("cx", screen_coords[0])
    .attr("cy", screen_coords[1])
    .attr("r", 3)
    .attr("fill", "red");
}