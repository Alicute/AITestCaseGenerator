const axios = require('axios');
const Project = require('../models/Project');
const Module = require('../models/Module');
const TestCase = require('../models/TestCase');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * @desc    生成测试用例
 * @route   POST /api/v1/ai/generate
 * @access  Private
 */
exports.generateTestCases = async (req, res) => {
  try {
    const { moduleId, promptContent, provider, model, temperature, maxTokens } = req.body;

    // 检查必要参数
    if (!moduleId || !promptContent) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：moduleId和promptContent'
      });
    }

    // 验证模块是否存在
    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }

    // 检查用户是否有权限为此模块生成测试用例
    const project = await Project.findByPk(module.projectId);
    if (
      project.creatorId !== req.user.id && 
      !(await project.hasMembers(req.user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: '无权为此模块生成测试用例'
      });
    }

    // 根据提供商选择不同的API
    let generatedContent;
    
    if (provider === 'openai' || !provider) {
      generatedContent = await generateWithOpenAI(promptContent, model, temperature, maxTokens);
    } else if (provider === 'claude') {
      generatedContent = await generateWithClaude(promptContent, model, temperature, maxTokens);
    } else {
      return res.status(400).json({
        success: false,
        message: '不支持的AI提供商'
      });
    }

    res.json({
      success: true,
      data: {
        content: generatedContent,
        moduleId,
        moduleName: module.name,
        projectId: module.projectId
      }
    });
  } catch (error) {
    console.error('AI生成测试用例错误:', error);
    
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json({
        success: false,
        message: '调用AI服务失败',
        error: error.response.data
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
 * @desc    保存AI生成的测试用例
 * @route   POST /api/v1/ai/save
 * @access  Private
 */
exports.saveGeneratedTestCases = async (req, res) => {
  try {
    const { moduleId, projectId, testCases, aiProvider, aiModel } = req.body;

    // 检查必要参数
    if (!moduleId || !projectId || !testCases || !testCases.length) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 验证模块是否存在
    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }

    // 检查用户是否有权限为此模块保存测试用例
    const project = await Project.findByPk(module.projectId);
    if (
      project.creatorId !== req.user.id && 
      !(await project.hasMembers(req.user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: '无权为此模块保存测试用例'
      });
    }

    // 批量创建测试用例
    const createdTestCases = await Promise.all(
      testCases.map(async (tc) => {
        return await TestCase.create({
          title: tc.title,
          moduleId: moduleId,
          projectId,
          priority: tc.priority || 'medium',
          type: tc.type || 'functional',
          precondition: tc.precondition,
          steps: tc.steps,
          expectedResult: tc.expectedResult,
          isGenerated: true,
          aiProvider: aiProvider || 'openai',
          creatorId: req.user.id
        });
      })
    );

    // 更新项目和模块的测试用例计数
    await Project.update(
      { testCaseCount: sequelize.literal('testCaseCount + ' + createdTestCases.length) },
      { where: { id: projectId } }
    );

    await Module.update(
      { testCaseCount: sequelize.literal('testCaseCount + ' + createdTestCases.length) },
      { where: { id: moduleId } }
    );

    res.status(201).json({
      success: true,
      count: createdTestCases.length,
      data: createdTestCases
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(val => val.message);
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
 * @desc    获取提示词模板
 * @route   GET /api/v1/ai/templates
 * @access  Private
 */
exports.getPromptTemplates = async (req, res) => {
  try {
    // 这里可以从数据库中获取提示词模板
    // 现在我们先返回硬编码的模板数据
    const templates = [
      {
        id: 'standard',
        name: '标准测试',
        description: '生成标准测试用例，包含正常情况和基本异常情况',
        template: '生成针对"{moduleName}"的测试用例，包括正常情况和异常情况。测试用例应覆盖主要功能点。每个测试用例应包括:\n1. 标题\n2. 前置条件\n3. 步骤\n4. 预期结果'
      },
      {
        id: 'functional',
        name: '功能测试',
        description: '详细的功能测试，重点关注功能的正确性和完整性',
        template: '生成针对"{moduleName}"的功能测试用例。重点关注功能的正确性和完整性。每个测试用例应包括:\n1. 标题\n2. 前置条件\n3. 测试数据\n4. 步骤\n5. 预期结果'
      },
      {
        id: 'boundary',
        name: '边界测试',
        description: '重点测试边界条件、极限值和特殊情况',
        template: '生成针对"{moduleName}"的边界测试用例。重点关注输入参数的边界条件、极限值和特殊情况。每个测试用例应包括:\n1. 标题\n2. 测试场景描述\n3. 边界值/特殊值\n4. 步骤\n5. 预期结果'
      },
      {
        id: 'exception',
        name: '异常测试',
        description: '专注于系统错误处理、异常流程和容错性',
        template: '生成针对"{moduleName}"的异常测试用例。重点关注系统错误处理、异常流程和容错性。每个测试用例应包括:\n1. 标题\n2. 异常场景描述\n3. 触发条件\n4. 步骤\n5. 预期结果'
      }
    ];
    
    res.json({
      success: true,
      count: templates.length,
      data: templates
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
 * @desc    获取可用的AI模型
 * @route   GET /api/v1/ai/models
 * @access  Private
 */
exports.getAvailableModels = async (req, res) => {
  try {
    const { provider } = req.query;
    
    let models = [];
    
    if (provider === 'openai' || !provider) {
      models = [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
      ];
    } else if (provider === 'claude') {
      models = [
        { id: 'claude-instant', name: 'Claude Instant' },
        { id: 'claude-2', name: 'Claude 2' }
      ];
    } else if (provider === 'local') {
      models = [
        { id: 'local-model', name: '本地模型' }
      ];
    } else {
      return res.status(400).json({
        success: false,
        message: '不支持的AI提供商'
      });
    }
    
    res.json({
      success: true,
      count: models.length,
      data: models
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
 * 使用OpenAI API生成内容
 */
async function generateWithOpenAI(prompt, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 2000) {
  try {
    // 检查API密钥是否已配置
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API密钥未配置');
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的测试工程师，擅长编写高质量的测试用例。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: parseFloat(temperature) || 0.7,
        max_tokens: parseInt(maxTokens) || 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API调用失败:', error);
    throw error;
  }
}

/**
 * 使用Claude API生成内容
 */
async function generateWithClaude(prompt, model = 'claude-2', temperature = 0.7, maxTokens = 2000) {
  try {
    // 检查API密钥是否已配置
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error('Claude API密钥未配置');
    }
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: model || 'claude-2',
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        temperature: parseFloat(temperature) || 0.7,
        max_tokens_to_sample: parseInt(maxTokens) || 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.CLAUDE_API_KEY
        }
      }
    );
    
    return response.data.completion;
  } catch (error) {
    console.error('Claude API调用失败:', error);
    throw error;
  }
} 