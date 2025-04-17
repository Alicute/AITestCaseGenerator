const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证JWT令牌
exports.protect = async (req, res, next) => {
  let token;

  // 检查请求头中的Authorization字段
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 也可以从cookie中获取token
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // 如果没有找到token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未授权，请先登录'
    });
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 获取用户信息
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未找到此用户'
      });
    }

    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: '此账户已被禁用'
      });
    }

    // 将用户信息添加到请求对象中
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '无效的授权令牌'
    });
  }
};

// 验证用户角色
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未授权，请先登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法访问此资源'
      });
    }

    next();
  };
};