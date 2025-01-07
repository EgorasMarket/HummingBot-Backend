import Sequelize, { Model } from "sequelize";
class AssetAdded extends Model {
  static init(sequelize) {
    super.init(
      {
        ticker: Sequelize.STRING,
        tokenA: Sequelize.STRING,
        tokenB: Sequelize.STRING,
        initialPrice: Sequelize.DECIMAL,
        tokenAName: Sequelize.STRING,
        tokenBName: Sequelize.STRING,
        creator: Sequelize.STRING
      
      },
      {
        tableName: "AssetAdded",
        sequelize,
        timestamps: true,
      }
    );

    return this;
  }

}




export default AssetAdded;
