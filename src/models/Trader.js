import Sequelize, { Model } from "sequelize";
class Trader extends Model {
  static init(sequelize) {
    super.init(
      {
        address: Sequelize.STRING,
        key: Sequelize.STRING,
        apikey: Sequelize.STRING,
       
      },
      {
        tableName: "Trader",
        sequelize,
        timestamps: true,
      }
    );

    return this;
  }

}




export default Trader;