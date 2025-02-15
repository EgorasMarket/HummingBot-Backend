class SnakePriceManager {
    constructor() {
        if (!SnakePriceManager.instance) {
            this.priceMap = new Map(); // Stores ticker => price array
            this.indexMap = new Map(); // Stores ticker => current index
            SnakePriceManager.instance = this; // Store instance
        }
        return SnakePriceManager.instance; // Always return the same instance
    }

    /**
     * Handles adding a ticker, generating prices, and retrieving the next price.
     * If prices are exhausted, a new set is generated automatically.
     * @param {string} ticker - The trading pair (e.g., "BTC/USDT").
     * @param {number} lowestSell - The lowest sell order price.
     * @param {number} highestBuy - The highest buy order price.
     * @param {number} steps - Number of price points to generate (default 50).
     * @returns {number} - The next price in the sequence.
     */
    handleTicker(ticker, lowestSell, highestBuy, steps = 50) {
        // If ticker doesn't exist, generate prices and add it
        if (!this.priceMap.has(ticker)) {
            console.log(`✅ Adding new ticker: ${ticker}`);
            this.regeneratePrices(ticker, lowestSell, highestBuy, steps);
        }

        // Get the next price
        return this.getNextPrice(ticker, lowestSell, highestBuy, steps);
    }

    // Regenerate prices for a given ticker
    regeneratePrices(ticker, lowestSell, highestBuy, steps) {
        const prices = this.generateSnakePrices(lowestSell, highestBuy, steps);
        this.priceMap.set(ticker, prices);
        this.indexMap.set(ticker, 0);
        console.log(`🔄 Prices regenerated for ${ticker}`);
    }

    // Generate snake-like prices using sine wave pattern
    generateSnakePrices(lowestSell, highestBuy, steps) {
        const prices = [];
        const amplitude = (highestBuy - lowestSell) / 2;
        const midPoint = lowestSell + amplitude;

        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * Math.PI * 2; // Full sine wave cycle
            const price = midPoint + Math.sin(angle) * amplitude;
            prices.push(parseFloat(price.toFixed(6))); // Keeping precision
        }

        return prices;
    }

    // Get the next price for a given ticker
    getNextPrice(ticker, lowestSell, highestBuy, steps) {
        if (!this.priceMap.has(ticker)) {
            throw new Error(`❌ Ticker ${ticker} not found.`);
        }

        const prices = this.priceMap.get(ticker);
        let index = this.indexMap.get(ticker);

        // If all prices have been used, regenerate new prices
        if (index >= prices.length) {
            this.regeneratePrices(ticker, lowestSell, highestBuy, steps);
            index = 0;
        }

        const price = prices[index];
        this.indexMap.set(ticker, index + 1); // Move to the next index

        return price;
    }
}

// Export a singleton instance
const snakePriceManager = new SnakePriceManager();
Object.freeze(snakePriceManager);

module.exports = snakePriceManager;
