import { notFound } from "next/navigation";
import { getClients, getInvoiceById, getProjects } from "@/lib/services";
import InvoiceForm from "../../InvoiceForm";
import styles from "../../InvoicesPage.module.css";

export default async function EditInvoicePage({ params }) {
  const { invoiceId } = await params;
  const invoice = getInvoiceById(invoiceId);

  if (!invoice) {
    notFound();
  }

  const clients = getClients();
  const projects = getProjects();

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Invoices</p>
          <h1 className={styles.title}>Edit invoice</h1>
        </div>
      </div>

      <InvoiceForm
        mode="edit"
        invoice={invoice}
        clients={clients}
        projects={projects}
      />
    </section>
  );
}
