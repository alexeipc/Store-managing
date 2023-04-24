var MongoClient = require('mongodb').MongoClient;
const url = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;


function deleteFromDb(sentId) {
    MongoClient.connect(url, function(err,db) {
        if (err) throw err;
        var dbo = db.db(`${process.env.MONGO_DB}`);

        var obj = {id: sentId};

        dbo.collection(`${process.env.MONGO_PRODUCT_COLLECTION}`).deleteOne(obj, function(err, res) {
            if (err) throw err;
            db.close();
          });

    })
};

exports.deleteFromDb = deleteFromDb;
