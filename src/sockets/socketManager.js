let io;

module.exports = {
  init: (httpServer) => {
   
    io = require("socket.io")(httpServer, {
        transports: ['websocket'],
      cors: {
        origin: (origin, callback) => {
          const allowedOrigins = [
            "*",
            "https://www.egomartui.egodeo.org",
            "https://egomartui.egodeo.org",

            "http://localhost:5173",
          ];
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};