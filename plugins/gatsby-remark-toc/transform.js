const visit = require(`unist-util-visit`)
const toString = require("mdast-util-to-string")
const hastToHTML = require(`hast-util-to-html`)
const h = require("hastscript")
const headId = new Map()

function generateId(depth) {
  let count = headId.has(depth) ? headId.get(depth) : 0
  count = count + 1
  headId.set(depth, count)
  return `toc-${depth}-${count}`
}

exports.transformMarkdownAST = ({ markdownAST }) => {
  headId.clear()
  visit(markdownAST, "heading", node => {
    const { depth } = node
    const text = toString(node)
    const id = generateId(depth)
    const html = `
        <h${depth} id='${id}' >
          ${text}
        </h${depth}>
      `
    node.type = "html"
    node.children = undefined
    node.value = html
    node.depth = depth
    node.internal = {
      type: `h${depth}`,
      id: id,
      text: text,
    }
  })

  return markdownAST
}

exports.toTocHTML = ({ markdownAST }, maxDepth) => {
  const toc = []
  headId.clear()

  const getParent = depth => {
    const parentDepth = depth - 1
    if (parentDepth < 0) {
      return null
    }
    let parent = null
    let j = toc.length
    while (!parent && j--) {
      const current = toc[j]
      if (current.depth === parentDepth) {
        parent = current
      }
    }
    if (parent === null) {
      return getParent(parentDepth)
    }
    return parent
  }
  visit(markdownAST, "heading", node => {
    const { depth } = node
    const text = toString(node)
    const id = generateId(depth)
    const parent = getParent(depth)
    const tocNode = {
      id,
      depth,
      text,
      children: [],
    }
    if (parent) {
      parent.children.push(tocNode)
    } else {
      toc.push(tocNode)
    }
  })

  const hastBuilder = (node, depth) => {
    if (depth > maxDepth) {
      return
    }
    return h(
      "ul",
      node.children.map(i => {
        return h(
          "li",
          [
            h("a", { href: `#${i.id}` }, [i.text]),
            hastBuilder(i, depth + 1),
          ].filter(Boolean)
        )
      })
    )
  }

  if (toc.length) {
    const hast = hastBuilder({ id: null, children: toc }, 1)
    return hastToHTML(hast)
  }
  return ""
}
