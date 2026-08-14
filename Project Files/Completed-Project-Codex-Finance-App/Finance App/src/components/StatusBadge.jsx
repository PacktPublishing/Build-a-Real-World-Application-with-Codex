import styles from "./StatusBadge.module.css";

const statusToneMap = {
  draft: "grey",
  sent: "blue",
  paid: "green",
  overdue: "red",
  void: "darkGrey",
  active: "green",
  paused: "yellow",
  completed: "blue",
  archived: "grey",
};

function formatStatusLabel(status) {
  return String(status)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").toLowerCase();
  const tone = statusToneMap[normalizedStatus] || "grey";

  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {formatStatusLabel(normalizedStatus)}
    </span>
  );
}
