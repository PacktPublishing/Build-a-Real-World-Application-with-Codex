"use client";

import styles from "./Error.module.css";

export default function InvoicesError({ unstable_retry }) {
  return (
    <section className={styles.errorState} role="alert">
      <p className={styles.message}>
        Unable to load invoices. Please try again.
      </p>
      <button
        className={styles.button}
        onClick={() => unstable_retry()}
        type="button"
      >
        Try Again
      </button>
    </section>
  );
}
