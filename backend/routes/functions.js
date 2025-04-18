const express = require('express')
const { protect } = require('../middlewares/auth')  // 修改这里
const { 
  createFunction,
  updateFunction,
  deleteFunction
} = require('../controllers/functionController')

const router = express.Router()

// 保护所有路由，需要登录才能访问
router.use(protect)

// 功能点路由
router.route('/')
  .post(createFunction)

router.route('/:id')
  .put(updateFunction)
  .delete(deleteFunction)

module.exports = router 