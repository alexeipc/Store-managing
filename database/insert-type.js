var MongoClient = require('mongodb').MongoClient;
const url = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;


function insertTypeToDb(sentType, sentPrice) {
    MongoClient.connect(url, function(err,db) {
        if (err) throw err;
        var dbo = db.db(`${process.env.MONGO_DB}`);

        var findobj = {type: `${sentType}`};
        var obj = {type: `${sentType}`, price: `${sentPrice}`};

        var flag = true;

        dbo.collection(`${process.env.MONGO_TYPE_COLLECTION}`).find(findobj).toArray(function(err, res) {
            if (err) throw err;
            if (res.length === 0) {
                dbo.collection(`${process.env.MONGO_TYPE_COLLECTION}`).insertOne(obj, function(err, res) {
                    if (err) throw err;
                    db.close();
                });
            } else {
                db.close();
            }
        });

    })
};

function ChangePriceFromDb(sentType, sentPrice) {
    MongoClient.connect(url, function(err,db) {
        if (err) throw err;
        var dbo = db.db(`${process.env.MONGO_DB}`);

        var findobj = {type: `${sentType}`};
        var obj = {$set: {type: `${sentType}`, price: `${sentPrice}`}};

        var flag = true;

        dbo.collection(`${process.env.MONGO_TYPE_COLLECTION}`).updateOne(findobj, obj, function(err, res) {
            if (err) throw err;
            console.log("Document(s) updated");
            db.close();
        });

    })    
};

exports.insertTypeToDb = insertTypeToDb;
exports.ChangePriceFromDb = ChangePriceFromDb;
