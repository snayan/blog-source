import React from "react"
import { Link, graphql } from "gatsby"
import Page from "../../components/Page"
import styles from "./index.module.css"

class Archives extends React.Component {
  render() {
    const data = this.props.data
    const posts = data.allMarkdownRemark.edges
    const content = posts.reduce((result, item) => {
      const year = new Date(item.node.frontmatter.date).getFullYear()
      if (!Array.isArray(result[year])) {
        result[year] = []
      }
      result[year].push(item)
      return result
    }, {})

    return (
      <Page location={this.props.location} title="首页">
        <h1>文章归档</h1>
        {Object.keys(content)
          .sort((a, b) => b - a)
          .map(year => {
            const posts = content[year] || []
            if (!posts.length) {
              return null
            }
            return (
              <React.Fragment key={year}>
                <h2>{year}</h2>
                <ul>
                  {posts.map(article => {
                    return (
                      <li key={article.node.fields.slug}>
                        <Link to={article.node.fields.slug}>
                          {article.node.frontmatter.title}
                        </Link>
                        <span className={styles.date}>({article.node.frontmatter.date})</span>
                      </li>
                    )
                  })}
                </ul>
              </React.Fragment>
            )
          })}
      </Page>
    )
  }
}

export const archiveQuery = graphql`
  query {
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      totalCount
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
          }
        }
      }
    }
  }
`

export default Archives
