var mongoose = require("mongoose");
var Tripin = require('../models/poi');
var https = require('https');

var tripinController = {};


//run crawler and save the poi in database 
tripinController.save = function (req, res) {


  var searchQuery = req.param("cityName");
  searchQuery = "Tourist Places in "+searchQuery;
  //Search Places by Text Query
  // var searchQuery = "swimming+pool+in+Baramati";
  //https GET request to GoogleMap APi

  //forsearch query
  https.get('https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + searchQuery + '&key=AIzaSyC9XIq0AQb0eLh4Tg9tq0bXpLMhDxt6lqA&rating=5', (resp) => {
    let data = '';
    var poicount = 0;
    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;

    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {

      var poi = JSON.parse(data);


      console.log("Point of interests found :" + poi.results.length);

      for (var i = 0; i < poi.results.length; i++) {

        //new Tripin Model is created
        var p = new Tripin(poi.results[i]);

        // write json to database  
        p.save(function (err) {
          if (err) {
            console.log(err);

          }
          else {
              poicount++;
          }
        })
      }
    //  res.send(poi.results.length + " Point of interests Detected and added to the database Successfully!!");
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });




process.exit();



  ///test Poi insert
  /*
     var poi = {
      "place_id":444,
      "name": "MaharajaIn",
      "lat" : 18.2051583,
      "lng" : 74.6059556,
      "rating" : 3.6,
      "formatted_address" : "Near Paggio Hotel, Midc, Baramati, Maharashtra 413133, India",
      "types" : ['hotel','bar'],
      "best_time" : "Anytime",
      "best_season" :"AnySeason",
      "city" : "Baramati",
      
    }
  
    var p = new Tripin(poi);
    console.log(poi);
    // write json to database  
    p.save(function(err){
          if(err) {
              console.log(err);
              
          }
          else{
              res.send("poi added!")
              console.log("Succsessfully added POI");
          }
      })
     */
}

var tspCities = [];
var totalCities = 10;
var cities = [];
var popSize = 2000;
var generations = 50;
var population = [];
var fitness = [];
var recordDistance = Infinity;
var bestEver = [];
var currentBest;
var order = [];


//get results from database
tripinController.getPoi = function (req, res) {
  var city = req.param("cityName");
  //Find Poi containing formatted address ad given
  Tripin.find({ $and: [{ "formatted_address": { $regex: ".*" + city + ".*" } }, { "rating": { $gt: 4 } }] }).limit(30).exec(function (err, poi) {
    if (err) {
      console.log("Error:", err);
    }
    if (poi.length || poi==[]) {
      console.log("Request Recevied at server for city = " + city);
      load_data(poi);
      recordDistance = Infinity;
      bestEver = [];
      currentBest;
      console.time("tsp_ga_time");
      tsp_ga();
      console.timeEnd("tsp_ga_time");
      // following code is to create json of the citites in tsp route with there all information
      var tspCitiesString = "[";
      for (var i = 0; i < totalCities; i++) {
        var seqNo = bestEver[i];
        tspCities[i] = cities[seqNo];
        for (var j = 0; j < poi.length; j++) {
          if (tspCities[i].x == poi[j].geometry[0].location[0].lat) {
            tspCitiesString = tspCitiesString + JSON.stringify(poi[j]) + ",";
          }
        }
      }

      //following code will remove the last character from string add ] to the last.
      tspCitiesString = tspCitiesString.substring(0, tspCitiesString.length - 1) + "]";

      //console.log(tspCities);
      res.send(tspCitiesString);

    }
    else {
      res.send("Null");
      tripinController.save(req,res);
    }
  });
}



// TSP implementation

//create vector array of lat and lng
function load_data(selectedPoi) {
  for (var i = 0; i < totalCities; i++) {
    cities[i] = new Vector(selectedPoi[i].geometry[0].location[0].lat, selectedPoi[i].geometry[0].location[0].lng);
  }
  console.log("total cities loaded = " + selectedPoi.length);

}

function tsp_ga() {
  console.log("-------------this is the tsp_ga-------------------");

  generate_population();
  for (var i = 0; i < generations; i++) {
    calculateFitness();
    normalizeFitness();
    nextGeneration();
  }
  console.log("Shortest path = " + bestEver + " and distance between selected pois = " + recordDistance);
}



function nextGeneration() {
  var newPopulation = [];
  for (var i = 0; i < population.length; i++) {
    var orderA = pickOne(population, fitness);
    var orderB = pickOne(population, fitness);
    var order = crossOver(orderA, orderB);
    mutate(order, 0.02);
    newPopulation[i] = order;
  }
  population = newPopulation;

}


function pickOne(list, prob) {
  var index = 0;
  var r = Math.random(1);

  while (r > 0) {
    r = r - prob[index];
    index++;
  }
  index--;
  return list[index].slice();
}

function crossOver(orderA, orderB) {
  var start = randomNumber(orderA.length);
  var end = randomIntFromInterval(start + 1, orderA.length);
  var neworder = orderA.slice(start, end);
  // var left = totalCities - neworder.length;
  for (var i = 0; i < orderB.length; i++) {
    var city = orderB[i];
    if (!neworder.includes(city)) {
      neworder.push(city);
    }
  }
  return neworder;
}


function mutate(order, mutationRate) {
  for (var i = 0; i < totalCities; i++) {
    if (randomNumber(1) < mutationRate) {
      var indexA = randomNumber(order.length);
      var indexB = (indexA + 1) % totalCities;
      swap(order, indexA, indexB);
    }
  }
}

///FITNESS NRMALIZATION
function normalizeFitness() {
  var sum = 0;
  for (var i = 0; i < fitness.length; i++) {
    sum += fitness[i];
  }
  for (var i = 0; i < fitness.length; i++) {
    fitness[i] = fitness[i] / sum;;
  }
}

// FITNESS FUNCTION
function calculateFitness() {
  var currentRecord = Infinity;
  for (var i = 0; i < population.length; i++) {
    var d = calcDistance(cities, population[i]);
    if (d < recordDistance) {
      recordDistance = d;
      bestEver = population[i];
    }
    if (d < currentRecord) {
      currentRecord = d;
      currentBest = population[i];
    }
    fitness[i] = 1 / d;
  }
}


function calcDistance(cities, order) {
  var cald = 0, i = 0;
  // console.log(order);

  for (i = 0; i <= cities.length - 2; i++) {
    var a1 = cities[order[i]].x;
    var b1 = cities[order[i]].y;
    //console.log(i+1);
    var j = i + 1;
    var a2 = cities[order[j]].x;
    var b2 = cities[order[j]].y;
    //cald  += HaversineInKM(cities[order[i]].x,cities[order[i]].y,cities[order[i+1]].x,cities[order[i+1]].y);
    cald += HaversineInKM(a1, b1, a2, b2);

  }


  return cald;
  //console.log("total diastance "+cald);
}

//Calculate distance in between two places using their co-ordinates
// distance between Baramati and Patas
/*HaversineInKM(18.1841,74.6108,18.4344,74.4614)
   32.025916176739244 
*/

var _eQuatorialEarthRadius = 6378.1370;
var _d2r = (Math.PI / 180.0);

function HaversineInM(lat1, long1, lat2, long2) {
  return (1000.0 * HaversineInKM(lat1, long1, lat2, long2));
}

function HaversineInKM(lat1, long1, lat2, long2) {
  var dlong = (long2 - long1) * _d2r;
  var dlat = (lat2 - lat1) * _d2r;
  var a = Math.pow(Math.sin(dlat / 2.0), 2.0) + Math.cos(lat1 * _d2r) * Math.cos(lat2 * _d2r) * Math.pow(Math.sin(dlong / 2.0), 2.0);
  var c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  var d = _eQuatorialEarthRadius * c;

  return d;
}

//Generate Population of given size
function generate_population() {
  for (var i = 0; i < totalCities; i++) {

    order[i] = i;
  }

  var i = 0;

  while (i < popSize) {
    population.push(shuffleSol(order, cities.length));
    i++;
  }

  console.log("Population Generated");
}

function shuffleSol(a, num) {
  b = [];
  for (var i = 0; i < num; i++) {
    b[i] = a[i];
  }
  for (var i = 0; i < num; i++) {
    var indexA = randomNumber(a.length);
    var indexB = randomNumber(a.length);
    swap(b, indexA, indexB);
  }
  //console.log(b);
  return b;

}

function randomNumber(boundary) {
  return parseInt(Math.random() * boundary);
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function swap(a, i, j) {
  var temp = a[i];
  a[i] = a[j];
  a[j] = temp;
}

function Vector(x, y) {
  this.x = x;
  this.y = y;
  // body...
}



module.exports = tripinController;