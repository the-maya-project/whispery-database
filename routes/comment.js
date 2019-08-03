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



//retrieve comment via uid
async function getCommentByUid(dgraphClient, uid) {

        // Run query.
    const query = ` {
            getComment(func: uid(${uid})){
                uid        
                commentReplyCount
                commentContent
                commentLikes
                commentTimestamp
                commentUsername
                type
                commentReply {
                    uid
                    replyContent
                    replyLikes
                    replyTimestamp
                    replyUsername
                }
            
                        
              }
        }`;

        //const vars = {};
        const res1 = await dgraphClient.newTxn().query(query);
        const posts = res1.getJson();
        return(posts.getComment);
} 


//create comment
router.post('/send', async function(req,res){
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

        const createdComment = await getCommentByUid(dgraphClient, assigned.getUidsMap().get("blank-0"));
        res.send(createdComment);
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



//retrieve comment and its replies by comment uid
router.get('/retrieveByUid', async function(req,res){
    //initalize dgraph client and transaction
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    const txn = dgraphClient.newTxn();
    
    var uid = req.query.uid;
    
    const comment = await getCommentByUid(dgraphClient, uid);
    res.send(comment);
    
    await txn.discard();
        //close connection
    dgraphClientStub.close();
    
    

})



module.exports = router;