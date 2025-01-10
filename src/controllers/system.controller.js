require("../utils/listeners")
import { ABI_DATA } from '../utils/abi';
import { EXCHANGE_INFO } from '../utils/exchangeInfo';
import appEventEmitter from '../utils/events';
import { EXCHANGE_ACCOUNT } from '../utils/account';
import { getFilter } from '../utils/filters';
import Trader from '../models/Trader';
import AssetAdded from '../models/AssetAdded';
import OrderPlaced from '../models/OrderPlaced';
import Trade from '../models/Trade';
const { default: Block } = require('../models/Block');
const { Op, Sequelize } = require('sequelize');
const ethers = require("ethers");
require('dotenv/config');
import databaseConfig from "../config/database";
import { createOrUpdateBotLastPrice, generatePayload, registerBlock } from '../utils/depth';
import { v4 } from 'uuid';
import Horder from '../models/Horder';
import { ORDER_BOOK_ABI } from '../utils/orderbookabi';
import { formatEther } from 'ethers';
const provider = new ethers.WebSocketProvider(process.env.WS_RPC_ADDRESS);
const providerRPC = new ethers.JsonRpcProvider(process.env.RPC_URL);

const contract = new ethers.Contract(process.env.EXCHANGE_CONTRACT,ABI_DATA, provider);
 const contractRPC = new ethers.Contract(process.env.EXCHANGE_CONTRACT, ABI_DATA, providerRPC);
 const contractRPCOrderBook = new ethers.Contract(process.env.EXCHANGE_ORDER_BOOK_CONTRACT, ORDER_BOOK_ABI, providerRPC);

// const connectWebSocket = async () => {
//   try {
//     console.log('Connecting to WebSocket...');
  
//     contract.on("*", (event) => {
//       appEventEmitter.emit(event.log.fragment.name, event.log.args);
//     });
//   } catch (err) {
//     console.error('Connection Error:', err);
//     setTimeout(connectWebSocket, 5000); // Retry after delay
//   }
// };
//connectWebSocket();

let systemController = {
  spin: async (req, res, next) => {
    try {

//  await createOrUpdateBotLastPrice({ticker: "EPR-EGOD", newPrice:0.345,side: "BUY"});
    

//  // appEventEmitter.emit("CheckOrderBookAndMakeSureThereIsEnoughOrderOnTheSide", {ticker: "EPR-EGOD", newPrice:0.344,side: "SELL"});
//      appEventEmitter.emit("BotPlacedOrder", {ticker: "EPR-EGOD", newPrice:0.345,side: "BUY"});
   
let pendings = await Horder.findAll();
//console.log(pendings);

for (let index = 0; index < pendings.length; index++) {
  const element = pendings[index];
  if(element.status == "CANCELLED"){
    const trader = await Trader.findOne({where: {apikey: "big70"}});
    if(trader){

      let price = element.price;
      let multiplier = 1000000000000000000;
      let prices = (parseFloat(price) * multiplier).toString();
      let uuid = element.newClientOrderId;
      let isSale = element.side == "SELL" ? 1 : 0;
      let ticker =element.symbol;
    const signer = new ethers.Wallet(trader.key, providerRPC);
          const contractRPC = new ethers.Contract(process.env.EXCHANGE_CONTRACT, ABI_DATA,signer);
          const nonce = await providerRPC.getTransactionCount(trader.address, "pending");
          const tx = await contractRPC.cancelOrder(ticker,prices.toString(),isSale,uuid, {
            gasLimit: 3000000,
            nonce:  nonce,// Optional, specify gas limit
          });
          await Horder.destroy({where:{id:element.id}});
    //       console.log(tx);
  }

  } 
    else if(element.status == "OPEN"){
      const trader = await Trader.findOne({where: {apikey: "big70"}});
      if(trader){
    let price = parseFloat(element.price);
    let amount = parseFloat(element.amount);
   let side = element.side == "SELL" ? true : false;
     

   let multiplier = 1000000000000000000;
        let prices = [(parseFloat(price) * multiplier).toString()];
         amount = parseFloat(amount) * multiplier;
       const signer = new ethers.Wallet(trader.key, providerRPC);
       const contractRPC = new ethers.Contract(process.env.EXCHANGE_CONTRACT, ABI_DATA,signer);
       const nonce = await providerRPC.getTransactionCount(trader.address, "pending");
       const tx = await contractRPC.marketOrderTrade(prices,amount.toString(),side,element.symbol,element.newClientOrderId, {
         gasLimit: 3000000,
         nonce:  nonce,// Optional, specify gas limit
       });
       await Horder.destroy({where:{id:element.id}});
  }
  console.log();
}else{
  await Horder.destroy({where:{id:element.id}});
}
}



      return res.status(200).json({});
    } catch (error) {
      console.log(error)
      next(error);
    }
  },
  ping: async (req, res, next) => {
    try {
    
      return res.status(200).json({});
    } catch (error) {
      next(error);
    }
  },

  time: async (req, res, next) => {
    try {
      const timestamp = Date.now(); 
      return res.status(200).json({ "serverTime": timestamp});
    } catch (error) {
      next(error);
    }
  },

  depth: async (req, res, next) => {
    try {
      await OrderPlaced.destroy({
        where: {
          filled: {
            [Sequelize.Op.gte]: Sequelize.col('numberOfShares'), // 'gte' stands for 'greater than or equal to'
          },
        },
      });
      const value = await OrderPlaced.findAll({
        where: {
          ticker: req.query.symbol,
          numberOfShares: {
            [Op.gt]: Sequelize.col('filled')
          }
        },
        order: [['value', 'DESC']],
      });
      const ticker = req.query.symbol;
      const limit = req.query.limit;
      const payload = await generatePayload({ ticker, limit, value});
      return res.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  },

  userDataStreamPost: async (req, res, next) => {
    try {
      
      return res.status(200).json({
        "listenKey": "pqia91ma19a5s61cv6a81va65sdf19v8a65a1a5s61cv6a81va65sdf19v8a65a1"
      });
    } catch (error) {
      next(error);
    }
  },
  

  get: async (req, res, next) => {
    try {
      let lapiKey = await req.headers['x-mbx-apikey'];
      if(lapiKey){
        const trader = await Trader.findOne({where: {apikey: lapiKey}});

        if(trader){
         // contractRPCOrderBook.getUserOrderBook(req.query.symbol, trader.address);
          const order = await OrderPlaced.findOne({where:{ticker:req.query.symbol, userAddress: trader.address, uuid: req.query.origClientOrderId}})
          

          if(order == null){
            return res.status(200).json(
              {})
          }
          let orderSide = order.isSale == true ? "SELL" : "BUY";
          return res.status(200).json(
            {
              "symbol": req.query.symbol,
              "orderId":  Math.floor(Math.random() * (1000 - 5 + 1)) + 1,
              "orderListId": -1,                
              "clientOrderId": req.query.origClientOrderId,
              "price": parseFloat(order.value),
              "origQty": parseFloat(order.numberOfShares),
              "executedQty": "0.0",
              "cummulativeQuoteQty": "0.0",
              "status": "NEW",
              "timeInForce": "GTC",
              "type": "LIMIT",
              "side": orderSide,
              "stopPrice": "0.0",
              "icebergQty": "0.0",
              "time":new Date(order.time).getTime(),
              "updateTime": new Date(order.updatedAt).getTime(),
              "isWorking": true,
              "workingTime":Date.now(),
              "origQuoteOrderQty": "0.000000",
              "selfTradePreventionMode": "NONE"
            }
          );

     

        }else{
          return res.status(200).json(
            {}
          )
        }


    
      }else{
        return res.status(200).json(
          {}
        )
      }

      
    } catch (error) {
      next(error);
    }
  },

  order: async (req, res, next) => {
    try {
      let lapiKey = await req.headers['x-mbx-apikey'];
      if(lapiKey){
    
    const trader = await Trader.findOne({where: {apikey: lapiKey}});

    if(trader){
      let price = parseFloat(req.body.price);
     let amount = parseFloat(req.body.quantity);
    let side = req.body.side == "SELL" ? true : false;
      

    let multiplier = 1000000000000000000;
         let prices = [(parseFloat(price) * multiplier).toString()];
          amount = parseFloat(amount) * multiplier;
        const signer = new ethers.Wallet(trader.key, providerRPC);
        const contractRPC = new ethers.Contract(process.env.EXCHANGE_CONTRACT, ABI_DATA,signer);
        const nonce = await providerRPC.getTransactionCount(trader.address, "pending");
        const tx = await contractRPC.marketOrderTrade(prices,amount.toString(),side,req.body.symbol,req.body.newClientOrderId, {
          gasLimit: 3000000,
          nonce:  nonce,// Optional, specify gas limit
        });
        await createOrUpdateBotLastPrice({ticker: req.body.symbol, newPrice:price,side: req.body.side})
        appEventEmitter.emit("BotPlacedOrder", {ticker: req.body.symbol, newPrice:price,side: req.body.side});
 
    return res.status(200).json(
      {
        "symbol": req.body.symbol,
        "orderId": Math.floor(Math.random() * (1000 - 5 + 1)) + 1,
        "orderListId": -1, // Unless it's part of an order list, value will be -1
        "clientOrderId":req.body.newClientOrderId,
        "transactTime": Date.now()
      }
    );
    }else{
      return res.status(200).json({});
    }
      }

      
    } catch (error) {
      console.log(error)
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      
    let lapiKey = await req.headers['x-mbx-apikey'];
    if(lapiKey){
     
     const trader = await Trader.findOne({where: {apikey: lapiKey}});
    
     if(trader){
      const order = await OrderPlaced.findOne({where:{ticker:req.query.symbol, userAddress: trader.address, uuid: req.query.origClientOrderId}})
          
       let orderPrice = 0;
       let ordeAamount =0;
       let orderSide = "";
       let orderId = 0;
      if (order) {
        if(order.uuid == req.query.origClientOrderId){
          let price = order.value;
           ordeAamount = order.numberOfShares;
          let multiplier = 1000000000000000000;
          let prices = (parseFloat(price) * multiplier).toString();
          orderPrice = price;
          orderId = order.id;
          let ticker = req.query.symbol;
          let isSale = order.isSale == true ? 1 : 0;
          orderSide = order.isSale == true ? "SELL" : "BUY";
          let uuid = req.query.origClientOrderId;
          const trader = await Trader.findOne({where: {apikey: lapiKey}});
          const signer = new ethers.Wallet(trader.key, providerRPC);
          const contractRPC = new ethers.Contract(process.env.EXCHANGE_CONTRACT, ABI_DATA,signer);
          const nonce = await providerRPC.getTransactionCount(trader.address, "pending");
          const tx = await contractRPC.cancelOrder(ticker,prices.toString(),isSale,uuid, {
            gasLimit: 3000000,
            nonce:  nonce,// Optional, specify gas limit
          });

          console.log(tx);

        }
      }
             
                
        if(orderSide == ""){
          return res.status(200).json({})
        }

      
      return res.status(200).json(
        {
          "symbol": req.query.symbol,
          "origClientOrderId": req.query.origClientOrderId,
          "orderId": orderId,
          "orderListId": -1, // Unless it's part of an order list, value will be -1
          "clientOrderId": req.query.origClientOrderId,
          "transactTime": Date.now(),
          "price": orderPrice,
          "origQty": ordeAamount,
          "executedQty": "0.00000000",
          "cummulativeQuoteQty": "0.00000000",
          "status": "CANCELED",
          "timeInForce": "GTC",
          "type": "LIMIT",
          "side": orderSide,
          "selfTradePreventionMode": "NONE"
        }
      );
    }else{
      return res.status(200).json({})
    }
  
      }

      
    } catch (error) {
      console.log(error);
      next(error);
    }
  },


 
  userDataStreamPut: async (req, res, next) => {
    try {
      
      return res.status(200).json({});
    } catch (error) {
      next(error);
    }
  },

  userDataStreamDelete: async (req, res, next) => {
    try {
      
      return res.status(200).json({});
    } catch (error) {
      next(error);
    }
  },

  myTrades: async (req, res, next) => {
    try {
      // let orders = await Horder.findAll({where: {symbol: req.query.symbol, status: "PLACED"}})
      let payload = [];
      // orders.map((order) => {
      //   let token = req.query.symbol.split("-");
      //   let commissionToken = 
      //   payload.push(
      //     {
      //       "symbol": req.query.symbol,
      //       "id": order.id,
      //       "orderId": order.newClientOrderId,
      //       "orderListId": -1,
      //       "price": order.price,
      //       "qty": order.price,
      //       "quoteQty": "48.000012",
      //       "commission": "10.10000000",
      //       "commissionAsset": "BNB",
      //       "time": 1499865549590,
      //       "isBuyer": true,
      //       "isMaker": false,
      //       "isBestMatch": true
      //     }
      //   )

      // });

  
      return res.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  },

  stats: async (req, res, next) => {
    try {
      let sequelize = new Sequelize(databaseConfig);
      const currentTime = Date.now();
      const startTime = currentTime - 100 * 60 * 60 * 1000; // 24 hours ago

      const trades = await Trade.findAll({
        attributes: [
          [sequelize.fn('MIN', sequelize.col('value')), 'lowPrice'],
          [sequelize.fn('MAX', sequelize.col('value')), 'highPrice'],
          [sequelize.fn('SUM', sequelize.col('numberOfShares')), 'volume'],
          [sequelize.fn('SUM', sequelize.literal('value / numberOfShares')), 'quoteVolume'],
          [sequelize.fn('AVG', sequelize.col('value')), 'weightedAvgPrice'],
          [sequelize.fn('COUNT', '*'), 'tradeCount'],
        ],
        where: {
          ticker: req.query.symbol,
           createdAtOnChain: { [Op.between]: [new Date(startTime).toISOString().slice(0, 19).replace('T', ' '), new Date(currentTime).toISOString().slice(0, 19).replace('T', ' ')] },
        },
        raw: true,
      });

      const openTrade = await Trade.findOne({
        where: { ticker: req.query.symbol, createdAtOnChain: { [Op.gte]: new Date(startTime).toISOString().slice(0, 19).replace('T', ' ') } },
        attributes: ['value'],
        order: [['createdAtOnChain', 'ASC']],
        raw: true,
      });
    
      // Fetch the last trade for `lastPrice` and `lastQty`
      const lastTrade = await Trade.findOne({
        where: { ticker: req.query.symbol, createdAtOnChain: { [Op.lte]: new Date(currentTime).toISOString().slice(0, 19).replace('T', ' ') } },
        attributes: ['value', 'numberOfShares'],
        order: [['createdAtOnChain', 'DESC']],
        raw: true,
      });

        // Fetch order book data
    const orderDataBid = await OrderPlaced.findOne({
      where: { ticker: req.query.symbol, isSale: 0 },
      attributes: ['value', 'numberOfShares'],
      order: [['time', 'DESC']],
      raw: true,
    });


    const orderDataAsk = await OrderPlaced.findOne({
      where: { ticker: req.query.symbol, isSale: 1 },
      attributes: ['value', 'numberOfShares'],
      order: [['time', 'DESC']],
      raw: true,
    });

      let ticker = req.query.symbol.replace("-", "");
      return res.status(200).json({
        "symbol": req.query.symbol,
        "s": req.query.symbol,
        "priceChange": (parseFloat(lastTrade?.value || 0) - parseFloat(openTrade?.value || 0)).toFixed(8),
        "priceChangePercent": (
      ((parseFloat(lastTrade?.value || 0) - parseFloat(openTrade?.value || 0)) / parseFloat(openTrade?.value || 0)) *
      100
    ).toFixed(3),
        "weightedAvgPrice": parseFloat(trades[0]?.weightedAvgPrice || 0),
        "prevClosePrice": parseFloat(openTrade?.value || 0),
        "lastPrice": parseFloat(lastTrade?.value || 0),
        "lastQty": parseFloat(lastTrade?.numberOfShares || 0),
        "bidPrice": parseFloat(orderDataBid?.value || 0),
        "bidQty": parseFloat(orderDataBid?.numberOfShares || 0),
        "askPrice": parseFloat(orderDataAsk?.value || 0),
        "askQty": parseFloat(orderDataAsk?.numberOfShares || 0),
        "openPrice": parseFloat(openTrade?.value || 0),
        "highPrice": parseFloat(trades[0]?.highPrice || 0),
        "lowPrice": parseFloat(trades[0]?.lowPrice || 0),
        "volume": parseFloat(trades[0]?.volume || 0),
        "quoteVolume": parseFloat(trades[0]?.quoteVolume || 0),
        "openTime": startTime,
        "closeTime": currentTime,
        "firstId": await Trade.min('id', {
          where: { ticker: req.query.symbol, createdAtOnChain: { [Op.gte]: new Date(startTime).toISOString().slice(0, 19).replace('T', ' ') } },
        }),
        "lastId": await Trade.max('id', {
          where: { ticker: req.query.symbol, createdAtOnChain: { [Op.lte]: new Date(currentTime).toISOString().slice(0, 19).replace('T', ' ') } },
        }),  // Last tradeId
        "count": parseFloat(trades[0].tradeCount),         // Trade count
      });
    } catch (error) {
      next(error);
    }
  },
  exchangeInfo: async (req, res, next) => {
    try {
      const timestamp = Date.now(); 
      let exchange_info = EXCHANGE_INFO;
      

       const assets = await AssetAdded.findAll();
       let symbolsHolder = []
       for (let index = 0; index < assets.length; index++) {
        const element = assets[index];
       
         let tokenA = element.ticker.split('-')[0];
         let tokenB = element.ticker.split('-')[1];
          symbolsHolder.push(
            {
              "symbol": element.ticker,
              "status": "TRADING",
              "baseAsset": tokenA ,
              "baseAssetPrecision": 8,
              "quoteAsset": tokenB,
              "quotePrecision": 8,
              "quoteAssetPrecision": 8,
              "baseCommissionPrecision": 8,
              "quoteCommissionPrecision": 8,
              "orderTypes": [
                "LIMIT",
                "LIMIT_MAKER",
                "MARKET",
                "STOP_LOSS",
                "STOP_LOSS_LIMIT",
                "TAKE_PROFIT",
                "TAKE_PROFIT_LIMIT"
              ],
              "icebergAllowed": true,
              "ocoAllowed": true,
              "otoAllowed": true,
              "quoteOrderQtyMarketAllowed": true,
              "allowTrailingStop": true,
              "cancelReplaceAllowed": true,
              "isSpotTradingAllowed": true,
              "isMarginTradingAllowed": true,
              "filters": [
                {
                  "filterType": "PRICE_FILTER",
                  "minPrice": "0.00001000",
                  "maxPrice": "922327.00000000",
                  "tickSize": "0.00001000"
                },
                {
                  "filterType": "LOT_SIZE",
                  "minQty": "0.00010000",
                  "maxQty": "100000.00000000",
                  "stepSize": "0.00010000"
                },
                {
                  "filterType": "ICEBERG_PARTS",
                  "limit": 10
                },
                {
                  "filterType": "MARKET_LOT_SIZE",
                  "minQty": "0.00000000",
                  "maxQty": "1823.06221375",
                  "stepSize": "0.00000000"
                },
                {
                  "filterType": "TRAILING_DELTA",
                  "minTrailingAboveDelta": 10,
                  "maxTrailingAboveDelta": 2000,
                  "minTrailingBelowDelta": 10,
                  "maxTrailingBelowDelta": 2000
                },
                {
                  "filterType": "PERCENT_PRICE_BY_SIDE",
                  "bidMultiplierUp": "5",
                  "bidMultiplierDown": "0.2",
                  "askMultiplierUp": "5",
                  "askMultiplierDown": "0.2",
                  "avgPriceMins": 5
                },
                {
                  "filterType": "NOTIONAL",
                  "minNotional": "0.00010000",
                  "applyMinToMarket": true,
                  "maxNotional": "9000000.00000000",
                  "applyMaxToMarket": false,
                  "avgPriceMins": 5
                },
                {
                  "filterType": "MAX_NUM_ORDERS",
                  "maxNumOrders": 200
                },
                {
                  "filterType": "MAX_NUM_ALGO_ORDERS",
                  "maxNumAlgoOrders": 5
                }
              ],
              "permissions": [],
              "permissionSets": [
                [
                  "SPOT",
                  "MARGIN"
                ]
              ],
              "defaultSelfTradePreventionMode": "EXPIRE_MAKER",
              "allowedSelfTradePreventionModes": [
                "EXPIRE_TAKER",
                "EXPIRE_MAKER",
                "EXPIRE_BOTH"
              ]
            });
    
       }
       exchange_info.serverTime = timestamp;
       exchange_info.symbols = symbolsHolder;
        // console.log(symbolsHolder);
    
      return res.status(200).json(exchange_info);
    } catch (error) {
      next(error);
    }
  },
  account: async (req, res, next) => {
    try {
      const timestamp = Date.now(); 
      let exchange_account = EXCHANGE_ACCOUNT;
       exchange_account.updateTime = timestamp;
       exchange_account.uid = timestamp;

      let lapiKey = await req.headers['x-mbx-apikey'];
      

      if(lapiKey){
        const trader = await Trader.findOne({where: {apikey: lapiKey}});
      let balancesObject = []
      if(trader){
      const assets = await AssetAdded.findAll();

       let assetlist = []
       let assetObjectlist = []
       

        assets.forEach(async (asset) => {
        
          let tokenA = asset.ticker.split('-')[0];
          let tokenB = asset.ticker.split('-')[1];
          if(assetlist.includes(tokenA) == false){
            assetlist.push(tokenA);
            assetObjectlist.push({
              tokenSymbol: tokenA,
              contractAddress: asset.tokenA
            })
          }

          if(assetlist.includes(tokenB) == false){
            assetlist.push(tokenB);
            assetObjectlist.push({
              tokenSymbol: tokenB,
              contractAddress: asset.tokenB
            })
          }
       

        });
        for (const assetObject of assetObjectlist) {
        // assetObjectlist.forEach( async (assetObject)  =>  {
        
           const value = await contractRPC.balances(trader.address, assetObject.contractAddress); // Assuming is a view function
         let rsBalance = ethers.formatEther(value);
         
         if(parseFloat(rsBalance) > 0){
          console.log(rsBalance);
          balancesObject.push({
            "asset": assetObject.tokenSymbol,
            "free": parseFloat(rsBalance),
            "locked": 0
          });
         
         }
        };
        
       
        exchange_account.balances = balancesObject;
        
      return res.status(200).json(exchange_account);

        
      }else{
      exchange_account.balances = []
      return res.status(200).json(exchange_account);

      }
      
      }else{
        exchange_account.balances = []
        return res.status(200).json(exchange_account);
      }


     
     
    } catch (error) {
      next(error);
    }
  },
 
  pastEvents: async (req, res, next) => {
    try {
      let pastEventName = req.query.event;
      
      let fromBlock = parseInt(process.env.START_BLOCK) + 1; // Replace with your desired block range
      let toBlock = parseInt(process.env.START_BLOCK) + 9999;
      let hasEntry = false;
      const block = await Block.findOne({where: {event_name: pastEventName}});
     
      if(block){
         fromBlock = block.block_number + 1; // Replace with your desired block range
         toBlock = block.block_number + 9999;
         hasEntry = true;
      }
   
      
      
      let filter = getFilter(contract, pastEventName);
    const events = await contractRPC.queryFilter(
      filter, // Specify the event (use filters for indexed fields)
      fromBlock,
      toBlock
    );

    if(events.length > 0){
    
        for (let index = 0; index < events.length; index++) {
          const data = events[index].args;
          const block = events[index];
          
        if(pastEventName == "OrderPlaced"){
          try {
            const orderRs = await OrderPlaced.findOne({ where: {uuid: data[8]} });
             if(orderRs == null){
              const payload = {
                isSale: data[0],
                userAddress: data[1],
                value: formatEther(data[2]),
                numberOfShares: formatEther(data[3]),
                orderId: parseInt(data[4]),
                ticker: data[5],
                uniqueOrderID: parseInt(data[6]),
                time:new Date(parseInt(data[7]) * 1000),
                uuid: data[8],
                filled: 0
            }
             await OrderPlaced.create(payload);
             await registerBlock({block_number: block.blockNumber, to_block: toBlock, block_name: pastEventName, hasEntry});
             }
           } catch (error) {
              console.log(error)
           }
        }else if(pastEventName == "OrderCanceled"){
          try {
            
             // Find a single user
             console.log("data[8]", data[8]);
             console.log("data[8]", data);
             const order = await OrderPlaced.findOne({ where: { uuid: data[8]} });
         
             if (order) {
               await order.destroy();
             await registerBlock({block_number: block.blockNumber, to_block: toBlock, block_name: pastEventName, hasEntry});
              
             } else {
              await registerBlock({block_number: block.blockNumber, to_block: toBlock, block_name: pastEventName, hasEntry});
            
             }
           } catch (error) {
             console.log(error);
           }
        }else if(pastEventName == "Trade") {
          try {
   

  

            // const orderRs = await Trade.findOne({ where: { [Op.or]: [
            //   { sellerUuid: data[10] },
            //   { buyerUuid: data[10] }
            // ],
            //  } });
             
        
             let uuidToQuery = "";
            //  console.log("CheckTradeExist", orderRs);
            //  enum TradeType {BUY,SELL}
            
              if(parseInt(data[0]) == 0){
                uuidToQuery = data[10];
              }else {
                uuidToQuery = data[11];
        
              }
             
              const findOrderRs = await OrderPlaced.findOne({ where: {[Op.or]: [
                { uuid: data[10] },
                { uuid: data[11] }
              ],} });
              console.log(findOrderRs);
              let amount  = formatEther(data[6]);
              if(findOrderRs){
                await findOrderRs.increment('filled', { by: parseFloat(amount) });
              }
                
                
              
              const payload = {
                typeOfTrade: data[0],
                seller: data[1],
                buyer: data[2],
                ticker: data[3],
                createdAtOnChain: new Date(parseInt(data[4]) * 1000),
                value: data[5],
                numberOfShares: formatEther(data[6]),
                orderId: parseInt(data[7]),
                uniqueOrderID: parseInt(data[8]),
                isMarketOrder: data[9],
                sellerUuid: data[10],
                buyerUuid: data[11],
               }
            await Trade.create(payload);
            await registerBlock({block_number: block.blockNumber, to_block: toBlock, block_name: pastEventName, hasEntry});
          
            
             
          } catch (error) {
             console.log(error);
          }
        }
        //appEventEmitter.emit(pastEventName, event.args);
        // console.log("event:", event);
        // console.log("event.fragment.name:", event.fragment.name);
        // console.log("event.args:", event.args);

     //appEventEmitter.emit("BlockUpdate", {block_number: event.blockNumber, to_block: toBlock, block_name: pastEventName, hasEntry});

      }
    }else{
     let current = await provider.getBlockNumber();
     await registerBlock({block_number: current, to_block: toBlock, block_name: pastEventName, hasEntry});
    }
    // Process events
    


      // let eventFilter = contract.filters.OrderPlaced()
      // let events = await contract.queryFilter(eventFilter)
    
      // console.log(events);
      return res.status(200).json({});
    } catch (error) {
      next(error);
    }
  },
};

export default systemController;
