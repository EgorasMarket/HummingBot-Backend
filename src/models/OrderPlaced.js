import Sequelize, { Model } from "sequelize";
// yarn sequelize db:migrate  --name User --attributes firstName:string,lastName:string,email:string
class OrderPlaced extends Model {
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
        uuid: Sequelize.STRING,
        filled: Sequelize.DECIMAL
      },
      {
        tableName: "OrderPlaced",
        sequelize,
        timestamps: true,
      }
    );

    return this;
  }

}




export default OrderPlaced;