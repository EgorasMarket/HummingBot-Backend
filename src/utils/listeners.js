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

