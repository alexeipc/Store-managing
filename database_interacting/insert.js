var MongoClient = require('mongodb').MongoClient;
const url = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;


function insertToDb(sentId, sentType) {
    MongoClient.connect(url, function(err,db) {
        if (err) throw err;
        var dbo = db.db(`${process.env.MONGO_DB}`);

        var obj = {type: `${sentType}`, id: sentId};
        var findObj = {id: sentId};
        
        dbo.collection(`${process.env.MONGO_PRODUCT_COLLECTION}`).find(findObj).toArray(function(err, res) {
            if (err) throw err;
            if (res.length === 0) {
                dbo.collection(`${process.env.MONGO_PRODUCT_COLLECTION}`).insertOne(obj, function(err, res) {
                    if (err) throw err;
                    db.close();
                });
            } else {
                db.close();
            }
        });

    })
};
exports.insertToDb = insertToDb;