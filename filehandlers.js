
const {parse} = require("url");
const {resolve, sep} = require("path");
const {stat, unlink} = require("mz/fs");
const {createReadStream, createWriteStream, mkdirSync, statSync} = require("fs");

module.exports =  class FileHandlers {

  constructor(baseDir) {
    this.baseDir = baseDir;

    const dataPath = this.baseDir + sep + "data";
    createDir(dataPath);
  }

  async handlerGet(request) {
    console.log("handlerGet");
    let filePath = resourcePath(request.url, this.baseDir);
    let exists = throwIfResourceNotValid(filePath, false);
    
    let result = {
      status: 200,
      type: "application/json",
      body: "[]"
    };

    if(exists) {
      result.body = createReadStream(filePath);
    }
    return result;
  }

  async handlerPut(request) {

    let filePath = resourcePath(request.url, this.baseDir);
    let exists = await throwIfResourceNotValid(filePath, false);
  
    if(exists) {
      await unlink(filePath);
    }
  
    let dstStream = createWriteStream(filePath);
    await pipeStream(request, dstStream);
  
    return {
      status: 204    
    };
  }

  async handlerPost(request) {
    return {
      status: 404,
      body: `Method ${request.method} not found.`
    };
  }

  async handlerDelete(request) {
    let filePath = resourcePath(request.url, this.baseDir);
    let exists = await throwIfResourceNotValid(filePath, false);

    if(exists) {
      await unlink(filePath);
    }

    return {
      status: 204
    };
  }
}


function pipeStream(readStream, writeStream) {

  return new Promise((resolve, reject) => {

    readStream.on("error", (error) => {reject(error);});
    writeStream.on("error", (data) => {reject(data);});
    writeStream.on("finish", (data) => {resolve(data);});
    readStream.pipe(writeStream);
  });
}

function resourcePath(url, allowedRootDir) {
  console.log("function call: ", "resourcePath");

  // Something like '/file.json'
  let {pathname} = parse(url);
  let absPath = resolve(decodeURIComponent("data" + pathname));

  if(!absPath.startsWith(allowedRootDir)) {
    throw {
      status: 403,
      body: "Forbidden",
    }    
  }

  

  return absPath;
}

async function throwIfResourceNotValid(resourcePath, mustExist) {

  console.log("throwIfResourceNotValid", mustExist);

  let fileStats;

  try {
    fileStats = await stat(resourcePath);
  }
  catch(error) {
    if (error.code != "ENOENT") {
      throw error; // internal server error
    }
    else {
      if(mustExist) {
        throw {
          status: 404,
          body: "File not found",
        };
      }
      else {
        // file does not exist.
        return false;
      }
    }
  }

  if(fileStats.isDirectory()) {
    throw {
      status: 400,
      body: "Url needs to with a filename and extension",
    };
  }

  // file exists;
  return true;
}

function createDir(path) {
  let fileStats;
  try {
    fileStats = statSync(path);
    mkdirSync(path);
    console.log(`Created path ${path} successfully`)
  }
  catch(error) {
    if (error.code != "ENOENT") {
        throw(new Error(`Could not stat path ${path}, failed with ${error}`));
    }
  }
}