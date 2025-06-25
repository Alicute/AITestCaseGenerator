const express = require('express')
const path    = require('path')
const fs      = require('fs').promises
const fetch   = require('../utils/fetchZentaoModules')

const router = express.Router()

router.get('/modules', async (_, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'public', 'flat.json')
    const content = await fs.readFile(filePath, 'utf8')
    return res.json(JSON.parse(content))
  } catch {
    try {
      const data = await fetch()
      return res.json(data)
    } catch {
      return res.status(500).json({ success: false, message: '服务器内部错误' })
    }
  }
})

router.post('/modules/refresh', async (_, res) => {
  try {
    const data = await fetch()
    res.json({ success: true, count: data.length })
  } catch {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

module.exports = router