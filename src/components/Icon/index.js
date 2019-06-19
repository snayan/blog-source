import React from 'react';
import styles from './index.module.css';

const Icon = ({ icon }) => (
  <svg className={styles.icon} viewBox={icon.viewBox}>
    <path d={icon.path} />
  </svg>
);

export default Icon;
