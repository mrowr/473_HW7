// Server-side code
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */

"use strict";

var express = require("express"),
    http = require("http"),
    app = express(),
    redis = require("redis"), //require the redis module
    redisClient = redis.createClient(), // create a client to connect to Redis
    bodyParser = require("body-parser"),
    bases = require("bases");

var input_url, output_url, base_url, key;

// configure the app to use the client directory for static files
app.use(express.static(__dirname + "/client"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// from ProfAvery's implementations in Ruby and Python
// initialize next key
redisClient.set("next", 10*Math.pow(36,3));

//http://blog.tompawlak.org/how-to-generate-random-values-nodejs-javascript
function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

// when a long URL is entered, create a new shortened URL
app.post("/shorten", function(req,res) {
    input_url = req.body.input_url;
    base_url = "http://localhost:3000/";

    // if a shortened URL is entered, display the original long URL
    if (input_url.indexOf(base_url) > -1) {
        redisClient.get("short:"+input_url, function(err, original) {
            return res.json(original);
        });
    } else {
        // if long URL exists
        redisClient.exists("long:" + input_url, function(err, reply) {
            // check if long URL shortened
            if (reply === 1) {
                redisClient.get("long:"+input_url, function(err, value) {
                    return res.json(value);
                });
            } else {
                // shorten long URL
                var rand = randomIntInc(0, 35) + Math.floor(Math.random()*10);
                //var inc = Math.floor(Math.random()*10);
                redisClient.incrby("next", rand, function(err,value) {
                    key = bases.toBase36(value);
                    output_url = base_url + key;
                    redisClient.set("long:"+input_url, output_url);
                    redisClient.set("short:"+output_url, input_url);
                    return res.json(output_url);
                });
            }
        });
    }
});

// get top ten popular shortened URLs
// http://redis.io/commands/zrevrange
app.get("/top10", function(req,res) {
    redisClient.zrevrange("hits", 0, 9, "withscores", function(err, popular) {
        return res.json(popular);
    }); 
});

app.get("/:key", function(req, res) {
    base_url = "http://localhost:3000/";
    input_url = base_url + req.params.key;
    redisClient.exists("short:" + input_url, function(err, reply) {
        if (reply === 1) {
            redisClient.get("short:"+input_url, function(err, value) {
                redisClient.zincrby("hits", 1, input_url);
                return res.redirect(value);
            });
        } else { 
            return res.json("error");
        }
    });
});

//create the Express-powered HTTP server and have it listen
http.createServer(app).listen(3000);
console.log("Server is listening on port 3000");
