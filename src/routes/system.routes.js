import { Router } from "express";
import systemController from "../controllers/system.controller";

const hummingRoutes = Router();
hummingRoutes.get("/api/v3/ping", systemController.ping);
hummingRoutes.get("/api/v3/depth", systemController.depth);
hummingRoutes.get("/api/v3/prepare/and/trade", systemController.prepareAndTrade);

hummingRoutes.get("/api/v3/ticker/24hr", systemController.stats);
hummingRoutes.get("/api/v3/time", systemController.time);
hummingRoutes.get("/past/events", systemController.pastEvents);
hummingRoutes.get("/api/v3/exchangeInfo", systemController.exchangeInfo);
hummingRoutes.get("/api/v3/account", systemController.account);
hummingRoutes.get("/api/v3/myTrades", systemController.myTrades);
hummingRoutes.post("/api/v3/userDataStream", systemController.userDataStreamPost);
hummingRoutes.post("/api/v3/order", systemController.order);
hummingRoutes.get("/api/v3/order", systemController.get);
hummingRoutes.delete("/api/v3/order", systemController.delete);
hummingRoutes.put("/api/v3/userDataStream", systemController.userDataStreamPut);
hummingRoutes.delete("/api/v3/userDataStream", systemController.userDataStreamPut);
hummingRoutes.get("/api/v3/blockchain/spin", systemController.spin);




export { hummingRoutes };
