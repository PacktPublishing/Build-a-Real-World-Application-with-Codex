import { getInvoices } from "@/lib/services";
import InvoicesTable from "./InvoicesTable";
import styles from "./InvoicesPage.module.css";

function getSearchParam(searchParams, name) {
  const value = searchParams?.[name];
  const stringValue = Array.isArray(value) ? value[0] : value;

  if (!stringValue || stringValue === "all") {
    return undefined;
  }

  return stringValue;
}

export default async function InvoicesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const filters = {
    status: getSearchParam(resolvedSearchParams, "status"),
    clientId: getSearchParam(resolvedSearchParams, "clientId"),
    projectId: getSearchParam(resolvedSearchParams, "projectId"),
  };
  const invoices = getInvoices(filters);
  const hasInvoices = getInvoices().length > 0;

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Invoices</p>
          <h1 className={styles.title}>Invoice ledger</h1>
        </div>
      </div>

      <InvoicesTable
        hasInvoices={hasInvoices}
        invoices={invoices}
        initialFilters={filters}
      />
    </section>
  );
}
