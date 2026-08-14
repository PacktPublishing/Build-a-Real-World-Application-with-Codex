import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { getClients } from "@/lib/services";
import ClientInlineForm from "./ClientInlineForm";
import styles from "./ClientsPage.module.css";

export default function ClientsPage() {
  const clients = getClients();

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Clients</p>
          <h1 className={styles.title}>Client accounts</h1>
        </div>
        <ClientInlineForm mode="create" />
      </div>

      <div className={styles.panel}>
        {clients.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              No clients yet. Add your first client to get started.
            </p>
            <ClientInlineForm mode="create" />
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Company</th>
                  <th scope="col">Email</th>
                  <th scope="col">Active projects</th>
                  <th scope="col">Unpaid</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td data-label="Name">
                      <strong className={styles.clientName}>{client.name}</strong>
                    </td>
                    <td data-label="Company">{client.company || "—"}</td>
                    <td data-label="Email">{client.email || "—"}</td>
                    <td data-label="Active projects">
                      <span className={styles.projectCount}>
                        <span>{client.activeProjectCount}</span>
                        <StatusBadge status="active" />
                      </span>
                    </td>
                    <td data-label="Unpaid">
                      {formatCurrency(client.totalUnpaidCents)}
                    </td>
                    <td data-label="Actions">
                      <ClientInlineForm mode="edit" client={client} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
