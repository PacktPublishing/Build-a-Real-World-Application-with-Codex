import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { updateInvoiceStatusAction } from "@/actions/invoiceActions";
import StatusBadge from "@/components/StatusBadge";
import {
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
} from "@/lib/formatters";
import { getInvoiceById } from "@/lib/services";
import styles from "./InvoiceDetailPage.module.css";

function formatQuantity(quantity) {
  const value = Number(quantity);

  if (!Number.isFinite(value)) {
    return quantity;
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function ContactLine({ children }) {
  if (!children) {
    return null;
  }

  return <p className={styles.contactLine}>{children}</p>;
}

function isPositiveInteger(value) {
  return /^[1-9]\d*$/.test(String(value));
}

function createStatusAction(invoiceId, status) {
  return async function updateStatus() {
    "use server";

    const result = await updateInvoiceStatusAction(invoiceId, status);

    if (result.error) {
      throw new Error(result.error);
    }

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
  };
}

export default async function InvoiceDetailPage({ params }) {
  const { invoiceId } = await params;

  if (!isPositiveInteger(invoiceId)) {
    notFound();
  }

  const invoice = getInvoiceById(invoiceId);

  if (!invoice) {
    notFound();
  }

  const invoiceNumber = formatInvoiceNumber(invoice.invoiceNumber);
  const markSentAction = createStatusAction(invoice.id, "sent");
  const markPaidAction = createStatusAction(invoice.id, "paid");
  const voidAction = createStatusAction(invoice.id, "void");
  const canMarkSent = invoice.status === "draft";
  const canMarkPaid = invoice.status === "sent" || invoice.status === "overdue";
  const canVoid = invoice.status !== "void" && invoice.status !== "paid";
  const balanceDueCents = Math.max(
    invoice.totalCents - invoice.paidCents,
    0,
  );

  return (
    <section className={styles.page}>
      <div className={styles.actions} aria-label="Invoice actions">
        <Link className={styles.secondaryLink} href="/invoices">
          Back to Invoices
        </Link>
        {canMarkSent ? (
          <form action={markSentAction}>
            <button className={styles.secondaryButton} type="submit">
              Mark as Sent
            </button>
          </form>
        ) : null}
        {canMarkPaid ? (
          <form action={markPaidAction}>
            <button className={styles.primaryButton} type="submit">
              Mark as Paid
            </button>
          </form>
        ) : null}
        {canVoid ? (
          <form action={voidAction}>
            <button className={styles.dangerButton} type="submit">
              Void
            </button>
          </form>
        ) : null}
        <Link
          className={styles.primaryLink}
          href={`/invoices/${invoice.id}/edit`}
        >
          Edit
        </Link>
      </div>

      <article className={styles.document}>
        <header className={styles.documentHeader}>
          <div>
            <p className={styles.brandLabel}>Freelancer Invoice</p>
            <p className={styles.tagline}>Professional Services</p>
          </div>

          <div className={styles.invoiceMeta}>
            <p className={styles.invoiceLabel}>Invoice</p>
            <h1 className={styles.invoiceNumber}>{invoiceNumber}</h1>
            <dl className={styles.metaList}>
              <div>
                <dt>Issue date</dt>
                <dd>{formatDate(invoice.issueDate)}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{formatDate(invoice.dueDate)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={invoice.status} />
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <div className={styles.parties}>
          <section className={styles.billTo} aria-labelledby="bill-to-heading">
            <h2 id="bill-to-heading">Bill To:</h2>
            <div className={styles.clientBlock}>
              <p className={styles.clientName}>{invoice.client.name}</p>
              <ContactLine>{invoice.client.company}</ContactLine>
              <ContactLine>{invoice.client.email}</ContactLine>
              {invoice.client.address ? (
                <p className={styles.address}>{invoice.client.address}</p>
              ) : null}
            </div>
          </section>

          <section className={styles.project} aria-labelledby="project-heading">
            <h2 id="project-heading">Project</h2>
            <p className={styles.projectName}>{invoice.project.name}</p>
            <p className={styles.projectNote}>
              This invoice covers work completed for {invoice.project.name}.
            </p>
          </section>
        </div>

        <section className={styles.lineItems} aria-labelledby="items-heading">
          <h2 id="items-heading" className={styles.sectionTitle}>
            Services
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Description</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Unit Price</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{formatQuantity(item.quantity)}</td>
                    <td>
                      {formatCurrency(item.unitPriceCents, invoice.currency)}
                    </td>
                    <td>
                      {formatCurrency(item.lineTotalCents, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan="3">
                    Subtotal
                  </th>
                  <td>{formatCurrency(invoice.subtotalCents, invoice.currency)}</td>
                </tr>
                <tr className={styles.totalRow}>
                  <th scope="row" colSpan="3">
                    Total
                  </th>
                  <td>{formatCurrency(invoice.totalCents, invoice.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className={styles.payment} aria-labelledby="payment-heading">
          <div>
            <h2 id="payment-heading">Payment</h2>
            <p className={styles.paymentDueDate}>
              Payment due by {formatDate(invoice.dueDate)}
            </p>
          </div>
          <div className={styles.amountDue}>
            <p>Total amount due</p>
            <strong>{formatCurrency(balanceDueCents, invoice.currency)}</strong>
          </div>
        </section>

        {invoice.notes ? (
          <section className={styles.notes} aria-labelledby="notes-heading">
            <h2 id="notes-heading">Notes</h2>
            <p>{invoice.notes}</p>
          </section>
        ) : null}
      </article>
    </section>
  );
}
