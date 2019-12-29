const Remark = require(`remark`)
const { GraphQLString } = require(`gatsby/graphql`)
const { toTocHTML } = require("./transform")

let pluginsCacheStr = ``
let pathPrefixCacheStr = ``

const astCacheKey = node =>
  `extend-toc-type-ast-${node.internal.contentDigest}-${pluginsCacheStr}-${pathPrefixCacheStr}`
const tableOfContentsCacheKey = (node, maxDepth) =>
  `extend-toc-type-toc-${node.internal.contentDigest}-${pluginsCacheStr}-${maxDepth}-${pathPrefixCacheStr}`

module.exports = ({ type, pathPrefix, cache }, pluginOptions) => {
  if (type.name !== `MarkdownRemark`) {
    return {}
  }

  pluginsCacheStr = JSON.stringify(pluginOptions)
  pathPrefixCacheStr = pathPrefix || ""

  // Setup Remark.
  const remarkOptions = {
    commonmark: true,
    footnotes: true,
    gfm: true,
    pedantic: true,
  }
  let remark = new Remark().data(`settings`, remarkOptions)

  async function getAST(markdownNode) {
    const cacheKey = astCacheKey(markdownNode)
    const cachedAST = await cache.get(cacheKey)
    if (cachedAST) {
      return cachedAST
    } else {
      const markdownAST = await remark.parse(markdownNode.internal.content)
      cache.set(cacheKey, markdownAST)
      return markdownAST
    }
  }

  async function getTableOfContents(markdownNode) {
    // fetch defaults
    let maxDepth = pluginOptions.maxDepth || 1

    // get cached toc
    const cachedToc = await cache.get(
      tableOfContentsCacheKey(markdownNode, maxDepth)
    )
    if (cachedToc) {
      return cachedToc
    } else {
      const markdownAST = await getAST(markdownNode)
      const tocHtml = toTocHTML({ markdownAST }, maxDepth)
      cache.set(tableOfContentsCacheKey(markdownNode, maxDepth), tocHtml)
      return tocHtml
    }
  }

  return new Promise((resolve, reject) => {
    return resolve({
      tableOfContents: {
        type: GraphQLString,
        resolve(markdownNode) {
          return getTableOfContents(markdownNode)
        },
      },
    })
  })
}
