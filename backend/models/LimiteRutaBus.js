const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const LimiteRutaBus = sequelize.define("LimiteRutaBus", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  busId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "buses",
      key: "id"
    }
  },
  rutaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Ruta",
      key: "id"
    }
  },
  limiteDiario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 50
    },
    comment: 'Número máximo de veces que este bus puede hacer esta ruta por día'
  }
}, {
  timestamps: true,
  tableName: "limites_ruta_bus",
  indexes: [
    {
      unique: true,
      fields: ['busId', 'rutaId'],
      name: 'unique_bus_ruta'
    }
  ]
});

module.exports = LimiteRutaBus;
