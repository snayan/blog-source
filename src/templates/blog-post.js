import React from "react"
import { Link, graphql } from "gatsby"
import Image from "gatsby-image"
import Layout from "../components/Layout"
import { getSearchLink } from "../utils"
import styles from "./blog-post.module.css"

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const siteTitle = this.props.data.site.siteMetadata.title
    const author = this.props.data.site.siteMetadata.author
    const contentUrl = this.props.data.site.siteMetadata.contentUrl
    const postPath = this.props.data.site.siteMetadata.postPath
    const { previous, next, slug } = this.props.pageContext
    const searchLink = this.props.data.site.siteMetadata.menu.search.link

    return (
      <Layout
        location={this.props.location}
        title={post.frontmatter.title}
        description={post.excerpt}
      >
        <div className={styles.post}>
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
            <small>
              <span>{post.frontmatter.date}</span>
              <span className={styles.tags}>
                /「{" "}
                {post.frontmatter.tags.map((tag, index) => (
                  <React.Fragment key={tag}>
                    <Link to={getSearchLink(searchLink, tag)}>{tag}</Link>
                    {index !== post.frontmatter.tags.length - 1 && " 、"}
                  </React.Fragment>
                ))}{" "}
                」
              </span>
              <span className={styles.editMd}>
                / <a href={contentUrl + slug.replace(postPath, '') + 'index.md'}>Edit on Github <span role="img" aria-label="edit">✏️</span></a>
              </span>
            </small>
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
        </div>
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
        postPath
        contentUrl
        menu {
          search {
            name
            link
          }
        }
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        tags
      }
    }
  }
`
