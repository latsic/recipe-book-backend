
module.exports = class CommonHandlers {
  
  async  handlerNotAllowed(request) {
    return {
      status: 405,
      body: `Method ${request.method} not allowed.`
    };
  }
}