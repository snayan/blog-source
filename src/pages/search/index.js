import React from "react"
import { Index } from "elasticlunr"
import { Link, graphql } from "gatsby"
import Page from "../../components/Page"
import styles from "./index.module.css"
import { getQuery } from "../../utils"

class Search extends React.Component {
  constructor(props) {
    super(props)
    this.index = Index.load(props.data.siteSearchIndex.index)
    this.tagLink = props.data.site.siteMetadata.menu.search.link
    this.formatPosts(props)
    this.state = {
      query: getQuery("query") || "",
      results: [],
      clicked: false,
    }
  }

  formatPosts = props => {
    const total = props.data.allMarkdownRemark.edges.length
    const posts = {}
    const tags = {}
    for (let i = 0; i < total; i++) {
      const post = props.data.allMarkdownRemark.edges[i]
      const tag = Array.isArray(post.node.frontmatter.tags)
        ? post.node.frontmatter.tags
        : [post.node.frontmatter.tags]
      posts[post.node.frontmatter.title] = {
        slug: post.node.fields.slug,
        date: post.node.frontmatter.date,
      }
      for (let m = 0, n = tag.length; m < n; m++) {
        tags[tag[m]] = (tags[tag[m]] || 0) + 1
      }
    }
    this.posts = posts
    this.tags = tags
  }

  change = e => {
    const query = e.target.value
    this.setState({ query })
  }

  query = () => {
    if (!this.state.query) {
      return
    }
    this.setState(preState => {
      const results = this.index
        .search(preState.query, { expand: true })
        .map(({ ref }) => this.index.documentStore.getDoc(ref))
      return { results, clicked: true }
    })
  }

  componentDidMount() {
    this.query()
  }

  render() {
    const results = this.state.results
    let content = null
    if (this.state.clicked && !results.length) {
      content = (
        <p className={styles.empty}>没有找到任何结果，请更换查询词试试~</p>
      )
    } else if (results) {
      content = (
        <ul className={styles.list}>
          {results
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(item => {
              const post = this.posts[item.title]
              return (
                <li className={styles.article} key={item.id}>
                  <article>
                    <h4 className={styles.title}>
                      <Link to={post.slug}>{item.title}</Link>
                    </h4>
                    <small className={styles.info}>
                      <span className={styles.infoDate}>{post.date}</span>
                      <span className={styles.infoTags}>
                        「 {item.tags.join(" 、")} 」
                      </span>
                    </small>
                  </article>
                </li>
              )
            })}
        </ul>
      )
    }
    return (
      <Page location={this.props.location} title="搜索">
        <div className={styles.panel}>
          <div className={styles.search}>
            <input
              className={styles.searchInput}
              type="text"
              value={this.state.query}
              onChange={this.change}
              placeholder="请输入关键词..."
            />
            <button className={styles.searchBtn} onClick={this.query}>
              搜索
            </button>
          </div>
          {this.state.clicked && (
            <small className={styles.totalCount}>
              {" "}
              本次搜索共找到结果 {results.length} 条
            </small>
          )}
          <div className={styles.tags}>
            <span>标签：</span>
            {Object.keys(this.tags).map(tag => {
              return (
                <a key={tag} href={`${this.tagLink}?query=${tag}`}>
                  <span className={styles.tag} key={tag}>
                    {tag}
                  </span>
                </a>
              )
            })}
          </div>
          <div className={styles.results}>{content}</div>
        </div>
      </Page>
    )
  }
}

export default Search

export const searchQuery = graphql`
  query {
    siteSearchIndex {
      index
    }
    site {
      siteMetadata {
        menu {
          search {
            name
            link
          }
        }
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            date(formatString: "YYYY-MM-DD")
            title
            tags
          }
        }
      }
    }
  }
`
