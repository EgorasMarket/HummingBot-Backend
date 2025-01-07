import Sequelize, { Model } from "sequelize";
class TraderLastPrice extends Model {
  static init(sequelize) {
    super.init(
      {
        price: Sequelize.INTEGER,
        side: Sequelize.STRING,
        ticker: Sequelize.STRING,
       
      },
      {
        tableName: "TraderLastPrice",
        sequelize,
        timestamps: true,
      }
    );

    return this;
  }
}




export default TraderLastPrice;