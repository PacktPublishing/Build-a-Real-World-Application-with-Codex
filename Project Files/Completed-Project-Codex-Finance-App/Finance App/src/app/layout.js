import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

import styles from "./layout.module.css";

export const metadata = {
  title: "Invoice Tracker",
  description: "Freelancer invoice tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className={styles.shell}>
          <Sidebar />
          <div className={styles.content}>
            <Header />
            <main className={styles.main}>{children}</main>
          </div>
        </div>
        <Script src="http://localhost:5000/iframe-script" />
      </body>
    </html>
  );
}
