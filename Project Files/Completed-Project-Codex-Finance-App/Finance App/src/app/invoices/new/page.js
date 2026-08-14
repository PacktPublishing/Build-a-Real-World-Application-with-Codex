import { getClients, getProjects } from "@/lib/services";
import InvoiceForm from "../InvoiceForm";
import styles from "../InvoicesPage.module.css";

export default function NewInvoicePage() {
  const clients = getClients();
  const projects = getProjects();

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Invoices</p>
          <h1 className={styles.title}>Create invoice</h1>
        </div>
      </div>

      <InvoiceForm mode="create" clients={clients} projects={projects} />
    </section>
  );
}
