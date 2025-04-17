const { User } = require('../models');
const { sequelize } = require('../config/database');

/**
 * 创建初始管理员账户
 * 用户名: admin
 * 密码: admin123
 * 邮箱: admin@example.com
 * 角色: admin
 */
async function createAdmin() {
  try {
    console.log('开始创建初始管理员账户...');
    
    // 检查是否已存在管理员账户
    const existingAdmin = await User.findOne({
      where: {
        role: 'admin'
      }
    });
    
    if (existingAdmin) {
      console.log('已存在管理员账户，无需创建');
      return;
    }
    
    // 创建管理员账户
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      active: true
    });
    
    console.log('初始管理员账户创建成功:');
    console.log(`用户名: ${admin.username}`);
    console.log(`邮箱: ${admin.email}`);
    console.log(`密码: admin123`);
    
  } catch (error) {
    console.error('创建管理员账户失败:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 执行创建管理员账户
createAdmin(); 