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
import { createOrUpdateBotLastPrice, generateDescendingPrices, generatePayload, getMiddleNumber, getRandomAction, splitAmountIntoFortyParts } from '../utils/depth';
import { v4 } from 'uuid';
import Horder from '../models/Horder';
import { ORDER_BOOK_ABI } from '../utils/orderbookabi';
import { formatEther } from 'ethers';
import BotLastPrice from '../models/BotLastPrice';
const provider = new ethers.WebSocketProvider(process.env.WS_RPC_ADDRESS);
const providerRPC = new ethers.JsonRpcProvider(process.env.WS_HTTP_ADDRESS);

const contract = new ethers.Contract(process.env.EXCHANGE_CONTRACT,ABI_DATA, provider);
 const contractRPC = new ethers.Contract(process.env.EXCHANGE_CONTRACT, ABI_DATA, providerRPC);
 const contractRPCOrderBook = new ethers.Contract(process.env.EXCHANGE_ORDER_BOOK_CONTRACT, ORDER_BOOK_ABI, providerRPC);
 let local = "";

 if(process.env.NODE_ENV == "production"){
   local = "http://146.190.142.186";
 }else{
  local = "http://localhost";

 }

 


 const spinTask = async () => {
  try {
    const orderHolder = await fetch(`${local}:${process.env.SERVER_PORT}/api/v3/blockchain/spin`);
   
    
  setTimeout(spinTask, 3000);
  } catch (error) {
    console.log(error);
    
  }
 }

 const runOrdersEPREGOTask = async (ticker, apikey) => {
  try {
 
    const orderHolder = await fetch(`${local}:${process.env.SERVER_PORT}/api/v3/depth?symbol=${ticker}&limit=1000`);
    const orderHolderData = await orderHolder.json();
    
    let bidPrices = [];
    let askPrices = [];
    for (let index = 0; index < orderHolderData.bids.length; index++) {
      const element = orderHolderData.bids[index];
      bidPrices.push(parseFloat(element[0]));
    }
    for (let y = 0; y < orderHolderData.asks.length; y++) {
      const element = orderHolderData.asks[y];
      askPrices.push(parseFloat(element[0]));
    }
   let bidmid = await getMiddleNumber(bidPrices);
   let askmid =  await getMiddleNumber(askPrices);
   await createOrUpdateBotLastPrice({ticker: ticker, newPrice:bidmid,side: "BUY"})
   appEventEmitter.emit("BotPlacedOrder", {ticker: ticker, newPrice:bidmid,side: "BUY", apikey: apikey});
   await createOrUpdateBotLastPrice({ticker: ticker, newPrice:askmid,side: "SELL"})
   appEventEmitter.emit("BotPlacedOrder", {ticker:ticker, newPrice:askmid,side: "SELL", apikey: apikey});


  } catch (error) {
    console.log(error);
    
  }
 }

 

 const putVolume = async (apikey, ticker) => {
  try {
    
   let action = await getRandomAction();
   const orderHolder = await fetch(`${local}:${process.env.SERVER_PORT}/api/v3/prepare/and/trade?person=${apikey}&type=${action}&ticker=${ticker}`);
  } catch (error) {
    console.log(error);
    
  }
 }

 const volumeEPREGOD = async () => {
  try {
    await putVolume("0x9245c49245fBa6491Dea0649Cb13ceeED568d646F199F1", "EPR-EGOD");
   setTimeout(volumeEPREGOD, 15000);
  } catch (error) {
    console.log(error);
    
  }
 }


 const volumeEGAXEGOD = async () => {
  try {
    await putVolume("0x74c0a00d4E7525a1816800d4E36ac1567ee35CA844", "EGAX-EGOD");
   setTimeout(volumeEGAXEGOD, 15000);
  } catch (error) {
    console.log(error);
    
  }
 }

 
 const cleanEGODEPR = async () => {
     const orderHolder = await fetch("http://localhost:666/api/v3/blockchain/clearTradeConflits?address=0xc49245fBa1Dea0649Cb13ceeED56C068d646F199&ticker=EPR-EGOD");
     setTimeout(cleanEGODEPR, 15000);
 }

 const cleanEGODEGAX = async () => {
  const orderHolder = await fetch("http://localhost:666/api/v3/blockchain/clearTradeConflits?address=0x74c0a7525a1816800d4E36ac1555567ee35CA844&ticker=EGAX-EGOD");
  setTimeout(cleanEGODEGAX, 15000);
}
//  const cleanIt = async () => {
//   try {
//     const orderHolder = await fetch(`https://backtest.egomart.org/web3/clean-it?user=0xc49245fBa1Dea0649Cb13ceeED56C068d646F199`);
//     const orderHolder2 = await fetch(`https://backtest.egomart.org/web3/clean-it?user=0x74c0a7525a1816800d4E36ac1555567ee35CA844`);

    
  
//    setTimeout(cleanIt, 3000);
//   } catch (error) {
//     console.log(error);
    
//   }
//  }

 const EPREGOD = async () => {
  try {
    await runOrdersEPREGOTask("EPR-EGOD", "big70");
   setTimeout(EPREGOD, 15000);
  } catch (error) {
    console.log(error);
    
  }
 }
 cleanEGODEGAX();
 cleanEGODEPR()
  EPREGOD();
  volumeEPREGOD();
 volumeEGAXEGOD();
  spinTask();
let blockController = {
  
  getBlockchainOrderBook: async (req, res, next) => {
    try {
      await OrderPlaced.destroy({
        where: {
          id: {
            [Op.gt]: 0, // Greater than 0
          },
        },
      });
      const value = await contractRPCOrderBook.getSymbolOrderBook(req.query.symbol);

    
        for (let index = 0; index < value.length; index++) {
            const order = value[index];
        
            let isSale = order[0];
            let userAddress = order[1];
            let price = formatEther(order[2]);
            let numberOfShares = formatEther(order[3]);
            let filled = formatEther(order[4]);
            let uuid = order[5];
            const orderRs = await OrderPlaced.findOne({ where: { uuid: uuid } });
            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');
     if (!orderRs) {
      if (parseFloat(numberOfShares) > parseFloat(filled)) {
        // await OrderPlaced.create({
        //   isSale: isSale,
        //   userAddress: userAddress,
        //   value: price,
        //   numberOfShares: numberOfShares,
        //   orderId: index+1,
        //   ticker: req.query.symbol,
        //   uniqueOrderID: index+1,
        //   time: formattedDate,
        //   uuid: uuid,
        //   filled: filled
        //  });
      }
     

     }

          }
      
      return res.status(200).json({});
    } catch (error) {
      console.log(error)
      next(error);
    }
  },


  getBlockchainTradeBook: async (req, res, next) => {
    try {
      const value = await contractRPCOrderBook.getSymbolTrades(req.query.symbol);

    
        for (let index = 0; index < value.length; index++) {
            const order = value[index];
            let symbol = order[0];
            let buyOrderId = order[1];
            let sellOrderId = order[2];
            let buyer = order[3];
            let seller = order[4];
            let amount = formatEther(order[5]);
            let price = formatEther(order[6]);
            let timestamp = new Date(parseInt(order[7]) * 1000);


            const orderRs = await Trade.findOne({ where: { [Op.or]: [
              { sellerUuid: sellerUuid },
              { buyerUuid: sellerUuid }
            ],
             } });

             if (!orderRs) {

              Trade.create({

              });
             }

          }
      
      return res.status(200).json({});
    } catch (error) {
      next(error);
    }
  },

  

};

export default blockController;
