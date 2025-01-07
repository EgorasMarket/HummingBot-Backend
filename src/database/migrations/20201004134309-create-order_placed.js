"use strict";

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable("OrderPlaced", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      isSale: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      userAddress: {
        allowNull: false,
        type: Sequelize.STRING,
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
      ticker: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      uniqueOrderID: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      time: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      uuid: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      filled: {
        allowNull: false,
        type: Sequelize.DECIMAL(65,30),
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

  down: (queryInterface) => queryInterface.dropTable("OrderPlaced"),
};