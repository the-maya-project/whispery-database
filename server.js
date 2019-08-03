'use strict';

const express = require('express');
const dgraph = require("dgraph-js");
const grpc = require("grpc");
const bodyParser = require('body-parser');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello world\n');
});


// Create a client stub.
function newClientStub() {
    return new dgraph.DgraphClientStub("134.209.99.184:9080", grpc.credentials.createInsecure());
}

// Create a client.
function newClient(clientStub) {
    return new dgraph.DgraphClient(clientStub);
}

let initialise  = require('./routes/initialise');
let post  = require('./routes/post');
let comment  = require('./routes/comment');
let reply  = require('./routes/reply');
app.use('/initialise', initialise);
app.use('/post', post);
app.use('/comment', comment);
app.use('/reply', reply);


console.log(`Running on http://${HOST}:${PORT}`);




app.listen(PORT, HOST);
