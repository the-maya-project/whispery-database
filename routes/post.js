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


//retrieve post and comments via post uid
async function getPostByUid(dgraphClient, uid) {

        // Run query.
    const query = ` {
            getPost(func: uid(${uid})){
                uid        
                postCommentCount
                postContent
                postGeolocation
                postLatitude
                postLongitude
                postLikes
                postTimestamp
                postUsername
                type
                postComment {
                    uid
                    commentReplyCount
                    commentContent
                    commentLikes
                    commentTimestamp
                    commentUsername
                }
            
                        
              }
        }`;

        //const vars = {};
        const res1 = await dgraphClient.newTxn().query(query);
        const posts = res1.getJson();
        return(posts.getPost);
} 

//create post
router.post('/upload', async function(req,res){
    //initalize dgraph client and transaction
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    const txn = dgraphClient.newTxn();
    
    
    try {
        // Create data.
        
        const p = req.body; 
    
    // Run mutation.
        const mu = new dgraph.Mutation();
        mu.setSetJson(p);
        const assigned = await txn.mutate(mu);
        
        // Commit transaction.
        await txn.commit();
        
        const createdPost = await getPostByUid(dgraphClient, assigned.getUidsMap().get("blank-0"));
        
        res.send(createdPost);
    } catch (e) {
        console.log(e);
        res.status(200).json({ error: 'message' })
    } finally {
        // Clean up. Calling this after txn.commit() is a no-op
        // and hence safe.
        await txn.discard();
        //close connection
        dgraphClientStub.close();
    }
    

})


//retreve posts within radius
router.get('/retrieveByRadius', async function(req,res){
    
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    const txn = dgraphClient.newTxn();
    var radius1 = parseFloat(req.query.radius);
    var lat1 = parseFloat(req.query.lat);
    var long1 = parseFloat(req.query.long);
    var numOffset1 = parseInt(req.query.index) * parseInt(req.query.numPost);
    var numPost1 = parseInt(req.query.numPost); 
    
    
    try{    
        // Run query.
        const query = ` {
          nearby(func: near(postGeolocation, [${lat1}, ${long1}], ${radius1}), offset:${numOffset1}, first:${numPost1}, orderdesc: postTimestamp)
          {
            uid
            expand(_all_)
        
          }
        }`;

        //const vars = {};
        const res1 = await dgraphClient.newTxn().query(query);
        const posts = res1.getJson();
        res.send(posts.nearby);
    } catch (e) {
        console.log(e);
        res.status(404).json({ error: 'message' })
    } finally {
        // Clean up. Calling this after txn.commit() is a no-op
        // and hence safe.
        await txn.discard();
        //close connection
        dgraphClientStub.close();
    
    }

    
})

//retreve posts within by days passed and radius 
router.get('/retrieveByDaysAndRadius', async function(req,res){
    
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    const txn = dgraphClient.newTxn();
    var radius1 = parseFloat(req.query.radius);
    var lat1 = parseFloat(req.query.lat);
    var long1 = parseFloat(req.query.long);
    var numOffset1 = parseInt(req.query.index) * parseInt(req.query.numPost);
    var numPost1 = parseInt(req.query.numPost); 
    var days = parseInt(req.query.days) + 1;
    
    var startDate = new Date();   
    startDate.setDate(startDate.getDate() - days);
    startDate = startDate.toISOString();
    
    
    
    try{    
        // Run query.
        const query = ` {
          nearby(func:near(postGeolocation, [${lat1}, ${long1}], ${radius1}), offset:${numOffset1}, first:${numPost1}, orderdesc: postTimestamp)@filter(ge(postTimestamp, "${startDate}"))
          {
            uid
            expand(_all_)
        
          }
          
          
        }`;

        //const vars = {};
        const res1 = await dgraphClient.newTxn().query(query);
        const posts = res1.getJson();
        res.send(posts.nearby);
    } catch (e) {
        console.log(e);
        res.status(404).json({ error: 'message' })
    } finally {
        // Clean up. Calling this after txn.commit() is a no-op
        // and hence safe.
        await txn.discard();
        //close connection
        dgraphClientStub.close();
    
    }

    
})



//retrieve post and its comments by post uid
router.get('/retrieveByUid', async function(req,res){
    //initalize dgraph client and transaction
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    const txn = dgraphClient.newTxn();
    
    var uid = req.query.uid;
    
    const post = await getPostByUid(dgraphClient, uid);
    res.send(post);
    
    await txn.discard();
        //close connection
    dgraphClientStub.close();
    
    

})



module.exports = router;