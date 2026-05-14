const Project = require('../models/Project');
const Module = require('../models/Module');
const TestCase = require('../models/TestCase');

const populateProjectStats = async (project) => {
  const [moduleCount, testCaseCount] = await Promise.all([
    Module.count({ where: { projectId: project.id } }),
    TestCase.count({ where: { projectId: project.id } })
  ]);

  project.setDataValue('moduleCount', moduleCount);
  project.setDataValue('testCaseCount', testCaseCount);
  return project;
};

const canReadProject = async (project, user) => {
  if (!project || !user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  if (project.creatorId == null) {
    return true;
  }

  if (project.creatorId === user.id) {
    return true;
  }

  return project.hasMembers ? project.hasMembers(user.id) : false;
};

const canManageProject = (project, user) => {
  if (!project || !user) {
    return false;
  }

  if (project.creatorId == null) {
    return true;
  }

  return user.role === 'admin' || project.creatorId === user.id;
};

/**
 * @desc    获取所有项目
 * @route   GET /api/v1/projects
 * @access  Private
 */
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();

    const visibleProjects = [];
    for (const project of projects) {
      if (await canReadProject(project, req.user)) {
        await populateProjectStats(project);
        visibleProjects.push(project);
      }
    }
    
    // 即使没有数据也返回空数组
    res.json({
      success: true,
      count: visibleProjects.length,
      data: visibleProjects
    });
  } catch (error) {
    console.error('获取项目列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取单个项目
 * @route   GET /api/v1/projects/:id
 * @access  Private
 */
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }

    if (!(await canReadProject(project, req.user))) {
      return res.status(403).json({
        success: false,
        message: '无权访问此项目'
      });
    }

    await populateProjectStats(project);
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('获取项目详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    创建项目
 * @route   POST /api/v1/projects
 * @access  Private
 */
exports.createProject = async (req, res) => {
  try {
    const project = await Project.create({
      name: req.body.name,
      description: req.body.description,
      templateId: req.body.templateId || null,
      creatorId: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('创建项目错误:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    更新项目
 * @route   PUT /api/v1/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }

    if (!canManageProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: '无权修改此项目'
      });
    }
    
    await project.update({
      name: req.body.name,
      description: req.body.description,
      templateId: req.body.templateId ?? project.templateId
    });
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('更新项目错误:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    删除项目
 * @route   DELETE /api/v1/projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }

    if (!canManageProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: '无权删除此项目'
      });
    }
    
    // 1. 先删除项目关联的所有测试用例
    await TestCase.destroy({
      where: { projectId: req.params.id }
    });
    
    // 2. 获取项目下的所有模块ID
    const modules = await Module.findAll({
      where: { projectId: req.params.id }
    });
    const moduleIds = modules.map(module => module.id);
    
    // 3. 删除这些模块下的所有功能点
    const Function = require('../models/Function');
    await Function.destroy({
      where: { moduleId: moduleIds } // 使用模块ID数组
    });
    
    // 4. 递归删除项目下的所有模块（包括子模块）
    await deleteModulesRecursively(req.params.id);
    
    // 5. 删除项目成员关联记录
    const { ProjectMember } = require('../models/index');
    await ProjectMember.destroy({
      where: { ProjectId: req.params.id }
    });
    
    // 6. 最后删除项目
    await project.destroy();
    
    res.json({
      success: true,
      message: '项目已删除'
    });
  } catch (error) {
    console.error('删除项目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 递归删除模块及其子模块
async function deleteModulesRecursively(projectId) {
  // 查找项目下的所有模块
  const modules = await Module.findAll({
    where: { projectId },
    attributes: ['id', 'parentId']
  });

  // 创建一个映射，用于存储模块及其子模块
  const moduleMap = new Map();
  modules.forEach(module => {
    if (!moduleMap.has(module.id)) {
      moduleMap.set(module.id, {
        id: module.id,
        parentId: module.parentId,
        children: []
      });
    }
  });

  // 构建模块树
  const moduleTree = [];
  modules.forEach(module => {
    const currentModule = moduleMap.get(module.id);
    if (module.parentId === null || !moduleMap.has(module.parentId)) {
      moduleTree.push(currentModule);
    } else {
      const parentModule = moduleMap.get(module.parentId);
      parentModule.children.push(currentModule);
    }
  });

  // 递归删除模块
  for (const module of moduleTree) {
    await deleteModuleAndChildren(module);
  }
}

// 递归删除模块及其所有子模块
async function deleteModuleAndChildren(module) {
  // 先删除所有子模块
  for (const child of module.children) {
    await deleteModuleAndChildren(child);
  }

  // 删除当前模块
  await Module.destroy({
    where: { id: module.id }
  });
}
/**
 * @desc    获取项目模板
 * @route   GET /api/v1/projects/templates
 * @access  Private
 */
exports.getProjectTemplates = async (req, res) => {
  try {
    // 直接返回模板数据
    const templates = [
      {
        id: 1,
        name: '常规测试项目',
        description: '基础功能测试模板',
        icon: '📋'
      },
      {
        id: 2,
        name: 'API测试项目',
        description: '接口测试专用模板',
        icon: '🌐'
      },
      {
        id: 3,
        name: 'UI测试项目',
        description: '界面测试专用模板',
        icon: '🖥️'
      },
      {
        id: 4,
        name: '性能测试项目',
        description: '性能测试专用模板',
        icon: '⚡'
      }
    ];
    
    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('获取项目模板错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
