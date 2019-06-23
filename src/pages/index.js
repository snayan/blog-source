import React from "react"
import { Link, graphql } from "gatsby"
import Page from "../components/Page"
import styles from "./index.module.css"

class BlogIndex extends React.Component {
  render() {
    const { data } = this.props
    const posts = data.allMarkdownRemark.edges

    return (
      <Page location={this.props.location} title="首页">
        {posts.map(({ node }) => {
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
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
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