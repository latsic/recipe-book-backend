const MongoClient = require('mongodb').MongoClient;
const MongoServer = require('mongodb').Server;
const {parse} = require("url");

const dbUrl = "mongodb://80.209.237.186:27017";
const dbName = "myDb"
const recipeBook = "recipe-book";
const shoppingList = "shopping-list";

const {createReadStream} = require("fs");

module.exports = class DbHandlers {

  constructor() {
    
    this.client;
  }

  async getClient() {
    try {

      if(!this.client) {
        console.log("connecting client to db");
        this.client = await MongoClient.connect(dbUrl);
        return this.client;
      }
      return this.client;
    }
    catch(error) {
      console.log("Failed to connect to " + dbUrl);
      throw(error);
    }
  }

  async handlerGet(request) {

    const client = await this.getClient();
    const colName = collectionName(request.url);
    const collection = client.db(dbName).collection(colName);
    let docs = await collection.find({}, {fields: {"_id": 0}}).toArray();

    console.log("docs", docs);

    return {
      status: 200,
      type: "application/json",
      body: JSON.stringify(docs)
    };
  }

  async handlerPut(request) {

    let contentType = request.headers["Content-Type"];
    console.log("contentType", contentType);

    let contentType1 = request.headers["content-type"];
    console.log("contentType1", contentType1);

    let client = await this.getClient();
    let colName = collectionName(request.url);

    console.log("hmm1");

    await client.db(dbName).collection(colName).remove({});

    console.log("hmm1");

    let jsonData = await getBodyData(request);
    let data = JSON.parse(jsonData);

    console.log("hmm1");

    console.log("jsonData", jsonData);
    console.log("data", data);

    await client.db(dbName).collection(colName).insert(data);

    return {status: 204};
  }
}


function getBodyData(request) {

  return new Promise((resolve, reject) => {
    
    let data = "";
    
    request.on("error", (error) => {
      console.log("onError");
      reject(error);
    });
    request.on("data", (chunk) => {
      console.log("onData", chunk);
      data += chunk.toString();
    });
    request.on("end", () => {
      console.log("onEnd");
      resolve(data);
    });
  });
}


function collectionName(url) {
  return parse(url).pathname.slice(1);
}
