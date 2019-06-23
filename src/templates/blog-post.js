import React from "react"
import { Link, graphql } from "gatsby"
import Image from "gatsby-image"
import Layout from "../components/Layout"
import styles from "./blog-post.module.css"

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const siteTitle = this.props.data.site.siteMetadata.title
    const author = this.props.data.site.siteMetadata.author
    const { previous, next } = this.props.pageContext

    return (
      <Layout
        location={this.props.location}
        title={post.frontmatter.title}
        description={post.excerpt}
      >
        <div className={styles.author}>
          <Image
            fixed={this.props.data.avatar.childImageSharp.fixed}
            alt={author}
            style={{
              width: 40,
              height: 40,
              display: "block",
              opacity: 0.5,
            }}
            imgStyle={{
              borderRadius: `50%`,
            }}
          />
          <Link to="/">
            <h2 className={styles.siteTitle}>{siteTitle}</h2>
          </Link>
        </div>
        <article className={styles.article}>
          <h1 className={styles.articleTitle}>{post.frontmatter.title}</h1>
          <small>{post.frontmatter.date}</small>
          <div dangerouslySetInnerHTML={{ __html: post.html }} />
          <hr style={{}} />

          <nav className={styles.footerNav}>
            {previous && (
              <Link
                className={styles.previous}
                to={previous.fields.slug}
                rel="prev"
              >
                « {previous.frontmatter.title}
              </Link>
            )}
            {next && (
              <Link className={styles.next} to={next.fields.slug} rel="next">
                {next.frontmatter.title} »
              </Link>
            )}
          </nav>
        </article>
      </Layout>
    )
  }
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    avatar: file(absolutePath: { regex: "/my.jpg/" }) {
      childImageSharp {
        fixed(width: 40, height: 40) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    site {
      siteMetadata {
        title
        author
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
      }
    }
  }
`