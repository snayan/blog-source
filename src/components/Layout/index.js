import React from "react"
import { Link } from "gatsby"
import Bio from "../Bio"
import Slider from "../Slider"
import styles from "./index.module.css"

class Layout extends React.Component {
  state = { opened: false }

  toggleOpenSlider = () => {
    this.setState(preState => {
      return { opened: !preState.opened }
    })
  }

  render() {
    const { location, title, children } = this.props
    const rootPath = `${__PATH_PREFIX__}/`

    return (
      <div className={`${styles.layout} ${this.state.opened && styles.opened}`}>
        <aside className={styles.aside}>
          <Bio />
        </aside>
        <main className={styles.main}>
          <div className={styles.content}>{children}</div>
          <div className={styles.overlay}></div>
          <Slider onClick={this.toggleOpenSlider} opened={this.state.opened} />
        </main>
      </div>
    )
  }
}

export default Layout
