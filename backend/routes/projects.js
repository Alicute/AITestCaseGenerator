const express = require('express');
const router = express.Router();
const { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject,
  getProjectTemplates
} = require('../controllers/projectController');
const { protect } = require('../middlewares/auth');

// 所有项目路由都需要认证
router.use(protect);

// 获取项目模板
router.get('/templates', getProjectTemplates);

// 项目CRUD操作
router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

module.exports = router; 