const { formatEther } = require('ethers');
const { default: OrderPlaced } = require('../models/OrderPlaced');
const appEventEmitter = require('./events');
const { default: Block } = require('../models/Block');
const { default: AssetAdded } = require('../models/AssetAdded');
const { Op, fn } = require("sequelize");
const { default: Trade } = require('../models/Trade');
const { default: Horder } = require('../models/Horder');
const { default: Trader } = require('../models/Trader');
const ethers = require("ethers");
require('dotenv/config');
import { console } from 'inspector';
import BotLastPrice from '../models/BotLastPrice';
import TraderLastPrice from '../models/TraderLastPrice';
import { ABI_DATA } from '../utils/abi';
const providerRPC = new ethers.JsonRpcProvider(process.env.WS_HTTP_ADDRESS);
// Example listener
appEventEmitter.on('OrderPlaced', async (data) => {
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
   }
 } catch (error) {
    console.log(error)
 }
});






appEventEmitter.on('Trade', async (data)  => {
  try {
   

  

    const orderRs = await Trade.findOne({ where: { [Op.or]: [
      { sellerUuid: data[10] },
      { buyerUuid: data[10] }
    ],
     } });
     

     let uuidToQuery = "";
     console.log("CheckTradeExist", orderRs);
    //  enum TradeType {BUY,SELL}
    if (orderRs == null) {
      if(parseInt(data[0]) == 0){
        uuidToQuery = data[10];
      }else {
        uuidToQuery = data[11];

      }
      const findOrderRs = await OrderPlaced.findOne({ where: {uuid: uuidToQuery} });
      console.log("findOrderRs", findOrderRs);
      if(findOrderRs == null){}else{
        let amount  = formatEther(data[6]);
        findOrderRs.filled = (parseFloat(findOrderRs.filled) + amount);
        findOrderRs.save();
     
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
  }
    }
     
  } catch (error) {
     console.log(error);
  }
 });

 
 appEventEmitter.on('AssetAdded', async (data) => {
  try {
     // Find a single user
     const order = await AssetAdded.findOne({ where: { ticker: data[0] } });

     if (order == "null") {
       await AssetAdded.create({
        ticker: data[0],
        tokenA: data[1],
        tokenB: data[2],
        initialPrice: 0,
        tokenAName: data[4],
        tokenBName: data[5],
        creator: data[6],
       });

     } else {
    
     }
   } catch (error) {
    console.log(error);
   }

});


appEventEmitter.on('OrderCanceled', async (data) => {
     try {
        // Find a single user
        const order = await OrderPlaced.findOne({ where: { uuid: parseInt(data[8])} });
    
        if (order) {
          await order.destroy();
         
        } else {
       
        }
      } catch (error) {
        console.log(error);
      }
  
 });

 appEventEmitter.on('BlockUpdate', async (data) => {
  try {
    let bl = 0;
    if(data.block_number > data.to_block){
      bl = data.to_block;
    }else{
      bl = data.block_number;
    }
    if(data.hasEntry){
      await Block.update({block_number:bl}, {where: {event_name: data.block_name}});
     
    }else{
      await Block.create({block_number:bl, event_name: data.block_name});
    }
     // Find a single user
    
   } catch (error) {
    
   }

});


// appEventEmitter.on('NewOrder', async (data) => {
//   try {
//     let order = await Horder.findOne({where: {newClientOrderId:data, status: "PENDING"}});

//     if(order){
//       const trader = await Trader.findOne({where: {apikey: order.lapiKey}});
//       if(trader){
//         let multiplier = 1000000000000000000;
//         let prices = [(parseFloat(order.price) * multiplier).toString()];
//         let ticker = order.symbol;
//         let amount = parseFloat(order.amount) * multiplier;
//         let isSale = order.side == "SELL" ? true : false;
//         let uuid = order.newClientOrderId;
        
//         const signer = new ethers.Wallet(trader.key, providerRPC);
//         const contractRPC = new ethers.Contract(process.env.EXCHANGE_CONTRACT, ABI_DATA,signer);
//         const nonce = await providerRPC.getTransactionCount(trader.address, "pending");
//         const tx = await contractRPC.marketOrderTrade(prices,amount.toString(),isSale,ticker,uuid, {

//           gasLimit: 3000000,
//           nonce:  nonce,// Optional, specify gas limit
//         });
          
//         order.status = "PLACED";
//         order.save();

        
//       }
//     }
    
    
//    } catch (error) {
//     console.log(error);
//    }

// });


// appEventEmitter.on('Deposit', async (data) => {
//   try {
//     console.log(data);
//     // let bl = 0;
//     // if(data.block_number > data.to_block){
//     //   bl = data.to_block;
//     // }else{
//     //   bl = data.block_number;
//     // }
//     // if(data.hasEntry){
//     //   await Block.update({block_number:bl}, {where: {event_name: data.block_name}});
     
//     // }else{
//     //   await Block.create({block_number:bl, event_name: data.block_name});
//     // }
//      // Find a single user
    
//    } catch (error) {
    
//    }

// });

