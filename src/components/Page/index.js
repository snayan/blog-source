import React from "react"
import Layout from "../Layout"
import Bio from "../Bio"
import styles from "./index.module.css"

class BlogIndex extends React.Component {

  render() {
    const { location, title, children } = this.props

    return (
      <Layout location={location} title={title}>
        <div className={styles.home}>
          <aside  className={styles.aside}>
            <Bio />
          </aside>
          <main className={styles.main}>{children}</main>
        </div>
      </Layout>
    )
  }
}

export default BlogIndex
