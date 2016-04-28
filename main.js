const PORT = process.env.PORT || 3000;
const server = require('http').createServer(service);
const io = require('socket.io')(server);

const mongoose = require('mongoose');
const configuration = require('./configurations/mongodb');
mongoose.connect(configuration.mongolab);

function service (request, response) {
    readFile ('./main.html').then(function (file) {
        response.writeHeader(200, {"Content-Type": "text/html"});   
        response.write(file);
        response.end();
    })
    
}

function readFile(file) {
    const filesystem = require('fs');
    function promise (resolve, reject) {
        filesystem.readFile(file, function (error, data) {
           if (error) reject(error);
           else if (data) resolve(data);
           else reject(); 
        });
    }
    return new Promise(promise);
}

mongoose.connection.on('connected', function() {
    console.log('MongoDB is up and running...');
    require('./application/sockets')(io);
    
    server.listen(PORT, function () {
        console.log("Up and running @ localhost: " + PORT);
    }); 
});

mongoose.connection.on('error', function(error) {
    console.error('Error in connecting MongoDB: ' + error);
});