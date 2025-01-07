import express from "express";
import fs from "fs";
import bodyParser from "../body-parser";
import globalErrorHandler from "../middlewares/errorHandler.middleware";
import { v4 } from "uuid";
import { generatePayload } from "../utils/depth";
const http = require('http');
const WebSocket = require('ws');


// const socketManager = require("../sockets/socketManager");
// const http = require("http");
/*
  body-parser: Parse incoming request bodies in a middleware before your handlers, 
  available under the req.body property.
*/


const routeFiles = fs
  .readdirSync(__dirname + "/../routes/")
  .filter((file) => file.endsWith(".js"));

let server;
let routes = [];

const expressService = {
  init: async () => {
    try {
      /*
        Loading routes automatically
      */
       
      for (const file of routeFiles) {
        const route = await import(`../routes/${file}`);
        const routeName = Object.keys(route)[0];
        routes.push(route[routeName]);
      }

      // Initialize Express app
      const app = express();
      
      app.use(bodyParser.json({strict: false})); // for parsing application/json
      app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
      
     
      app.use((req, res, next) => {
        // console.log(`Request Method: ${req.method}`);
        // console.log(`Request URL: ${req.url}`);
        // if(req.url == "/api/v3/order"){
        //   // console.log(req);
        // }
       
        // console.log(`Request Body: ${JSON.stringify(req.body)}`);
        // console.log(v4());
        next(); // Proceed to the next middleware or route handler
      });

      app.use(routes);
      app.use(globalErrorHandler);
      
     // Create HTTP server using Express app
     const server = http.createServer(app);

     // Create WebSocket server
     const wss = new WebSocket.Server({ noServer: true });

     // Handle WebSocket upgrade
     server.on('upgrade', (request, socket, head) => {
       console.log('Handling WebSocket upgrade request');
       wss.handleUpgrade(request, socket, head, (ws) => {
         wss.emit('connection', ws, request);
        //  {"event":"info","version":2,"serverId":"3e904fb6-6eb5-49c6-93d4-ce20b4ef615c","platform":{"status":1}}
       });
     });

     // WebSocket connection logic
     wss.on('connection', (ws, req) => {
       console.log('WebSocket connection established');
       
      //  ws.send(JSON.stringify({event:"info",version:2,serverId:v4(),platform:{status:1}}));
       // Listen for messages
        // Track subscriptions per client
        const clientSubscriptions = new Set();
       ws.on('message', (message) => {
        console.log(message);
        try {
          const parsedMessage = JSON.parse(message);
          
          if (parsedMessage.method === 'SUBSCRIBE') {
            console.log(`Client subscribed to topic: ${parsedMessage.id}`);
            clientSubscriptions.add(parsedMessage.id);
          } else if (parsedMessage.type === 'unsubscribe') {
            console.log(`Client unsubscribed from topic: ${parsedMessage.id}`);
            clientSubscriptions.delete(parsedMessage.id);
          } else {
            console.log(`Received unsupported message type: ${parsedMessage}`);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
       });

       const interval = setInterval( async () => {
      
        for (let index = 0; index < clientSubscriptions.length; index++) {
          const id = clientSubscriptions[index];
          if(id = 1) {
            const ticker = "EPR-EGOD";
            const limit = 1000;
            const payload = await generatePayload({ ticker, limit });
            ws.send(JSON.stringify(payload));
          }else if(id = 2){
            ws.send(JSON.stringify({
              "result": null,
              "id": id
            }));
          }
        }
       
      }, 2000); 


       // Handle connection close
       ws.on('close', () => {
         console.log('WebSocket connection closed');
       });
     });
     
      server.listen(process.env.SERVER_PORT);

      console.log("[EXPRESS] Express initialized");
    } catch (error) {
      console.log("[EXPRESS] Error during express service initialization");
      throw error;
    }
  },
};

export default expressService;
