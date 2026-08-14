import Link from "next/link";

import { formatCurrency, formatDate, formatInvoiceNumber } from "@/lib/formatters";
import {
  getDashboardSummary,
  getMonthlyRevenue,
  getOverdueInvoices,
} from "@/lib/services";
import RevenueChart from "./RevenueChart";
import styles from "./Dashboard.module.css";

export default function DashboardPage() {
  const summary = getDashboardSummary();
  const monthlyRevenue = getMonthlyRevenue();
  const overdueInvoices = getOverdueInvoices();

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Dashboard</p>
          <h1 className={styles.title}>Business overview</h1>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <p className={styles.cardLabel}>Total Outstanding</p>
          <p className={styles.cardValue}>
            {formatCurrency(summary.totalOutstandingCents)}
          </p>
        </article>

        <article className={styles.summaryCard}>
          <p className={styles.cardLabel}>Paid This Month</p>
          <p className={styles.cardValue}>
            {formatCurrency(summary.totalPaidThisMonthCents)}
          </p>
        </article>

        <article className={styles.summaryCard}>
          <p className={styles.cardLabel}>Overdue Invoices</p>
          <p
            className={`${styles.cardValue} ${
              summary.overdueCount > 0 ? styles.dangerValue : ""
            }`}
          >
            {summary.overdueCount}
          </p>
        </article>

        <article className={styles.summaryCard}>
          <p className={styles.cardLabel}>Top Client</p>
          <p className={styles.cardValue}>
            {summary.topClientByRevenue || "No paid invoices"}
          </p>
        </article>
      </div>

      <section className={styles.panel} aria-labelledby="revenue-heading">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Revenue</p>
            <h2 id="revenue-heading" className={styles.sectionTitle}>
              Last 6 months
            </h2>
          </div>
        </div>
        <RevenueChart data={monthlyRevenue} />
      </section>

      <section className={styles.panel} aria-labelledby="overdue-heading">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Invoices</p>
            <h2 id="overdue-heading" className={styles.sectionTitle}>
              Overdue invoices
            </h2>
          </div>
        </div>

        {overdueInvoices.length === 0 ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No overdue invoices</h3>
            <p className={styles.emptyText}>
              Everything is current. There are no overdue balances to chase.
            </p>
          </div>
        ) : (
          <div className={styles.overdueList}>
            {overdueInvoices.map((invoice) => {
              const amountDueCents = invoice.totalCents - invoice.paidCents;

              return (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className={styles.overdueRow}
                >
                  <div className={styles.invoiceIdentity}>
                    <span className={styles.clientName}>{invoice.clientName}</span>
                    <span className={styles.invoiceNumber}>
                      {formatInvoiceNumber(invoice.invoiceNumber)}
                    </span>
                  </div>
                  <div className={styles.invoiceMeta}>
                    <span>{formatDate(invoice.dueDate)}</span>
                    <strong>{formatCurrency(amountDueCents, invoice.currency)}</strong>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
