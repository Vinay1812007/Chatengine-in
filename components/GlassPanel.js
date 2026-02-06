import styles from '../styles/glass.module.css';

const GlassPanel = ({ children, className = '' }) => (
  <section className={`${styles.glassPanel} ${className}`.trim()}>{children}</section>
);

export default GlassPanel;
