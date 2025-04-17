const { User } = require('../models');
const generateToken = require('../utils/generateToken');
const { Op } = require('sequelize');

/**
 * @desc    用户注册
 * @route   POST /api/v1/users/register
 * @access  Public
 */
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 检查用户是否已存在
    const userExists = await User.findOne({ 
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });
    
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: '用户已存在'
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user'
    });

    if (user) {
      // 生成token
      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          active: user.active,
          createdAt: user.createdAt,
          token
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: '无效的用户数据'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    用户登录
 * @route   POST /api/v1/users/login
 * @access  Public
 */
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ 
      where: { username } 
    });

    // 检查用户存在且密码匹配
    if (user && (await user.matchPassword(password))) {
      // 更新最后登录时间
      user.lastLogin = Date.now();
      await user.save();

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          active: user.active,
          token: generateToken(user.id)
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取当前用户信息
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
exports.getUserProfile = async (req, res) => {
  try {
    // 用户信息已通过auth中间件存储在req.user中
    res.json({
      success: true,
      data: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        active: req.user.active,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取所有用户
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    通过ID获取用户
 * @route   GET /api/v1/users/:id
 * @access  Private/Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (user) {
      res.json({
        success: true,
        data: user
      });
    } else {
      res.status(404).json({
        success: false,
        message: '未找到用户'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    更新用户
 * @route   PUT /api/v1/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const { username, email, role, active } = req.body;
    
    const user = await User.findByPk(req.params.id);
    
    if (user) {
      // 检查是否试图更新用户名，且新用户名已存在
      if (username && username !== user.username) {
        const existingUser = await User.findOne({ 
          where: { username } 
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: '用户名已被使用'
          });
        }
        user.username = username;
      }
      
      // 检查是否试图更新邮箱，且新邮箱已存在
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ 
          where: { email } 
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: '邮箱已被使用'
          });
        }
        user.email = email;
      }
      
      if (role) user.role = role;
      if (active !== undefined) user.active = active;
      
      const updatedUser = await user.save();
      
      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          active: updatedUser.active
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: '未找到用户'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    删除用户
 * @route   DELETE /api/v1/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (user) {
      // 不允许删除自己
      if (user.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: '不能删除当前登录的用户'
        });
      }
      
      await user.destroy();
      
      res.json({
        success: true,
        message: '用户已删除'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '未找到用户'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    创建初始管理员账户
 * @route   POST /api/v1/users/create-admin
 * @access  Public
 */
exports.createAdminUser = async (req, res) => {
  try {
    // 检查是否已存在管理员账户
    const existingAdmin = await User.findOne({
      where: {
        role: 'admin'
      }
    });
    
    if (existingAdmin) {
      return res.json({
        success: false,
        message: '已存在管理员账户，无需创建',
        data: {
          username: existingAdmin.username
        }
      });
    }
    
    // 创建管理员账户
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      active: true
    });
    
    // 生成token
    const token = generateToken(admin.id);
    
    res.status(201).json({
      success: true,
      message: '初始管理员账户创建成功',
      data: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建管理员账户失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};