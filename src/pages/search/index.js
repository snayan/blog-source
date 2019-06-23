import React from "react"
import { Link, graphql } from "gatsby"
import Page from "../../components/Page"
import styles from "./index.module.css"

class Search extends React.Component {
  render() {
    return (
      <Page location={this.props.location} title="首页">
        <p>search</p>
      </Page>
    )
  }
}

export default Search