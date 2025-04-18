const asyncHandler = require('express-async-handler')
const db = require('../models')
const { checkPermission } = require('../middlewares/auth')  // 修改这里

// @desc    创建功能点
// @route   POST /api/v1/functions
// @access  Private
const createFunction = asyncHandler(async (req, res) => {
  const { name, description, priority, moduleId } = req.body

  if (!name || !moduleId) {
    res.status(400)
    throw new Error('请提供功能点名称和所属模块ID')
  }

  try {
    // 检查模块是否存在
    const module = await db.Module.findByPk(moduleId)
    if (!module) {
      res.status(404)
      throw new Error('所属模块不存在')
    }

    // 获取模块所属的项目ID
    const projectId = module.projectId

    // 检查用户是否有权限操作此项目
    await checkPermission(req.user.id, projectId)

    // 创建功能点
    const functionData = await db.Function.create({
      name,
      description: description || '',
      priority: priority || 'medium',
      moduleId
    })

    // 更新模块的功能点数量（可选）
    await module.increment('functionCount', { by: 1 })

    res.status(201).json({
      success: true,
      data: functionData
    })
  } catch (error) {
    if (error.name === 'PermissionError') {
      res.status(403)
      throw new Error('无权操作此项目的模块')
    }

    res.status(500)
    throw new Error(`创建功能点失败: ${error.message}`)
  }
})

// @desc    更新功能点
// @route   PUT /api/v1/functions/:id
// @access  Private
const updateFunction = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { name, description, priority, moduleId } = req.body

  if (!name) {
    res.status(400)
    throw new Error('请提供功能点名称')
  }

  try {
    // 查找功能点
    const functionData = await db.Function.findByPk(id)
    if (!functionData) {
      res.status(404)
      throw new Error('功能点不存在')
    }

    // 获取功能点所属的模块
    const module = await db.Module.findByPk(functionData.moduleId)
    if (!module) {
      res.status(404)
      throw new Error('所属模块不存在')
    }

    // 检查用户是否有权限操作此项目
    await checkPermission(req.user.id, module.projectId)

    // 如果更改了所属模块，需要检查新模块是否存在并且用户有权限
    let newModuleId = functionData.moduleId
    if (moduleId && moduleId !== functionData.moduleId) {
      const newModule = await db.Module.findByPk(moduleId)
      if (!newModule) {
        res.status(404)
        throw new Error('新的所属模块不存在')
      }

      // 检查用户是否有权限操作新模块所属的项目
      await checkPermission(req.user.id, newModule.projectId)
      
      // 更新原来模块和新模块的功能点数量（可选）
      await module.decrement('functionCount', { by: 1 })
      await newModule.increment('functionCount', { by: 1 })
      
      newModuleId = moduleId
    }

    // 更新功能点
    await functionData.update({
      name,
      description: description || functionData.description,
      priority: priority || functionData.priority,
      moduleId: newModuleId
    })

    res.status(200).json({
      success: true,
      data: functionData
    })
  } catch (error) {
    if (error.name === 'PermissionError') {
      res.status(403)
      throw new Error('无权操作此功能点')
    }

    res.status(500)
    throw new Error(`更新功能点失败: ${error.message}`)
  }
})

// @desc    删除功能点
// @route   DELETE /api/v1/functions/:id
// @access  Private
const deleteFunction = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    // 查找功能点
    const functionData = await db.Function.findByPk(id)
    if (!functionData) {
      res.status(404)
      throw new Error('功能点不存在')
    }

    // 获取功能点所属的模块
    const module = await db.Module.findByPk(functionData.moduleId)
    if (!module) {
      res.status(404)
      throw new Error('所属模块不存在')
    }

    // 检查用户是否有权限操作此项目
    await checkPermission(req.user.id, module.projectId)

    // 删除功能点
    await functionData.destroy()

    // 更新模块的功能点数量（可选）
    await module.decrement('functionCount', { by: 1 })

    res.status(200).json({
      success: true,
      data: { id }
    })
  } catch (error) {
    if (error.name === 'PermissionError') {
      res.status(403)
      throw new Error('无权操作此功能点')
    }

    res.status(500)
    throw new Error(`删除功能点失败: ${error.message}`)
  }
})

module.exports = {
  createFunction,
  updateFunction,
  deleteFunction
} 