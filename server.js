const {createServer} = require("http");


//const {FileHandlers} = require("./filehandlers.js")
const FileHandlers = require("./filehandlers.js");
const DbHandlers = require("./dbhandlers.js");
const CommonHandlers = require("./commonhandlers.js");


//let mode = "file";
let mode = "db";
let fileHandlers = new FileHandlers(process.cwd());
let dbHandlers = new DbHandlers();
let commonHandlers = new CommonHandlers();


let server = createServer((request, response) => {

  console.log("got request, url", request.url);
  console.log("request method: ", request.method);

  let handlerFunc = getHandlerFunction(request);
  handlerFunc(request)
    .then(({status = 200, type = "text/plain", body = ""}) => {
      console.log("handler found and executed, status: " + status);
      
      writeResponse(response, status, type, body);
    })
    .catch((error) => {
      console.log("error while handling request!", error);

      let result = {
        status: 500,
        body: String(error),
        type: "text/plain"
      };    

      if(error.status) {
        result.status = error.status;
        result.body = error.body;
        result.type = error.type;
      }
      writeResponse(response, result.status, result.type, result.body);
    }); 
});

function writeResponse(response, status, type, body) {

  response.writeHead(
    status,
    "noSpecialReason",
    {"Content-Type": type,
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
     "Access-Control-Allow-Methods": "PUT, POST, GET, DELETE, OPTIONS"
    }
  );

  // In case the source of our body is a readable stream
  if(body && body.pipe) {
    body.pipe(response);
  }
  else {
    response.end(body);
  }
}

try
{
  server.listen(8003);
  console.log("server started");
}
catch(error) {
  console.log("server shutdown with error: " + String(error));
}

function getHandlerFunction(request) {

  if(request.method == "OPTIONS") {
    return commonHandlers.handlerOptions.bind(this); 
  }

  if(mode == "file") {

    if(request.method == "GET") {

      return fileHandlers.handlerGet.bind(fileHandlers);
    }
    else if(request.method == "PUT") {
      return fileHandlers.handlerPut.bind(fileHandlers);
    }
    else if(request.method == "DELETE") {
      return fileHandlers.handlerDelete.bind(fileHandlers);
    }
  }
  else {
    if(request.method == "GET") {
      return dbHandlers.handlerGet.bind(dbHandlers);
    }
    else if(request.method == "PUT") {
      return dbHandlers.handlerPut.bind(dbHandlers);
    }
    else if(request.method == "DELETE") {
      return dbHandlers.handlerDelete.bind(dbHandlers);
    }
  }

  return commonHandlers.handlerNotAllowed.bind(this);
}





//curl -H "Content-Type: application/json" -X PUT -d '{"test1":"xyz","test2":"xyz"}' http://localhost:8003/testdata.json