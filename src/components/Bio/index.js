/**
 * Bio component that queries for data
 * with Gatsby's StaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/static-query/
 */

import React from "react"
import { StaticQuery, graphql, Link } from "gatsby"
import Image from "gatsby-image"
import Icon from "../Icon"
import { getIcon } from "../../utils"
import styles from "./index.module.css"

function Bio() {
  return (
    <StaticQuery
      query={bioQuery}
      render={data => {
        const { belief, author, menu, social } = data.site.siteMetadata
        const navItems = Object.keys(menu)
        const socialItems = Object.keys(social)

        return (
          <div>
            <div className={styles.author}>
              <Image
                fixed={data.avatar.childImageSharp.fixed}
                alt={author}
                className={styles.avatar}
                imgStyle={{ borderRadius: `50%` }}
              />
              <div className={styles.info}>
                <h1 className={styles.name}>{author}</h1>
                <p
                  className={styles.beliefMobile}
                  dangerouslySetInnerHTML={{ __html: belief }}
                />
              </div>
            </div>
            <p
              className={styles.belief}
              dangerouslySetInnerHTML={{ __html: belief }}
            />
            <nav className={styles.menu}>
              {navItems.map(item => {
                return (
                  <div key={item}>
                    <Link to={menu[item].link}>
                      {menu[item].name}
                    </Link>
                  </div>
                )
              })}
            </nav>
            <nav className={styles.contacts}>
              {socialItems.map(item => {
                return (
                  <div key={item}>
                    <a href={social[item]}>
                      <Icon icon={getIcon(item)} />
                    </a>
                  </div>
                )
              })}
            </nav>
            <footer className={styles.footer}>
              © {new Date().getFullYear()} All rights reserved.
            </footer>
          </div>
        )
      }}
    />
  )
}

const bioQuery = graphql`
  query BioQuery {
    avatar: file(absolutePath: { regex: "/my.jpg/" }) {
      childImageSharp {
        fixed(width: 70, height: 70) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    site {
      siteMetadata {
        title
        belief
        author
        menu {
          home {
            name
            link
          }
          archive {
            name
            link
          }
          search {
            name
            link
          }
          about {
            name
            link
          }
        }
        social {
          email
          github
        }
      }
    }
  }
`

export default Bio
