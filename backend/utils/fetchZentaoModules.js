const axios = require('axios')
const cheerio = require('cheerio')
const fs     = require('fs').promises


module.exports = async function fetchModules (writeFile = true) {
  const { data: html } = await axios.get(URL, {
    headers: { Cookie: COOKIE.trim() },
    timeout: 15000,
  })

  const $root = cheerio.load(html)('#modules')
  const flat  = []
  const map   = new Map()

  const walk = ($ul, parent = null) => {
    $ul.children('li').each((_, li) => {
      const $li = $root(li)
      const $a  = $li.children('a').first()
      const id  = $a.attr('id').replace('module', '')
      const name= $a.text().trim()
      flat.push({ id, name, parentId: parent })
      map.set(id, { name, parentId: parent })
      const $child = $li.children('ul').first()
      if ($child.length) walk($child, id)
    })
  }
  walk($root)

  /* 可选：写到 public/flat.json，供前端直接 fetch */
  if (writeFile)
    await fs.writeFile('public/flat.json', JSON.stringify(flat, null, 2))

  return flat
}