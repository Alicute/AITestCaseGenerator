-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS ai_testcase_generator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ai_testcase_generator;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    createdBy INT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- 模块表
CREATE TABLE IF NOT EXISTS modules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    projectId INT NOT NULL,
    parentId INT,
    createdBy INT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id),
    FOREIGN KEY (parentId) REFERENCES modules(id),
    FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- 功能点表
CREATE TABLE IF NOT EXISTS functions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    moduleId INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (moduleId) REFERENCES modules(id)
);

-- 测试用例表
CREATE TABLE IF NOT EXISTS test_cases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    moduleId INT NOT NULL,
    projectId INT NOT NULL,
    precondition TEXT,
    steps TEXT NOT NULL,
    expectedResult TEXT NOT NULL,
    priority ENUM('P0', 'P1', 'P2', 'P3', 'P4') NOT NULL DEFAULT 'P1',
    status ENUM('waiting', 'running', 'passed', 'failed') NOT NULL DEFAULT 'waiting',
    type ENUM('functional', 'performance', 'security', 'ui', 'other') NOT NULL DEFAULT 'functional',
    maintainer VARCHAR(100),
    testType VARCHAR(50),
    estimatedHours DECIMAL(10,2),
    remainingHours DECIMAL(10,2),
    relatedItems TEXT,
    followers TEXT,
    notes TEXT,
    createdBy INT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (moduleId) REFERENCES modules(id),
    FOREIGN KEY (projectId) REFERENCES projects(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    UNIQUE KEY unique_test_case (title, moduleId)  -- 添加唯一约束，防止重复
);

-- 插入默认管理员用户（密码：admin123）
-- 注意：这个密码哈希值会在 init.js 中动态生成 