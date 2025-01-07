import Sequelize, { Model } from "sequelize";

class Trade extends Model {
  static init(sequelize) {
    super.init(
      {
        typeOfTrade: Sequelize.NUMBER,
        seller: Sequelize.STRING,
        buyer: Sequelize.STRING,
        ticker: Sequelize.STRING,
        createdAtOnChain: Sequelize.DATE,
        value: Sequelize.DECIMAL,
        numberOfShares: Sequelize.DECIMAL,
        orderId: Sequelize.NUMBER,
        uniqueOrderID: Sequelize.NUMBER,
        isMarketOrder: Sequelize.BOOLEAN,
        sellerUuid: Sequelize.STRING,
        buyerUuid: Sequelize.STRING,
        
      
      },
      {
        tableName: "Trade",
        sequelize,
        timestamps: true,
      }
    );

    return this;
  }

 
}


export default Trade;