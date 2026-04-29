const axios = require('axios');
const Project = require('../models/Project');
const Module = require('../models/Module');
const TestCase = require('../models/TestCase');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const Setting = require('../models/Setting');

// 获取配置的辅助函数
async function getConfig(key, defaultValue = '') {
  try {
    const setting = await Setting.findOne({ where: { key } });
    return setting ? setting.value : (process.env[key] || defaultValue);
  } catch (error) {
    console.warn(`获取配置 ${key} 失败:`, error.message);
    return process.env[key] || defaultValue;
  }
}

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

    // 如果是管理员，或者不仅是创建者也是成员
    if (req.user.role !== 'admin' &&
      project.creatorId !== req.user.id &&
      !(await project.hasMembers(req.user.id))) {
      return res.status(403).json({
        success: false,
        message: '无权为此模块生成测试用例'
      });
    }

    // 根据提供商选择不同的API
    let generatedContent;

    // 确定使用的提供商
    // 确定使用的提供商
    const envProvider = await getConfig('AI_PROVIDER');
    const envModel = await getConfig('AI_MODEL');

    const activeProvider = provider || envProvider || 'gemini';
    const activeModel = model || envModel;

    if (activeProvider === 'gemini') {
      generatedContent = await generateWithGemini(promptContent, activeModel, temperature, maxTokens);
    } else {
      // 默认为 OpenAI 兼容模式
      generatedContent = await generateWithOpenAI(promptContent, activeModel, temperature, maxTokens);
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
 * @desc    AI生成模块结构
 * @route   POST /api/v1/ai/generate-modules
 * @access  Private
 */
exports.generateModules = async (req, res) => {
  try {
    const { prompt, images, provider, model, temperature, maxTokens } = req.body;

    // 检查必要参数
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：prompt'
      });
    }

    let generatedContent;

    // 构建Prompt
    const systemPrompt = `作为一名专业的测试工程师经理和团队负责人，你的核心职责是准确理解小程序的功能。在此基础上，你需要合理规划并分配测试任务给团队成员，具体要求是根据小程序的功能模块结构进行精细划分。团队成员将依据你提供的模块划分来独立编写详细的测试用例。
请你负责进行功能测试的整体规划。你的主要任务是确保测试任务的模块划分清晰准确，而非亲自编写全面的测试用例。
对于任何不明确的需求，请基于现有功能进行专业判断和合理推断，以保障测试用例模块划分的准确性和明确性。请根据用户提供的业务背景（文字描述或图片），设计一套完整的功能测试模块结构。
    
**输出要求**：
1. 仅输出一个标准的 JSON 数组格式，不要包含Markdown标记（如 \`\`\`json），不要有任何解释性文字。
2. 严格遵守下方的 JSON 结构定义。

**JSON 结构定义**：
[
  {
    "name": "一级模块名称",
    "description": "模块目标的简要描述",
    "priority": "high", 
    "functions": [
      {
        "name": "功能点名称",
        "description": "功能点的详细描述",
        "priority": "medium" 
      }
    ],
    "children": [
      {
        "name": "子模块名称",
        "description": "...",
        "functions": [],
        "children": []
      }
    ]
  }
]
注意：
- priority 可选值：high, medium, low
- 层级建议控制在 3 层以内
- 确保覆盖所有核心业务流程`;

    // 确定使用的提供商
    // 确定使用的提供商
    const envProvider = await getConfig('AI_PROVIDER');
    const envModel = await getConfig('AI_MODEL');

    const activeProvider = provider || envProvider || 'gemini';
    const activeModel = model || envModel;

    if (activeProvider === 'gemini') {
      const geminiPrompt = {
        text: systemPrompt + '\n\n' + prompt,
        images: images
      };
      generatedContent = await generateWithGemini(geminiPrompt, activeModel, temperature);
    } else {
      // 默认为 OpenAI 兼容模式
      generatedContent = await generateWithOpenAI(prompt, activeModel, temperature, maxTokens, systemPrompt, images);
    }

    // 尝试解析JSON以验证格式
    let parsedData;
    try {
      // 清理可能的markdown标记
      const jsonStr = generatedContent.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      // 如果解析失败，返回原始文本，前端处理错误
      console.warn('AI返回内容非标准JSON:', generatedContent);
    }

    res.json({
      success: true,
      data: parsedData || generatedContent
    });

  } catch (error) {
    console.error('AI生成模块错误:', error);
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
          aiProvider: aiProvider || 'gemini',
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

/**
 * 使用 Google Gemini 生成内容
 * @param {string} prompt 提示词
 * @param {string} model 模型名称
 * @param {number} temperature 温度
 * @param {number} maxTokens 最大Token数 (Gemini API 参数不同，这里暂不传或适配)
 */
async function generateWithGemini(prompt, model = 'gemini-pro', temperature = 0.7) {
  try {
    // 检查API密钥
    const apiKey = await getConfig('AI_API_KEY');
    if (!apiKey) {
      throw new Error('Google Gemini API密钥未配置');
    }

    // 处理图片（如果prompt中包含图片数据）
    // 注意：这里的prompt可能已经是处理过的文本，如果需要支持图片，需要在上层传递图片数据
    // 目前 generateModules 传递的是 userPrompt，我们需要解析或约定格式
    // 简单起见，这里假设 prompt 是 JSON 字符串包含了 { text, images } 或者是纯文本

    let contents = [];
    let isMultimodal = false;

    // 尝试判断是否包含图片 (这里是一个简单的约定，实际应该优化参数传递)
    // 但为了保持接口一致性 generateWithGemini(prompt, ...)
    // 我们约定：如果是多模态，prompt 会是一个特殊标记的对象字符串

    // 这里我们先只支持纯文本，或者如果上层调用 generateWithGemini 时传递的是对象
    // 但 JS 是弱类型，我们可以判断 prompt 类型

    if (typeof prompt === 'object' && prompt.text) {
      // { text: "...", images: ["base64..."] }
      const parts = [{ text: prompt.text }];
      if (prompt.images && Array.isArray(prompt.images)) {
        prompt.images.forEach(img => {
          // 移除 base64 前缀 (data:image/jpeg;base64,)
          const base64Data = img.split(',')[1];
          const mimeType = img.split(';')[0].split(':')[1] || 'image/jpeg';

          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          });
        });
      }
      contents.push({ role: 'user', parts });
    } else {
      // 纯文本
      contents.push({ role: 'user', parts: [{ text: prompt }] });
    }

    // 获取API基础地址
    // 默认: https://generativelanguage.googleapis.com/v1beta
    // 如果配置了 AI_API_URL，则使用配置的地址
    // 获取API基础地址
    // 默认: https://generativelanguage.googleapis.com/v1beta
    // 如果配置了 AI_API_URL，则使用配置的地址
    const apiUrl = await getConfig('AI_API_URL');
    const baseURL = apiUrl || 'https://generativelanguage.googleapis.com/v1beta';

    // 拼接完整 URL
    // 注意：Gemini 的 URL 格式是 .../models/{model}:generateContent
    // 如果是自定义 URL (Proxy)，可能是 .../v1/chat/completions (如果是转成OpenAI格式的Proxy)
    // 但这里我们假设是 Native Gemini Proxy 或 直连

    const url = `${baseURL}/models/${model}:generateContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      {
        contents: contents,
        generationConfig: {
          temperature: parseFloat(temperature) || 0.7
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    // 解析响应
    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }

    return '';

  } catch (error) {
    console.error('Gemini API调用失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

exports.getAvailableModels = async (req, res) => {
  try {
    const { provider } = req.query;

    // 如果是 OpenAI 提供商，尝试从上游获取模型列表
    if (provider === 'openai' || !provider) {
      try {
        // 检查API密钥
        if (!process.env.OPENAI_API_KEY) {
          // check if we have DB setting
          const aiApiKey = await getConfig('AI_API_KEY');
          if (!aiApiKey) {
            return res.json({ success: true, count: 0, data: [] });
          }
        }

        const aiApiKey = await getConfig('AI_API_KEY');
        const openAiApiKey = process.env.OPENAI_API_KEY;
        const apiKey = aiApiKey || openAiApiKey;

        if (!apiKey) {
          return res.json({ success: true, count: 0, data: [] });
        }

        const apiUrl = await getConfig('AI_API_URL');
        const baseURL = apiUrl || 'https://api.openai.com/v1';

        const response = await axios.get(`${baseURL}/models`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });

        if (response.data && response.data.data) {
          const models = response.data.data
            .map(m => ({ id: m.id, name: m.id }))
            .filter(m => m.id.includes('gpt'));

          return res.json({
            success: true,
            count: models.length,
            data: models
          });
        }
      } catch (upstreamError) {
        console.error('获取上游模型列表失败:', upstreamError.message);
        return res.status(502).json({
          success: false,
          message: '无法从AI服务商获取模型列表，请检查API Key和接口地址',
          error: upstreamError.message
        });
      }
    } else if (provider === 'gemini') {
      try {
        const apiKey = await getConfig('AI_API_KEY');
        if (!apiKey) {
          return res.json({ success: true, count: 0, data: [] });
        }

        const apiUrl = await getConfig('AI_API_URL');
        const baseURL = apiUrl || 'https://generativelanguage.googleapis.com/v1beta';
        // Gemini 获取模型列表 API: GET /v1beta/models?key=...
        const response = await axios.get(`${baseURL}/models?key=${apiKey}`);

        if (response.data && response.data.models) {
          const models = response.data.models
            .map(m => ({
              id: m.name.replace('models/', ''), // Gemini 返回 name 是 "models/gemini-pro"
              name: m.displayName || m.name
            }))
            .filter(m => m.id.includes('gemini')); // 过滤

          return res.json({
            success: true,
            count: models.length,
            data: models
          });
        }
      } catch (error) {
        console.error('获取Gemini模型失败:', error.message);
        return res.status(502).json({
          success: false,
          message: '无法获取Gemini模型列表',
          error: error.message
        });
      }
    }

    // 其他提供商暂未实现动态获取，返回空列表让用户手填
    // 或者可以保留部分硬编码作为 fallback，但根据需求"默认模型置空"，我们返回空
    res.json({
      success: true,
      count: 0,
      data: []
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
async function generateWithOpenAI(prompt, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 2000, systemPrompt = '', images = []) {
  try {
    // 检查API密钥是否已配置
    const aiApiKey = await getConfig('AI_API_KEY');
    const openAiApiKey = process.env.OPENAI_API_KEY;
    const apiKey = aiApiKey || openAiApiKey;

    if (!apiKey) {
      throw new Error('AI API密钥未配置');
    }

    // 获取API基础地址，如果有配置则使用配置的地址，否则使用默认地址
    const apiUrl = await getConfig('AI_API_URL');
    const baseURL = apiUrl || 'https://api.openai.com/v1';

    const messages = [
      {
        role: 'system',
        content: systemPrompt || '你是一个专业的测试工程师，擅长编写高质量的测试用例。'
      }
    ];

    // 构建用户消息
    const userMessageContent = [];

    // 添加文本内容
    userMessageContent.push({
      type: "text",
      text: prompt
    });

    // 添加图片内容 (如果模型支持视觉)
    if (images && images.length > 0) {
      // 简单检查模型是否支持视觉（实际应更严谨，gpt-4-vision或gpt-4o等）
      // 这里假设如果传了图片，调用者已经选择了支持视觉的模型
      images.forEach(imgBase64 => {
        userMessageContent.push({
          type: "image_url",
          image_url: {
            url: imgBase64 // Base64 格式应包含 data:image/jpeg;base64,...
          }
        });
      });
    }

    // 如果没有图片，简化为普通文本消息结构（兼容旧模型）
    if (!images || images.length === 0) {
      messages.push({
        role: 'user',
        content: prompt
      });
    } else {
      messages.push({
        role: 'user',
        content: userMessageContent
      });
    }

    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model: model || 'gpt-3.5-turbo',
        messages: messages,
        temperature: parseFloat(temperature) || 0.7,
        max_tokens: parseInt(maxTokens) || 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API调用失败:', error);
    throw error;
  }
}


