const asyncHandler = require('express-async-handler')
const db = require('../models')
const { Function, Module, Project } = require('../models')

// @desc    创建功能点
// @route   POST /api/v1/functions
// @access  Private
const createFunction = async (req, res) => {
  try {
    const { name, description, priority, moduleId } = req.body

    // 验证必填字段
    if (!name || !moduleId) {
      return res.status(400).json({
        success: false,
        message: '功能点名称和模块ID为必填项'
      })
    }

    // 检查模块是否存在
    const module = await Module.findByPk(moduleId, {
      include: [
        {
          model: Project,
          attributes: ['id', 'name']
        }
      ]
    })

    if (!module) {
      return res.status(404).json({
        success: false,
        message: '模块不存在'
      })
    }

    // 创建功能点
    const functionItem = await Function.create({
      name,
      description: description || '',
      priority: priority || 'medium',
      moduleId
    })

    res.status(201).json({
      success: true,
      data: functionItem
    })
  } catch (error) {
    console.error('创建功能点失败:', error)
    res.status(500).json({
      success: false,
      message: '创建功能点失败',
      error: error.message
    })
  }
}

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

    // 如果更改了所属模块，需要检查新模块是否存在
    let newModuleId = functionData.moduleId
    if (moduleId && moduleId !== functionData.moduleId) {
      const newModule = await db.Module.findByPk(moduleId)
      if (!newModule) {
        res.status(404)
        throw new Error('新的所属模块不存在')
      }
      
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

    // 删除功能点
    await functionData.destroy()

    // 更新模块的功能点数量（可选）
    await module.decrement('functionCount', { by: 1 })

    res.status(200).json({
      success: true,
      data: { id }
    })
  } catch (error) {
    res.status(500)
    throw new Error(`删除功能点失败: ${error.message}`)
  }
})

// 获取功能点列表
const getFunctions = async (req, res) => {
  try {
    const functions = await Function.findAll({
      include: [
        {
          model: Module,
          include: [
            {
              model: Project,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['priority', 'ASC']]
    })

    res.json({
      success: true,
      data: functions
    })
  } catch (error) {
    console.error('获取功能点列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取功能点列表失败',
      error: error.message
    })
  }
}

// 获取单个功能点详情
const getFunction = async (req, res) => {
  try {
    const { id } = req.params

    const functionItem = await Function.findByPk(id, {
      include: [
        {
          model: Module,
          include: [
            {
              model: Project,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    })

    if (!functionItem) {
      return res.status(404).json({
        success: false,
        message: '功能点不存在'
      })
    }

    res.json({
      success: true,
      data: functionItem
    })
  } catch (error) {
    console.error('获取功能点详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取功能点详情失败',
      error: error.message
    })
  }
}

// 获取模块下的功能点列表
const getModuleFunctions = async (req, res) => {
  try {
    const { moduleId } = req.params

    // 检查模块是否存在
    const module = await Module.findByPk(moduleId, {
      include: [
        {
          model: Project,
          attributes: ['id', 'name']
        }
      ]
    })

    if (!module) {
      return res.status(404).json({
        success: false,
        message: '模块不存在'
      })
    }

    const functions = await Function.findAll({
      where: { moduleId },
      order: [['priority', 'ASC']]
    })

    res.json({
      success: true,
      data: functions
    })
  } catch (error) {
    console.error('获取模块功能点列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取模块功能点列表失败',
      error: error.message
    })
  }
}

module.exports = {
  createFunction,
  updateFunction,
  deleteFunction,
  getFunctions,
  getFunction,
  getModuleFunctions
} 