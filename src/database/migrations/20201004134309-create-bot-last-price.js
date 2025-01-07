"use strict";

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable("BotLastPrice", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      price: {
        allowNull: false,
        type: Sequelize.DECIMAL(65,30),
      },
      side: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      ticker: {
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

  down: (queryInterface) => queryInterface.dropTable("BotLastPrice"),
};
