const { Op, Sequelize } = require("sequelize");
const { default: OrderPlaced } = require("../models/OrderPlaced");
const { formatEther } = require("ethers");
const { default: BotLastPrice } = require("../models/BotLastPrice");
const { default: TraderLastPrice } = require("../models/TraderLastPrice");
const { default: Trader } = require("../models/Trader");


async function generateDescendingPrices(startPrice, steps) {
  const prices = new Set();
    let currentPrice = startPrice;
    while (prices.size < steps) {
        const margin = parseFloat((Math.random() * 0.005).toFixed(5)); // Small decrement
        currentPrice -= margin;
        if (currentPrice < 0) {
            currentPrice = 0;
        }
        prices.add(parseFloat(currentPrice.toFixed(5)));
        if (prices.size < steps && currentPrice === 0) {
            currentPrice = startPrice; // Reset to prevent infinite loop
        }
    }
    return Array.from(prices).sort((a, b) => b - a);
}

async function splitAmountIntoFortyParts(totalAmount, steps) {
  const parts = [];
    let remainingAmount = totalAmount;

    for (let i = 0; i < steps - 1; i++) {
        // Ensure each part is at least a small positive value
        const minPart = 0.01; 
        const maxPart = (remainingAmount - (steps - 1 - i) * minPart) / (steps - i);

        // Generate a random part between minPart and maxPart
        const part = parseFloat((Math.random() * (maxPart - minPart) + minPart).toFixed(2));
        parts.push(part);
        remainingAmount -= part;
    }

    // Add the remaining amount as the last part
    parts.push(parseFloat(remainingAmount.toFixed(2)));

    return parts;
}

async function getOpenTrades({ticker, side}) {
  let getTrade = await Trader.findOne({where: {apikey: "big70"}});
  if(getTrade){
    let isSaleTrade = side == "SELL" ? true : false;
    let hasEntry = await OrderPlaced.findAll({where: {isSale:isSaleTrade,ticker: ticker}});
    if (hasEntry) {
      console.log(hasEntry);
      
    }else{
      //genetrade
    }


  }
  
}
async function createOrUpdateBotLastPrice({ticker, newPrice, side}) {

  try {
    
    let hasEntry = await BotLastPrice.findOne({where: {side:side,ticker: ticker}});
    
    if(hasEntry){
      await BotLastPrice.update({price:newPrice}, {where: {side:side,ticker: ticker}});
     
    }else{
      await BotLastPrice.create({side:side, price: newPrice, ticker: ticker});
    }
  } catch (error) {
    console.log(error);
  }
}

async function createOrUpdateTraderLastPrice({ticker, newPrice, side}) {

  try {
    let hasEntry = TraderLastPrice.findOne({where: {side:side,ticker: ticker}})
    if(hasEntry){
      await TraderLastPrice.update({price:newPrice}, {where: {side:side,ticker: ticker}});
     
    }else{
      await TraderLastPrice.create({side:side, price: newPrice, ticker: ticker});
    }
  } catch (error) {
    console.log(error);
  }
}
async function generatePayload({ ticker, limit, value }) {
  // Initialize payload
  const payload = {
    e: "depthUpdate",
    s: "",
    lastUpdateId: 0,
    E: 0,
    U: 0,
    u: 0,
    b: [],
    a: [],
    bids: [],
    asks: []
  };

 

  if (value.length > 0) {
    payload.U = 1; // Set U to the first order ID
    payload.s = ticker;
    value.forEach((order, index) => {
      payload.lastUpdateId = value.length;
      payload.u = index+1;
      let isSale = order[0];
      let price = formatEther(order[2]);
      let numberOfShares = formatEther(order[3]);
      let filled = formatEther(order[4]);


      

      

      const entry = [
        parseFloat(price).toString(),
        parseFloat(numberOfShares).toString(),
      ];

      if (isSale) {
        if (parseFloat(numberOfShares) > parseFloat(filled)) {
          payload.asks.push(entry);
          payload.a.push(entry);
        }
       
      } else {
        if (parseFloat(numberOfShares) >parseFloat(filled)) {
          payload.bids.push(entry);
         payload.b.push(entry);
        }
        
      }
    });
  }

  return payload;
}

module.exports = { generatePayload, createOrUpdateTraderLastPrice, createOrUpdateBotLastPrice, splitAmountIntoFortyParts, generateDescendingPrices };
