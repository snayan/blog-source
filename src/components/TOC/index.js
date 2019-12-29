import React from "react"
import styles from "./index.module.css"

export default function TOC(props) {
  if (!props.tableOfContents) {
    return null
  }
  return (
    <div className={styles.tocContainer}>
      <p className={styles.tocTitle}>
        <strong>文章目录</strong>
      </p>
      <div
        className={styles.toc}
        dangerouslySetInnerHTML={{ __html: props.tableOfContents }}
      />
    </div>
  )
}
