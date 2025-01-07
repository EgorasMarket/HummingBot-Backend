import Sequelize, { Model } from "sequelize";

class OrderCanceled extends Model {
  static init(sequelize) {
    super.init(
      {
        isSale: Sequelize.BOOLEAN,
        userAddress: Sequelize.STRING,
        value: Sequelize.DECIMAL,
        numberOfShares: Sequelize.DECIMAL,
        orderId: Sequelize.NUMBER,
        ticker: Sequelize.STRING,
        uniqueOrderID: Sequelize.NUMBER,
        time: Sequelize.DATE,
      },
      {
        sequelize,
        timestamps: true,
      }
    );

    return this;
  }


}



export default OrderCanceled;
