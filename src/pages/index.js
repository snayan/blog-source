import React from "react"
import { Link, graphql } from "gatsby"
import Page from "../components/Page"
import Pagination from "../components/Pagination"
import { getQuery } from "../utils"
import styles from "./index.module.css"

class BlogIndex extends React.Component {
  getPn() {
    let pn = Number(getQuery("pn"))
    return pn < 0 ? 0 : pn
  }

  render() {
    const pn = this.getPn()
    const { data } = this.props
    const postLimit = data.site.siteMetadata.postLimit
    const posts = data.allMarkdownRemark.edges
    const totalCount = data.allMarkdownRemark.totalCount
    const start = pn * postLimit
    const end = start + postLimit
    const renderPosts = posts.slice(start, end)

    return (
      <Page location={this.props.location} title="首页">
        {renderPosts.map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug
          return (
            <article className={styles.article} key={node.fields.slug}>
              <div className={styles.header}>
                <h2>
                  <Link to={node.fields.slug}>{title}</Link>
                </h2>
                <small>{node.frontmatter.date}</small>
              </div>
              <p
                dangerouslySetInnerHTML={{
                  __html: node.excerpt,
                }}
              />
              <Link to={node.fields.slug}>继续阅读 »</Link>
            </article>
          )
        })}
        <Pagination total={totalCount} pn={pn} />
      </Page>
    )
  }
}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
        postLimit
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      totalCount
      edges {
        node {
          excerpt
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
