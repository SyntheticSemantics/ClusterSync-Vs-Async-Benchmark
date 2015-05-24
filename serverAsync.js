/*-----------------------------------------------------------------------------+
 |  Cluster/Async I/O Benchmark                                Version 0.1.0   |
 +------------------------------------------------+----------------------------+
 |  Copyright 2014, Synthetic Semantics LLC       |       http://synsem.com/   |
 |  Released under the Revised BSD License        |          info@synsem.com   |
 +------------------------------------------------+----------------------------*/
var fs = require("fs");
var config = require('./config.json');
var http = require('http');
var url_module = require("url");
var async = require('async');

http.createServer(function (request, response) {
    var key = url_module.parse(request.url).query.replace('key=','');
    switch(request.method) {
        case 'GET':
            var asyncTasks = [];
            for (var i = 0; i < config.nTimes; i++) {
                asyncTasks.push(function (cb) {
                    fs.readFile(config.dataPath + key, 'utf8', function (err, data) {
                        if (err) return cb(err);
                        cb(null, JSON
                            .parse(data)
                            .sort()
                            .reduce(function (previousValue, currentValue) {
                                return previousValue + currentValue;
                            }) + data
                        )
                    })
                })
            }
            async.parallel(asyncTasks, function (err, asyncResults) {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end(JSON.stringify(asyncResults));
            });
            break;
        case 'POST':
            var postData = '';
            request
                .on('data', function (data) { postData += data; })
                .on('end', function () {
                    fs.writeFile(config.dataPath + key, postData, 'utf8', function(err) {
                        if(err) {
                            response.writeHead(400, {'Content-Type': 'text/plain'});
                            response.end('Error: Unable to write file?' + err);
                        } else {
                            response.writeHead(200, {'Content-Type': 'text/plain'});
                            response.end('post was ok');
                        }
                    });
                });
            break;
        default:
            response.writeHead(400, {'Content-Type': 'text/plain'});
            response.end("Error: Bad HTTP method: " + request.method);
    }
}).listen(config.serverPort);

console.log('synchronous server is running.');
