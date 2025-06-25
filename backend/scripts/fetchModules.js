// node fetchModules.js
const fs      = require('fs')
const axios   = require('axios')
const cheerio = require('cheerio')


;(async () => {
    /* 1. 抓页面 ---------------------------------------------------------------- */
    const { data: html } = await axios.get(URL, {
      headers: { Cookie: COOKIE.replace(/[\r\n]/g, '').trim() },
      timeout: 15000,
    })
  
    const $      = cheerio.load(html)
    const $root  = $('#modules')
  
    /* 2. 递归解析 ---------------------------------------------------------------- */
    const flat  = []          // 扁平表
    const toTree = ($ul, parentId = null) => {
      const nodes = []
      $ul.children('li').each((_, li) => {
        const $li   = $(li)
        const $a    = $li.children('a').first()
        const id    = $a.attr('id').replace('module', '')
        const name  = $a.text().trim()
  
        flat.push({ id, name, parentId })          // 记录扁平行
  
        const $childUl = $li.children('ul').first()
        const node = { id, name }
        if ($childUl.length) node.children = toTree($childUl, id)      // 递归
        nodes.push(node)
      })
      return nodes
    }
    const tree = toTree($root)
  
    /* 3. 输出 -------------------------------------------------------------------- */
    fs.writeFileSync('flat.json' , JSON.stringify(flat , null, 2))
    fs.writeFileSync('tree.json' , JSON.stringify(tree , null, 2))
    console.table(flat)
  })().catch(console.error)