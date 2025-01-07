import Sequelize, { Model } from "sequelize";
class Block extends Model {
  static init(sequelize) {
    super.init(
      {
        block_number: Sequelize.INTEGER,
        event_name: Sequelize.STRING,
       
      },
      {
        tableName: "Block",
        sequelize,
        timestamps: true,
      }
    );

    return this;
  }

}




export default Block;