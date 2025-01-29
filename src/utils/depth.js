const { Op, Sequelize } = require("sequelize");
const { default: OrderPlaced } = require("../models/OrderPlaced");
const { formatEther } = require("ethers");
const { default: BotLastPrice } = require("../models/BotLastPrice");
const { default: TraderLastPrice } = require("../models/TraderLastPrice");
const { default: Trader } = require("../models/Trader");
const { default: Block } = require("../models/Block");

async function getRandomAction() {
  const actions = ["BUY", "SELL"];
  const randomIndex = Math.floor(Math.random() * actions.length);
  return actions[randomIndex];
}
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function generatePrice(lowestSellPrice, biggestBuyPrice) {
  return Math.random() * (lowestSellPrice - biggestBuyPrice) + biggestBuyPrice;
}
async function getRandomAmount(balance, percentage = 15) {
  if (balance <= 0 || percentage <= 0) {
      throw new Error("Balance and percentage must be greater than 0.");
  }

  const targetAmount = (percentage / 100) * balance; // Calculate 15% of the balance
  const variance = targetAmount * 0.2; // Allow a ±20% variance around the target
  const min = Math.max(0, targetAmount - variance); // Ensure the minimum isn't negative
  const max = targetAmount + variance;

  return Math.random() * (max - min) + min;
}

async function getMiddleNumber(numbers) {
 try {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error("Input must be a non-empty array of numbers.");
  }

  // Filter out non-numeric values
  const numericValues = numbers.filter((num) => typeof num === "number" && !isNaN(num));

  if (numericValues.length === 0) {
    throw new Error("Array must contain at least one valid number.");
  }

  // Sort the array in ascending order
  numericValues.sort((a, b) => a - b);

  const middleIndex = Math.floor(numericValues.length / 2);

  // Return the middle number for odd length, or the average for even length
  if (numericValues.length % 2 !== 0) {
    return numericValues[middleIndex];
  } else {
    return (numericValues[middleIndex - 1] + numericValues[middleIndex]) / 2;
  }
 } catch (error) {
  console.log(error);
 }
}
async function registerBlock(data) {
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
  
}
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
      const minPart = 1.5; 
      let maxPart = (remainingAmount - (steps - 1 - i) * minPart) / (steps - i);

      // Ensure maxPart is never lower than minPart
      maxPart = Math.max(minPart, maxPart);

      // Generate a random part between minPart and maxPart
      const part = parseFloat((Math.random() * (maxPart - minPart) + minPart).toFixed(2));

      parts.push(part);
      remainingAmount -= part;

      // Prevent the remaining amount from going negative
      if (remainingAmount < minPart * (steps - 1 - i)) {
          remainingAmount = minPart * (steps - 1 - i);
      }
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
      let isSale = order.isSale;
      let price = parseFloat(order.value);
      let numberOfShares = parseFloat(order.numberOfShares);
      let filled = parseFloat(order.filled);


      

      

      const entry = [
        parseFloat(price).toString(),
        parseFloat(numberOfShares).toString(),
      ];

      if (isSale == true) {
        if (parseFloat(numberOfShares) > parseFloat(filled)) {
          payload.asks.push(entry);
          payload.a.push(entry);
        }
       
      } else {
        if (parseFloat(numberOfShares) > parseFloat(filled)) {
          payload.bids.push(entry);
         payload.b.push(entry);
        }
        
      }
    });
  }

  return payload;
}

module.exports = {getRandomAmount,sleep, generatePayload, createOrUpdateTraderLastPrice, createOrUpdateBotLastPrice, splitAmountIntoFortyParts, generateDescendingPrices, registerBlock, getMiddleNumber, getRandomAction, generatePrice };
