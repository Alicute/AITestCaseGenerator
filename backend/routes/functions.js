const express = require('express')
const { protect } = require('../middlewares/auth')  // 修改这里
const { 
  createFunction,
  updateFunction,
  deleteFunction,
  getFunctions,
  getFunction,
  getModuleFunctions
} = require('../controllers/functionController')

const router = express.Router()

// 保护所有路由，需要登录才能访问
router.use(protect)

// 功能点路由
router.route('/')
  .get(getFunctions)
  .post(createFunction)

router.route('/:id')
  .get(getFunction)
  .put(updateFunction)
  .delete(deleteFunction)

// 获取模块下的功能点列表
router.get('/module/:moduleId', getModuleFunctions)

module.exports = router 