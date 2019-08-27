const express = require('express');
const router = express.Router();
const dgraph = require("dgraph-js");
const grpc = require("grpc");

// Create a client stub.
function newClientStub() {
    return new dgraph.DgraphClientStub("134.209.99.184:9080", grpc.credentials.createInsecure());
}

// Create a client.
function newClient(clientStub) {
    return new dgraph.DgraphClient(clientStub);
}


//clear all data
router.post('/clean', async function (req,res) {
    console.log('Scrubbing all nodes.');

    // Initiate clients.
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    const op = new dgraph.Operation();
 
    // Drop all data and schema.   
    op.setDropAll(true);
    await dgraphClient.alter(op);
    
    // Reset schema.
    await setSchema(dgraphClient);
    
    dgraphClientStub.close();
    
    res.send('Scrubbed all nodes.');
})

//populate sample data
router.post('/populate', async function (req, res) {
    console.log('Populating database.');
    
    // Initiate clients.
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    const txn = dgraphClient.newTxn();

   // Create data.
    const sampleSet = require('../mrtsg.json');
    
    // Run mutation.
    const mu = new dgraph.Mutation();
    mu.setSetJson(sampleSet);
    await txn.mutate(mu);
    await txn.commit();
    
    dgraphClientStub.close();
    
    res.send('Populated database.');
});


// Set schema.
async function setSchema(dgraphClient) {
    const schema = `
        postCommentCount: int .
        postContent: string @index(term, fulltext) .
        postGeolocation: geo @index(geo) .
        postLatitude: float .
        postLongitude: float .
        postLikes: int .
        postTimestamp: datetime @index(day) .
        postUser: string @index(exact) .
        type: string @index(exact, fulltext, trigram) .
        
        commentReplyCount: int .
        commentContent: string @index(term, fulltext) .
        commentLikes: int .
        commentTimestamp: datetime @index(day) .
        commentUser: string @index(exact) .
        
        replyContent: string @index(term, fulltext) .
        replyLikes: int .
        replyTimestamp: datetime @index(day) .
        replyUser: string @index(exact) .
        
        userGuid: string @index(exact) .
        
    `;      
    const op = new dgraph.Operation();
    op.setSchema(schema);
    await dgraphClient.alter(op);
}




module.exports = router;