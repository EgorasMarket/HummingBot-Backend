const EventEmitter = require('events');
const { default: BotLastPrice } = require('../models/BotLastPrice');
const { default: TraderLastPrice } = require('../models/TraderLastPrice');
const { generateDescendingPrices, splitAmountIntoFortyParts, createOrUpdateTraderLastPrice } = require('./depth');
const ethers = require("ethers");
const { ABI_DATA } = require('./abi');
const { default: AssetAdded } = require('../models/AssetAdded');
const { default: Trader } = require('../models/Trader');
const { v4 } = require('uuid');
const { default: Horder } = require('../models/Horder');
const { default: OrderPlaced } = require('../models/OrderPlaced');
const { Sequelize } = require('sequelize');
const { default: Trade } = require('../models/Trade');
const { formatEther } = require('ethers');
const { Op, fn } = require("sequelize");
const { default: Block } = require('../models/Block');
require('dotenv/config');
const providerRPC = new ethers.JsonRpcProvider(process.env.WS_HTTP_ADDRESS);

 const contractRPC = new ethers.Contract(process.env.EXCHANGE_CONTRACT, ABI_DATA, providerRPC);
// Create a singleton EventEmitter instance
class AppEventEmitter extends EventEmitter {}
const appEventEmitter = new AppEventEmitter();

appEventEmitter.on('error', (err) => {
    console.error('Error in event emitter:', err);
  });

  appEventEmitter.on('fillUpOrderBook', async (data)  => {
   try {
    let  checkForOrder = await Horder.findOne({where: {symbol: data.ticker, side: data.side}});
    if(checkForOrder){}else{
      
    let prices = await generateDescendingPrices(data.newPrice, 40);
    console.log(prices)
    let findAsset = await AssetAdded.findOne({where: {ticker: data.ticker}});
    
    if(findAsset){
      
        if(data.side == "SELL"){
            const trader = await Trader.findOne({where: {apikey: "big70"}});
            if(trader){
                const value = await contractRPC.balances(trader.address, findAsset.tokenA); // Assuming is a view function
                let rsBalance = ethers.formatEther(value);
                if(parseFloat(rsBalance) > 0){
                    let tradeable = rsBalance * 0.95;
                    let amounts = await splitAmountIntoFortyParts(tradeable, 40);
                    let payload = [];
                    for (let index = 0; index < prices.length; index++) {
                        payload.push({price: prices[index], amount: amounts[index], symbol: data.ticker, side: data.side, newClientOrderId: v4(), lapiKey: "big70", status: "OPEN"});
                    }
                    await Horder.bulkCreate(payload, {
                        validate: true, // Validate each record before insertion
                        ignoreDuplicates: true, // Skip records that cause unique constraint errors
                      });
                      await createOrUpdateTraderLastPrice({ticker: data.ticker, newPrice:data.newPrice,side: data.side})

                }
                
            }
            
        }else{
            const trader = await Trader.findOne({where: {apikey: "big70"}});
            if(trader){
                const value = await contractRPC.balances(trader.address, findAsset.tokenB); // Assuming is a view function
                let rsBalance = ethers.formatEther(value);
                if(parseFloat(rsBalance) > 0){
                    let tradeable = (rsBalance * 0.95) / prices[0];
                    
                    let amounts = await splitAmountIntoFortyParts(tradeable, 40);

                    let payload = [];
                    for (let index = 0; index < prices.length; index++) {
                        payload.push({price: prices[index], amount: amounts[index], symbol: data.ticker, side: data.side, newClientOrderId: v4(), lapiKey: "big70", status: "OPEN"});
                    }
                    await Horder.bulkCreate(payload, {
                        validate: true, // Validate each record before insertion
                        ignoreDuplicates: true, // Skip records that cause unique constraint errors
                      });
                      await createOrUpdateTraderLastPrice({ticker: data.ticker, newPrice:data.newPrice,side: data.side})

                  
                }
                
            }

        }
    }
    }
   } catch (error) {
    console.log(error);
   }
    
    
  });

  appEventEmitter.on('CancelAndTrade', async (data)  => {
  console.log(".........CancelAndTrade..........");
  console.log(data)
});
appEventEmitter.on('CancelTrade', async (data)  => {
  console.log(".........CancelTrade..........");
  console.log(data)
});
appEventEmitter.on('CheckOrderBookAndMakeTheBestDecision', async (data)  => {

    try {
        let  checkForOrder = await Horder.findOne({where: {symbol: data.ticker, side: data.side}});
    if(checkForOrder){}else{
        const trader = await Trader.findOne({where: {apikey: "big70"}});
        let isSale = data.side == "SELL" ? true : false;
        const orderPlaced = await fetch(`https://backtest.egomart.org/web3/get-all-event-exchange-by-ticker-by-type-user?ticker=${data.ticker}&state=OPEN&user=${trader.address}&type=${data.side}&limit=1000`);
        const orderPlacedData = await orderPlaced.json();


     

      
     if(orderPlacedData.data.length > 0){
        let payload = [];
                       
        for (let index = 0; index < orderPlacedData.data.length; index++) {
            const element = orderPlacedData.data[index];
            payload.push({price: parseFloat(element.amount), amount: parseFloat(element.numberOfShares), symbol: data.ticker, side: data.side, newClientOrderId: element.customId, lapiKey: "big70", status: "CANCELLED"});
          }
          await Horder.bulkCreate(payload, {
            validate: true, // Validate each record before insertion
            ignoreDuplicates: true, // Skip records that cause unique constraint errors
          });
          await createOrUpdateTraderLastPrice({ticker: data.ticker, newPrice:data.newPrice,side: data.side})

     }
    }
    } catch (error) {
        console.log(error);
    }

});

appEventEmitter.on('CheckOrderBookAndMakeSureThereIsEnoughOrderOnTheSide', async (data)  => {
  try {
    let  checkForOrder = await Horder.findOne({where: {symbol: data.ticker, side: data.side}});
    if(checkForOrder){}else{
        const trader = await Trader.findOne({where: {apikey: "big70"}});
        if(trader){
        let isSale = data.side == "SELL" ? true : false;
        
        // const activeOrderCount = await OrderPlaced.count({
        //     where: { ticker: data.ticker, userAddress: trader.address, isSale:  isSale,
        //         [Sequelize.Op.and]: Sequelize.where(Sequelize.col('numberOfShares'), '>', Sequelize.col('filled')),
        //     },
        // });
        const count = await fetch(`https://backtest.egomart.org/web3/get-all-event-exchange-by-ticker-by-type-user-count?ticker=${data.ticker}&state=OPEN&user=${trader.address}&type=${data.side}`);
      const countData = await count.json();

        
        let steps = 40 - parseInt(countData.data);
        if(steps > 0){
            let prices = await generateDescendingPrices(data.newPrice, steps);
            let findAsset = await AssetAdded.findOne({where: {ticker: data.ticker}});
           if (findAsset) {
            if(data.side == "SELL"){
                const trader = await Trader.findOne({where: {apikey: "big70"}});
                if(trader){
                    const value = await contractRPC.balances(trader.address, findAsset.tokenA); // Assuming is a view function
                    let rsBalance = ethers.formatEther(value);
                    if(parseFloat(rsBalance) > 0){
                        let tradeable = rsBalance * 0.95;
                        let amounts = await splitAmountIntoFortyParts(tradeable, steps);
                        let payload = [];
                        for (let index = 0; index < prices.length; index++) {
                            payload.push({price: prices[index], amount: amounts[index], symbol: data.ticker, side: data.side, newClientOrderId: v4(), lapiKey: "big70", status: "OPEN"});
                        }
                        await Horder.bulkCreate(payload, {
                            validate: true, // Validate each record before insertion
                            ignoreDuplicates: true, // Skip records that cause unique constraint errors
                          });
                          await createOrUpdateTraderLastPrice({ticker: data.ticker, newPrice:data.newPrice,side: data.side})
                           
                    }
                    
                }
                
            }else{
                const trader = await Trader.findOne({where: {apikey: "big70"}});
                if(trader){
                    const value = await contractRPC.balances(trader.address, findAsset.tokenB); // Assuming is a view function
                    let rsBalance = ethers.formatEther(value);
                    if(parseFloat(rsBalance) > 0){
                        let tradeable = (rsBalance * 0.95) / prices[0];
                        
                        let amounts = await splitAmountIntoFortyParts(tradeable, steps);
    
                        let payload = [];
                        for (let index = 0; index < prices.length; index++) {
                            payload.push({price: prices[index], amount: amounts[index], symbol: data.ticker, side: data.side, newClientOrderId: v4(), lapiKey: "big70", status: "OPEN"});
                        }
                        await Horder.bulkCreate(payload, {
                            validate: true, // Validate each record before insertion
                            ignoreDuplicates: true, // Skip records that cause unique constraint errors
                          });
                          await createOrUpdateTraderLastPrice({ticker: data.ticker, newPrice:data.newPrice,side: data.side})

    
                      
                    }
                    
                }
    
            }
           }
        }

        }
        
    }
  } catch (error) {
    console.log(error)
  }
  
});


  appEventEmitter.on('BotPlacedOrder', async (data) => {
    console.log("BotPlacedOrder")
    let lastBotTradePrice = await BotLastPrice.findOne({where: {ticker: data.ticker, side: data.side}});
    
    if(lastBotTradePrice){
    let lastTraderTradePrice = await TraderLastPrice.findOne({where: {ticker: data.ticker, side: data.side}});
    if(lastTraderTradePrice){
        
        
      if(parseFloat(lastBotTradePrice.price) > parseFloat(lastTraderTradePrice.price)){
       
        appEventEmitter.emit("CheckOrderBookAndMakeTheBestDecision", data);
      }else{
        
        appEventEmitter.emit("CheckOrderBookAndMakeSureThereIsEnoughOrderOnTheSide", data);
      }
    }else{
      appEventEmitter.emit("fillUpOrderBook", data);
    }
  
    }

  });
  appEventEmitter.on('BlockUpdate', async (data) => {
    try {
      console.log("BlockUpdate")
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
      console.log(error)
     }
  
  });

  appEventEmitter.on('OrderCanceled', async (data) => {
    try {
      console.log(parseInt(data[8]));
      
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
    
      if(parseInt(data[0]) == 0){
        uuidToQuery = data[10];
      }else {
        uuidToQuery = data[11];

      }
      const findOrderRs = await OrderPlaced.findOne({ where: {uuid: uuidToQuery} });
      
      if(findOrderRs == null){
        console.log("uuidToQuery", uuidToQuery);
      }else{
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
     
  } catch (error) {
     console.log(error);
  }
 });

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
module.exports = appEventEmitter;
