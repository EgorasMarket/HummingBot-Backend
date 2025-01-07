import Sequelize, { Model } from "sequelize";

class Deposit extends Model {
  static init(sequelize) {
    super.init(
      {
        token: Sequelize.STRING,
        user: Sequelize.STRING,
        amount: Sequelize.DECIMAL

      
      },
      {
        sequelize,
        timestamps: true,
      }
    );

    return this;
  }

 
}




export default Deposit;
