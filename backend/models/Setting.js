const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Setting = sequelize.define('Setting', {
    key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        comment: '配置键名'
    },
    value: {
        type: DataTypes.TEXT, // 使用TEXT以支持长内容（如API Key或JSON）
        allowNull: true,
        comment: '配置值'
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'general',
        comment: '分类: ai, zentao, general'
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'settings' // Explicit table name
});

module.exports = Setting;
