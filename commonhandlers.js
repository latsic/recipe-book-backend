
module.exports = class CommonHandlers {
  
  async  handlerNotAllowed(request) {
    return {
      status: 405,
      body: `Method ${request.method} not allowed.`
    };
  }

  async handlerOptions(request) {
    return {
      status: 200,
      body: "",
      type: "text/plain"
    };
  }
}