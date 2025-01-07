import { Router } from "express";
import blockController from "../controllers/blocks.controller";

const blockRoutes = Router();

// blockRoutes.get("/api/v3/blockchain/spin", blockController.spin);
blockRoutes.get("/api/v3/blockchain/order/book", blockController.getBlockchainOrderBook);
blockRoutes.get("/api/v3/blockchain/trade/book", blockController.getBlockchainTradeBook);
export { blockRoutes };
