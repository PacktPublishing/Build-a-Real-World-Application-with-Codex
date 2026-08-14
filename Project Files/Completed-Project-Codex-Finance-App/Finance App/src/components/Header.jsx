"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";

function getPageTitle(pathname) {
  if (pathname === "/") {
    return "Dashboard";
  }

  if (pathname === "/clients/new") {
    return "New Client";
  }

  if (pathname.startsWith("/clients/") && pathname.endsWith("/edit")) {
    return "Edit Client";
  }

  if (pathname.startsWith("/clients/")) {
    return "Client Details";
  }

  if (pathname === "/clients") {
    return "Clients";
  }

  if (pathname === "/projects/new") {
    return "New Project";
  }

  if (pathname.startsWith("/projects/") && pathname.endsWith("/edit")) {
    return "Edit Project";
  }

  if (pathname.startsWith("/projects/")) {
    return "Project Details";
  }

  if (pathname === "/projects") {
    return "Projects";
  }

  if (pathname === "/invoices/new") {
    return "New Invoice";
  }

  if (pathname.startsWith("/invoices/") && pathname.endsWith("/edit")) {
    return "Edit Invoice";
  }

  if (pathname.startsWith("/invoices/")) {
    return "Invoice Details";
  }

  if (pathname === "/invoices") {
    return "Invoices";
  }

  return "Invoice Tracker";
}

export default function Header() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>Freelancer Bookkeeping</p>
        <h1 className={styles.title}>{getPageTitle(pathname)}</h1>
      </div>

      <Link href="/invoices/new" className={styles.action}>
        New Invoice
      </Link>
    </header>
  );
}
