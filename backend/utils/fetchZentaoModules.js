require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const axios   = require('axios')
const cheerio = require('cheerio')
const fs      = require('fs').promises
const path    = require('path')

const URL    = process.env.ZENTAO_URL
const COOKIE = process.env.ZENTAO_COOKIE

/**
 * 抓取禅道模块并缓存为 public/flat.json
 * @param {boolean} write 是否写文件
 * @returns {Promise<Array>} 模块扁平数组
 */
async function fetchModules(write = true) {
  const { data: html } = await axios.get(URL, {
    headers: { Cookie: COOKIE.trim() },
    timeout: 15000
  })
  const $      = cheerio.load(html)
  const $root  = $('#modules')
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