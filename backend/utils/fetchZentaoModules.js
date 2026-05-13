require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const axios   = require('axios')
const cheerio = require('cheerio')
const fs      = require('fs').promises
const path    = require('path')
const { Setting } = require('../models')

async function getZentaoConfig() {
  const [urlSetting, cookieSetting] = await Promise.all([
    Setting.findByPk('ZENTAO_URL'),
    Setting.findByPk('ZENTAO_COOKIE')
  ])

  return {
    url: (urlSetting?.value || process.env.ZENTAO_URL || '').trim(),
    cookie: (cookieSetting?.value || process.env.ZENTAO_COOKIE || '').trim()
  }
}

/**
 * 抓取禅道模块并缓存为 public/flat.json
 * @param {boolean} write 是否写文件
 * @returns {Promise<Array>} 模块扁平数组
 */
async function fetchModules(write = true) {
  const { url, cookie } = await getZentaoConfig()

  // 检查环境变量
  if (!url) {
    throw new Error('ZENTAO_URL 环境变量未配置')
  }
  if (!cookie) {
    throw new Error('ZENTAO_COOKIE 环境变量未配置')
  }

  const { data: html } = await axios.get(url, {
    headers: { Cookie: cookie },
    timeout: 15000
  })
  const $      = cheerio.load(html)
  const $root  = $('#modules')
  
  if ($root.length === 0) {
    throw new Error('未找到禅道模块数据，请检查URL和Cookie是否正确')
  }
  
  const flat  = []

  const walk = ($ul, parent = null) => {
    $ul.children('li').each((_, li) => {
      const $li  = $(li)
      const $a   = $li.children('a').first()
      const id   = $a.attr('id').replace('module', '')
      const name = $a.text().trim()
      flat.push({ id, name, parentId: parent })
      const $sub = $li.children('ul').first()
      if ($sub.length) walk($sub, id)
    })
  }
  walk($root)

  if (write) {
    const dir = path.join(__dirname, '..', 'public')
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(
      path.join(dir, 'flat.json'),
      JSON.stringify(flat, null, 2)
    )
  }

  return flat
}

module.exports = fetchModules



// if (require.main === module) {
//   fetchModules(false)          // false → 不写文件，只打印
//     .then(() => console.log('[Zentao] 调试完成'))
//     .catch((err) => console.error('[Zentao] 调试出错:', err))
// }
