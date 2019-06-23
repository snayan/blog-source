import React from "react"
import { Link } from "gatsby"
import Bio from "../Bio"
import Slider from "../Slider"
import SEO from '../SEO'
import styles from "./index.module.css"

class Layout extends React.Component {
  state = { opened: false }

  get isHomePage() {
    const { location } = this.props
    const rootPath = `${__PATH_PREFIX__}/`
    return location.pathname === rootPath
  }

  toggleOpenSlider = () => {
    this.setState(preState => {
      return { opened: !preState.opened }
    })
  }

  render() {
    const { location, title, description, children } = this.props
    const rootPath = `${__PATH_PREFIX__}/`

    return (
      <div className={styles.layout}>
        <SEO title={title} description={description} />
        {children}
      </div>
    )
  }
}

export default Layout
