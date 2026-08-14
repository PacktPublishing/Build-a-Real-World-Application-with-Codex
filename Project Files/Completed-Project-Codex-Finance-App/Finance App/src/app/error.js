"use client";

import { useRouter } from "next/navigation";
import styles from "./Error.module.css";

export default function Error() {
  const router = useRouter();

  return (
    <section className={styles.errorState} role="alert">
      <p className={styles.message}>
        Something went wrong. Please try refreshing the page.
      </p>
      <button
        className={styles.button}
        onClick={() => router.refresh()}
        type="button"
      >
        Refresh
      </button>
    </section>
  );
}
