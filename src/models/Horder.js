import Sequelize, { Model } from "sequelize";
class Horder extends Model {
  static init(sequelize) {
    super.init(
      {
        price: Sequelize.DECIMAL,
        amount: Sequelize.DECIMAL,
        symbol: Sequelize.STRING,
        side: Sequelize.STRING,
        newClientOrderId: Sequelize.STRING,
        lapiKey: Sequelize.STRING,
        status: Sequelize.STRING
       
      },
      {
        tableName: "Horder",
        sequelize,
        timestamps: true,
      }
    );

    return this;
  }
}




export default Horder;