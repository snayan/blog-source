import React from "react"
import styles from "./index.module.css"

const Slider = props => {
  let content = (
    <>
      <div className={styles.dot} />
      <div className={styles.dot} />
      <div className={styles.dot} />
    </>
  )
  if (props.opened) {
    content = "×"
  }
  return (
    <div className={`${styles.slider} ${props.opened && styles.opened}`} onClick={props.onClick}>
      <div className={styles.circle} >
        {content}
      </div>
    </div>
  )
}
export default Slider
