import dotenv from "dotenv";
import expressService from "./services/express.service";
import sequelizeService from "./services/sequelize.service";
import { createServer } from "http";
import { Server } from "socket.io";
import { createOrUpdateBotLastPrice } from "./utils/depth";
import appEventEmitter from "./utils/events";
require('./utils/listeners');
dotenv.config();

const services = [expressService, sequelizeService];

(async () => {
  try {

    for (const service of services) {
      
      await service.init();
    }
    console.log("Server initialized.");
    //PUT ADITIONAL CODE HERE.
      
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
