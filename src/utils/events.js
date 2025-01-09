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
        const orderPlaced = await OrderPlaced.findAll({
            where: { ticker: data.ticker, userAddress: trader.address, isSale:  isSale
            }
        });
      
     if(orderPlaced.length > 0){
        let payload = [];
                       
        for (let index = 0; index < orderPlaced.length; index++) {
            const element = orderPlaced[index];
            payload.push({price: element.value, amount: element.numberOfShares, symbol: data.ticker, side: data.side, newClientOrderId: element.uuid, lapiKey: "big70", status: "CANCELLED"});
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
        
        const activeOrderCount = await OrderPlaced.count({
            where: { ticker: data.ticker, userAddress: trader.address, isSale:  isSale,
                [Sequelize.Op.and]: Sequelize.where(Sequelize.col('numberOfShares'), '>', Sequelize.col('filled')),
            },
        });
        let steps = 40 - activeOrderCount;
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
module.exports = appEventEmitter;
