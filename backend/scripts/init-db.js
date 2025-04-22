const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDatabase() {
    let connection;
    
    try {
        // 首先创建一个没有指定数据库的连接
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        // 创建数据库（如果不存在）
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`数据库 ${process.env.DB_NAME} 创建成功或已存在`);

        // 使用新创建的数据库
        await connection.query(`USE ${process.env.DB_NAME}`);

        // 创建用户表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                role ENUM('user', 'editor', 'admin') NOT NULL DEFAULT 'user',
                active BOOLEAN DEFAULT true,
                lastLogin DATETIME,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('用户表创建成功');

        // 创建项目表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Projects (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                templateId INT,
                moduleCount INT DEFAULT 0,
                testCaseCount INT DEFAULT 0,
                creatorId INT,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (creatorId) REFERENCES Users(id)
            )
        `);
        console.log('项目表创建成功');

        // 创建模块表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Modules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                path VARCHAR(255),
                level INT DEFAULT 0,
                functionCount INT DEFAULT 0,
                testCaseCount INT DEFAULT 0,
                projectId INT NOT NULL,
                parentId INT,
                createdById INT,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (projectId) REFERENCES Projects(id),
                FOREIGN KEY (parentId) REFERENCES Modules(id),
                FOREIGN KEY (createdById) REFERENCES Users(id)
            )
        `);
        console.log('模块表创建成功');

        // 创建功能点表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS functions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
                moduleId INT NOT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (moduleId) REFERENCES modules(id)
            )
        `);
        console.log('功能点表创建成功');

        // 创建测试用例表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS test_cases (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(200) NOT NULL,
                moduleId INT NOT NULL,
                precondition TEXT,
                steps TEXT NOT NULL,
                expectedResult TEXT NOT NULL,
                priority ENUM('P0', 'P1', 'P2', 'P3', 'P4') NOT NULL DEFAULT 'P1',
                status ENUM('waiting', 'running', 'passed', 'failed') NOT NULL DEFAULT 'waiting',
                type ENUM('functional', 'performance', 'security', 'ui', 'other') NOT NULL DEFAULT 'functional',
                createdBy INT,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (moduleId) REFERENCES modules(id),
                FOREIGN KEY (createdBy) REFERENCES users(id)
            )
        `);
        console.log('测试用例表创建成功');

        // 创建默认管理员账户
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.query(
            `INSERT INTO Users (username, password, email, role, active)
             SELECT 'admin', ?, 'admin@example.com', 'admin', true
             WHERE NOT EXISTS (SELECT 1 FROM Users WHERE username = 'admin')`,
            [hashedPassword]
        );
        console.log('默认管理员账户创建成功');
        console.log('用户名: admin');
        console.log('密码: admin123');

    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 执行初始化
initDatabase()
    .then(() => {
        console.log('数据库初始化完成');
        process.exit(0);
    })
    .catch(error => {
        console.error('初始化过程中出现错误:', error);
        process.exit(1);
    }); 