const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

class DatabaseInitializer {
    constructor(config) {
        this.config = config;
        this.connection = null;
    }

    async connect() {
        try {
            this.connection = await mysql.createConnection({
                host: this.config.host,
                user: this.config.user,
                password: this.config.password,
                multipleStatements: true
            });
            console.log('数据库连接成功');
        } catch (error) {
            console.error('数据库连接失败:', error);
            throw error;
        }
    }

    async checkDatabase() {
        try {
            // 检查数据库是否存在
            const [rows] = await this.connection.query(
                "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
                [this.config.database]
            );

            if (rows.length === 0) {
                console.log('数据库不存在，开始创建...');
                await this.initializeDatabase();
            } else {
                console.log('数据库已存在，检查表结构...');
                await this.checkTables();
            }
        } catch (error) {
            console.error('数据库检查失败:', error);
            throw error;
        }
    }

    async initializeDatabase() {
        try {
            // 读取初始化SQL文件
            const initSql = await fs.readFile(
                path.join(__dirname, './init.sql'),
                'utf8'
            );

            // 执行初始化SQL
            await this.connection.query(initSql);
            console.log('数据库初始化成功');

            // 创建默认管理员账户
            await this.createDefaultAdmin();
        } catch (error) {
            console.error('数据库初始化失败:', error);
            throw error;
        }
    }

    async checkTables() {
        try {
            // 检查必要的表是否存在
            const requiredTables = ['users', 'projects', 'modules', 'functions', 'test_cases'];
            const [tables] = await this.connection.query(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?",
                [this.config.database]
            );

            const existingTables = tables.map(t => t.TABLE_NAME.toLowerCase());
            const missingTables = requiredTables.filter(t => !existingTables.includes(t));

            if (missingTables.length > 0) {
                console.error('缺少必要的表:', missingTables);
                throw new Error('数据库结构不完整，请重新初始化数据库');
            }

            // 检查表结构
            await this.checkTableStructure();
        } catch (error) {
            console.error('表结构检查失败:', error);
            throw error;
        }
    }

    async checkTableStructure() {
        try {
            // 检查功能点表结构
            const [columns] = await this.connection.query(
                `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'functions'`,
                [this.config.database]
            );

            const requiredColumns = {
                'id': { type: 'int', nullable: 'NO', key: 'PRI' },
                'name': { type: 'varchar', nullable: 'NO' },
                'description': { type: 'text', nullable: 'YES' },
                'priority': { type: 'enum', nullable: 'YES' },
                'moduleId': { type: 'int', nullable: 'NO', key: 'MUL' },
                'createdAt': { type: 'datetime', nullable: 'NO' },
                'updatedAt': { type: 'datetime', nullable: 'NO' }
            };

            const existingColumns = columns.reduce((acc, col) => {
                acc[col.COLUMN_NAME] = {
                    type: col.DATA_TYPE.toLowerCase(),
                    nullable: col.IS_NULLABLE,
                    key: col.COLUMN_KEY
                };
                return acc;
            }, {});

            // 检查是否缺少必要的列
            const missingColumns = Object.entries(requiredColumns).filter(
                ([name, props]) => !existingColumns[name] ||
                existingColumns[name].type !== props.type ||
                existingColumns[name].nullable !== props.nullable ||
                existingColumns[name].key !== props.key
            );

            if (missingColumns.length > 0) {
                console.error('功能点表缺少必要的列或列定义不正确:', missingColumns);
                throw new Error('数据库表结构不完整，请重新初始化数据库');
            }

            // 检查外键约束
            const [foreignKeys] = await this.connection.query(
                `SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'functions'
                 AND REFERENCED_TABLE_NAME IS NOT NULL`,
                [this.config.database]
            );

            const requiredForeignKeys = [
                { column: 'moduleId', referencedTable: 'modules', referencedColumn: 'id' }
            ];

            const existingForeignKeys = foreignKeys.map(fk => ({
                column: fk.COLUMN_NAME,
                referencedTable: fk.REFERENCED_TABLE_NAME,
                referencedColumn: fk.REFERENCED_COLUMN_NAME
            }));

            const missingForeignKeys = requiredForeignKeys.filter(required =>
                !existingForeignKeys.some(existing =>
                    existing.column === required.column &&
                    existing.referencedTable === required.referencedTable &&
                    existing.referencedColumn === required.referencedColumn
                )
            );

            if (missingForeignKeys.length > 0) {
                console.error('功能点表缺少必要的外键约束:', missingForeignKeys);
                throw new Error('数据库表结构不完整，请重新初始化数据库');
            }

            console.log('功能点表结构检查通过');
        } catch (error) {
            console.error('表结构检查失败:', error);
            throw error;
        }
    }

    async createDefaultAdmin() {
        try {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await this.connection.query(
                `INSERT INTO users (username, password, email, role)
                 SELECT 'admin', ?, 'admin@example.com', 'admin'
                 WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')`,
                [hashedPassword]
            );
            console.log('默认管理员账户创建成功');
            console.log('用户名: admin');
            console.log('密码: admin123');
        } catch (error) {
            console.error('创建默认管理员账户失败:', error);
            throw error;
        }
    }

    async close() {
        if (this.connection) {
            await this.connection.end();
            console.log('数据库连接已关闭');
        }
    }
}

module.exports = DatabaseInitializer; 