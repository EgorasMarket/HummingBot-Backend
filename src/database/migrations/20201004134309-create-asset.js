"use strict";
module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable("AssetAdded", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      ticker: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      tokenA: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      tokenB: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      initialPrice: {
        allowNull: false,
        type: Sequelize.DECIMAL(65,30),
      },
      tokenAName: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      tokenBName: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      creator: {
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
  down: (queryInterface) => queryInterface.dropTable("AssetAdded"),
};