

module.exports = (io) => {
    // io.use(middleware.authenticate);
    io.on('connect', () => {
        console.log('Connected to server:', socket.id);
      });
    io.on("connection", (socket) => {
      console.log("New client connected:", socket?.user || socket?.handshake);
      // console.log("New client connected:", socket.user.name);
  
      // Attach event handlers
    //   eventHandlers.attachHandlers(io, socket);
  
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket);
      });
    });
  };