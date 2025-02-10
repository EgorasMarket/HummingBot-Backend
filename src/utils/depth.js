const { Op, Sequelize } = require("sequelize");
const { default: OrderPlaced } = require("../models/OrderPlaced");
const { formatEther } = require("ethers");
const { default: BotLastPrice } = require("../models/BotLastPrice");
const { default: TraderLastPrice } = require("../models/TraderLastPrice");
const { default: Trader } = require("../models/Trader");
const { default: Block } = require("../models/Block");

async function isOrderOlderThan20Seconds(orderTimestamp, seconds) {
  const orderTime = new Date(orderTimestamp);
  const now = new Date();
  const differenceInSeconds = (now - orderTime) / 1000;
  return differenceInSeconds > seconds;
}
async function getRandomAction() {
  const actions = ["BUY", "SELL"];
  const randomIndex = Math.floor(Math.random() * actions.length);
  return actions[randomIndex];
}
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
let arrayOfPercentages = [
  0.009, 0.0089, 0.0088, 0.0087, 0.0086, 0.0085, 0.0084, 0.0083, 0.0082, 0.0081,
  0.008, 0.0079, 0.0078, 0.0077, 0.0076, 0.0075, 0.0074, 0.0073, 0.0072, 0.0071,
  0.007, 0.0069, 0.0068, 0.0067, 0.0066, 0.0065, 0.0064, 0.0063, 0.0062, 0.0061,
  0.006, 0.0059, 0.0058, 0.0057, 0.0056, 0.0055, 0.0054, 0.0053, 0.0052, 0.0051,
  0.005, 0.0049, 0.0048, 0.0047, 0.0046, 0.0045, 0.0044, 0.0043, 0.0042, 0.0041,
  0.004, 0.0039, 0.0038, 0.0037, 0.0036, 0.0035, 0.0034, 0.0033, 0.0032, 0.0031,
  0.003, 0.0029, 0.0028, 0.0027, 0.0026, 0.0025, 0.0024, 0.0023, 0.0022, 0.0021,
  0.002, 0.0019, 0.0018, 0.0017, 0.0016, 0.0015, 0.0014, 0.0013, 0.0012, 0.0011,
  0.001, 0.0009, 0.0008, 0.0007, 0.0006, 0.0005, 0.0004, 0.0003, 0.0002, 0.0001
];
async function generatePrice(lowestSellPrice, biggestBuyPrice) {
  const maxVariation = biggestBuyPrice * arrayOfPercentages[Math.floor(Math.random() * 101)]; // 0.5% of lowest sell order price
  const randomOffset = Math.random() * maxVariation; // Random value within range
  return (biggestBuyPrice - randomOffset).toFixed(2);
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

module.exports = {getRandomAmount,sleep, generatePayload, createOrUpdateTraderLastPrice, createOrUpdateBotLastPrice, splitAmountIntoFortyParts, generateDescendingPrices, registerBlock, getMiddleNumber, getRandomAction, generatePrice, isOrderOlderThan20Seconds };
