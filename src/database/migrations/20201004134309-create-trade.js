"use strict";

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable("Trade", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      typeOfTrade: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
    
      seller: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      buyer: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      ticker: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      createdAtOnChain: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date(),
      },
      value: {
        allowNull: false,
        type: Sequelize.DECIMAL(65,30),
      },
      numberOfShares: {
        allowNull: false,
        type: Sequelize.DECIMAL(65,30),
      },
      orderId: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      uniqueOrderID: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      isMarketOrder: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
       
      sellerUuid: {
        allowNull: false,
        type: Sequelize.STRING,
      },

      buyerUuid: {
        allowNull: false,
        type: Sequelize.STRING,
      },
     
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date(),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date(),
      },
    }),

  down: (queryInterface) => queryInterface.dropTable("Trade"),
};

       
     

        
        

      