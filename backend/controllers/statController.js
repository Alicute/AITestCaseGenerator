const Project = require('../models/Project');
const Module = require('../models/Module');
const TestCase = require('../models/TestCase');

/**
 * @desc    获取系统统计数据
 * @route   GET /api/v1/stats
 * @access  Private
 */
exports.getSystemStats = async (req, res) => {
  try {
    // 统计总项目数
    const projectCount = await Project.count();
    
    // 统计总模块数
    const moduleCount = await Module.count();
    
    // 统计总测试用例数
    const testCaseCount = await TestCase.count();
    
    // 获取最近的活动（这里可以根据实际需求定制）
    // 这里简化处理，仅获取最近创建的项目、模块和测试用例
    const recentProjects = await Project.findAll({
      order: [['createdAt', 'DESC']],
      limit: 3,
      attributes: ['id', 'name', 'createdAt']
    });
    
    const recentModules = await Module.findAll({
      order: [['createdAt', 'DESC']],
      limit: 3,
      attributes: ['id', 'name', 'projectId', 'createdAt']
    });
    
    const recentTestCases = await TestCase.findAll({
      order: [['createdAt', 'DESC']],
      limit: 3,
      attributes: ['id', 'title', 'moduleId', 'createdAt']
    });
    
    // 构建活动列表
    const activities = [];
    
    // 添加项目活动
    recentProjects.forEach(project => {
      activities.push({
        date: project.createdAt,
        type: '创建项目',
        description: `创建了项目 "${project.name}"`
      });
    });
    
    // 添加模块活动
    recentModules.forEach(module => {
      activities.push({
        date: module.createdAt,
        type: '添加模块',
        description: `添加了模块 "${module.name}"`
      });
    });
    
    // 添加测试用例活动
    recentTestCases.forEach(testCase => {
      activities.push({
        date: testCase.createdAt,
        type: '创建用例',
        description: `创建了测试用例 "${testCase.title}"`
      });
    });
    
    // 按时间排序
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 只保留前5个活动
    const recentActivities = activities.slice(0, 5).map(activity => {
      return {
        ...activity,
        date: formatDate(activity.date)
      };
    });
    
    // 返回统计数据
    res.json({
      success: true,
      data: {
        stats: {
          projects: projectCount,
          modules: moduleCount,
          testcases: testCaseCount
        },
        recentActivities
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
} 