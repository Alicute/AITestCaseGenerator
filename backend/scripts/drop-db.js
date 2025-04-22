const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function dropDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
        console.log(`数据库 ${process.env.DB_NAME} 已删除`);
    } catch (error) {
        console.error('删除数据库失败:', error);
    } finally {
        await connection.end();
    }
}

dropDatabase(); 