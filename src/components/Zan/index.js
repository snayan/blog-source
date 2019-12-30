import React, { useState } from "react"
import { useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"
import styles from "./index.module.css"

function ZanModal(props) {
  const { zan } = useStaticQuery(
    graphql`
      query {
        zan: file(absolutePath: { regex: "/zan.jpeg/" }) {
          childImageSharp {
            fixed(width: 400, height: 400) {
              ...GatsbyImageSharpFixed
            }
          }
        }
      }
    `
  )

  if (!props.show) {
    return null
  }

  return (
    <div className={styles["zanPic"]}>
      <Image
        fixed={zan.childImageSharp.fixed}
        alt="zan"
        style={{
          width: 200,
          height: 200,
        }}
      />
    </div>
  )
}

export default function Zan(props) {
  const [showZan, setShowZan] = useState(false)
  const { ableZan } = props

  if (!ableZan) {
    return null
  }

  const toggleZanPic = () => {
    setShowZan(!showZan)
  }

  return (
    <div className={styles["zan"]}>
      <p className={styles["zanDesc"]}>若有收获，小额赞赏</p>
      <button className={styles["zanButton"]} onClick={toggleZanPic}>
        赞
      </button>
      <ZanModal show={showZan} onToggle={toggleZanPic} />
    </div>
  )
}
