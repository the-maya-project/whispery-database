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



//create user
router.post('/createUser', async function(req,res){
    //initalize dgraph client and transaction
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    const txn = dgraphClient.newTxn();
    
    
    try {
        // Create data.
        const p = req.body; 
        p.type = "user";
    
    // Run mutation.
        const mu = new dgraph.Mutation();
        mu.setSetJson(p);
        const assigned = await txn.mutate(mu);
        
        // Commit transaction.
        await txn.commit();

        const createdUser = await getUserByUid(dgraphClient, assigned.getUidsMap().get("blank-0"));
        res.send(createdUser);
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


//retrieve user via user uid
async function getUserByUid(dgraphClient, uid) {

        // Run query.
    const query = ` {
            getUser(func: uid(${uid})){
                uid 
                userGuid
                type
                userPost {
                    uid
                    postContent
                    postLatitude
                    postLongitude
                    postLikes
                    postTimestamp
                    type
                }
              }
        }`;

        //const vars = {};
        const res1 = await dgraphClient.newTxn().query(query);
        const user = res1.getJson();
        return(user.getUser);
} 

router.get('/retrieveUserByUid', async function(req,res){
    //initalize dgraph client and transaction
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    const txn = dgraphClient.newTxn();
    
    var uid = req.query.uid;
    
    const user = await getUserByUid(dgraphClient, uid);
    res.send(user);
    
    await txn.discard();
        //close connection
    dgraphClientStub.close();
    
    

})





module.exports = router;