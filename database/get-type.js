var MongoClient = require('mongodb').MongoClient;
const url = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;


function getTypeFromDb(callback) {
    MongoClient.connect(url, function(err,db) {
        if (err) throw err;
        var dbo = db.db(`${process.env.MONGO_DB}`);

        dbo.collection(`${process.env.MONGO_TYPE_COLLECTION}`).find().toArray((err, res) =>{
            if (err) throw err;
            callback(res);
            db.close();
        });
    })
};

function getTypeById(sentId, callback) {
  MongoClient.connect(url, function(err, client) {
    if (err) {
      callback(err);
      return;
    }
    const dbo = client.db(`${process.env.MONGO_DB}`);
    const obj = { id: `${sentId}` };
    dbo.collection(`${process.env.MONGO_PRODUCT_COLLECTION}`).findOne(obj, function(err, res) {
      client.close();
      if (err) {
        callback(err);
        return;
      }
      callback(res);
    });
  });
}

function countType(sentType, callback) {
    MongoClient.connect(url, function(err, client) {
      if (err) {
        callback(err);
        return;
      }
      const dbo = client.db(`${process.env.MONGO_DB}`);
      const obj = { type: `${sentType}` };
      dbo.collection(`${process.env.MONGO_PRODUCT_COLLECTION}`).find(obj).toArray(function(err, res) {
        client.close();
        if (err) {
          callback(err);
          return;
        }
        callback(null, res.length);
      });
    });
  }
  
  



exports.getTypeFromDb = getTypeFromDb;
exports.countType = countType;
exports.getTypeById = getTypeById;
