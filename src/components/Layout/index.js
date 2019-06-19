import React from "react"
import { Link } from "gatsby"
import Bio from '../Bio';
import styles from './index.module.css';


class Layout extends React.Component {
  render() {
    const { location, title, children } = this.props
    const rootPath = `${__PATH_PREFIX__}/`

    return (
      <div className={styles.layout}>
        <aside className={styles.aside}>
          <Bio />
        </aside>
        <main className={styles.main}>
          <div>{children}</div>
        </main>
      </div>
    )
  }
}

export default Layout
