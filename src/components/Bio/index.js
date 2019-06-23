/**
 * Bio component that queries for data
 * with Gatsby's StaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/static-query/
 */

import React from "react"
import { StaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"
import Icon from "../Icon"
import { getIcon } from "../../utils"
import styles from "./index.module.css"

function Bio() {
  return (
    <StaticQuery
      query={bioQuery}
      render={data => {
        const { title, belief, author, menu, social } = data.site.siteMetadata
        const navItems = Object.keys(menu)
        const socialItems = Object.keys(social)

        return (
          <div className={styles.bio}>
            <div className={styles.author}>
              <Image
                fixed={data.avatar.childImageSharp.fixed}
                alt={author}
                style={{
                  width: 70,
                  height: 70,
                  display: "block",
                }}
                imgStyle={{
                  borderRadius: `50%`,
                }}
              />
              <h1>{author}</h1>
            </div>
            <p
              className={styles.belief}
              dangerouslySetInnerHTML={{ __html: belief }}
            />
            <nav className={styles.menu}>
              <ul>
                {navItems.map(item => {
                  return (
                    <li key={item}>
                      <a href={menu[item].link}>{menu[item].name}</a>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className={styles.contacts}>
              <ul>
                {socialItems.map(item => {
                  return (
                    <li key={item}>
                      <a>
                        <Icon icon={getIcon(item)} />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
            <footer>© {new Date().getFullYear()} All rights reserved.</footer>
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
        fixed(width: 75, height: 75) {
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
          note {
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
