import Sequelize, { Model } from "sequelize";
class BotLastPrice extends Model {
  static init(sequelize) {
    super.init(
      {
        price: Sequelize.INTEGER,
        side: Sequelize.STRING,
        ticker: Sequelize.STRING,
       
      },
      {
        tableName: "BotLastPrice",
        sequelize,
        timestamps: true,
      }
    );

    return this;
  }
}




export default BotLastPrice;