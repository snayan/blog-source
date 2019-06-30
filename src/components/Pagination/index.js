import React from "react"
import { StaticQuery, graphql, Link } from "gatsby"
import styles from "./index.module.css"

const Pagination = props => {
  const { total, pn } = props

  return (
    <StaticQuery
      query={paginationQuery}
      render={data => {
        const limit = data.site.siteMetadata.postLimit
        const home = data.site.siteMetadata.menu.home.link
        const archive = data.site.siteMetadata.menu.archive.link
        const start = pn * limit
        const end = start + limit
        const previous = start >= limit
        const next = end < total

        return (
          <nav className={styles.footerNav}>
            {previous && (
              <Link
                className={styles.previous}
                to={`${home}?pn=${pn - 1}`}
                rel="prev"
              >
                « 上一页
              </Link>
            )}
            <Link to={archive}>文章归档</Link>
            {next && (
              <Link
                className={styles.next}
                to={`${home}?pn=${pn + 1}`}
                rel="next"
              >
                下一页 »
              </Link>
            )}
          </nav>
        )
      }}
    />
  )
}

const paginationQuery = graphql`
  query PaginationQuery {
    site {
      siteMetadata {
        postLimit
        menu {
          home {
            name
            link
          }
          archive {
            name
            link
          }
        }
      }
    }
  }
`

export default Pagination
