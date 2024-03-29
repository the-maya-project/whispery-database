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


//create reply
router.post('/send', async function(req,res){
    //initalize dgraph client and transaction
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    const txn = dgraphClient.newTxn();
    
    
    try {
        // Create data.
        const p = req.body; 
        p.commentReply.type = "reply";
        p.commentReply.replyLikes = 0;
        p.commentReply.replyTimestamp = new Date();

    // Run mutation.
        const mu = new dgraph.Mutation();
        mu.setSetJson(p);
        const assigned = await txn.mutate(mu);
        
        // Commit transaction.
        await txn.commit();

        const createdReply = await getReplyByUid(dgraphClient, assigned.getUidsMap().get("blank-0"));
        res.send(createdReply);
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


//retrieve comment via uid
async function getReplyByUid(dgraphClient, uid) {

        // Run query.
    const query = ` {
            getReply(func: uid(${uid})){
                uid        
                replyContent
                replyLikes
                replyTimestamp
                replyUsername
                type
            
                        
              }
        }`;

        //const vars = {};
        const res1 = await dgraphClient.newTxn().query(query);
        const posts = res1.getJson();
        return(posts.getReply);
} 


module.exports = router;