import React from "react"
import { Link, graphql } from "gatsby"
import Page from "../../components/Page"

class About extends React.Component {
  render() {
    return (
      <Page location={this.props.location} title="首页">
        <p>About</p>
      </Page>
    )
  }
}

export default About