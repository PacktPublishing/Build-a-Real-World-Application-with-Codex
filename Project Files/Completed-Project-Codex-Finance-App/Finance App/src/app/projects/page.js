import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { getClients, getProjects } from "@/lib/services";
import ProjectInlineForm from "./ProjectInlineForm";
import styles from "./ProjectsPage.module.css";

function groupProjectsByClient(projects) {
  const groups = new Map();

  for (const project of projects) {
    const group = groups.get(project.clientId) || {
      clientId: project.clientId,
      clientName: project.clientName,
      projects: [],
    };

    group.projects.push(project);
    groups.set(project.clientId, group);
  }

  return Array.from(groups.values()).sort((first, second) => (
    first.clientName.localeCompare(second.clientName)
  ));
}

export default function ProjectsPage() {
  const projects = getProjects();
  const clients = getClients();
  const projectGroups = groupProjectsByClient(projects);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Projects</p>
          <h1 className={styles.title}>Project ledger</h1>
        </div>
        <ProjectInlineForm clients={clients} />
      </div>

      <div className={styles.panel}>
        {projectGroups.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              No projects yet. Add your first project to get started.
            </p>
            <ProjectInlineForm clients={clients} />
          </div>
        ) : (
          <div className={styles.clientSections}>
            {projectGroups.map((group) => (
              <section className={styles.clientSection} key={group.clientId}>
                <header className={styles.clientHeader}>
                  <h2 className={styles.clientName}>{group.clientName}</h2>
                </header>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Project</th>
                        <th scope="col">Status</th>
                        <th scope="col">Total invoiced</th>
                        <th scope="col">Invoices</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.projects.map((project) => (
                        <tr key={project.id}>
                          <td data-label="Project">
                            <div className={styles.projectSummary}>
                              <strong className={styles.projectName}>
                                {project.name}
                              </strong>
                              {project.description ? (
                                <span className={styles.projectDescription}>
                                  {project.description}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td data-label="Status">
                            <StatusBadge status={project.status} />
                          </td>
                          <td data-label="Total invoiced">
                            {formatCurrency(project.totalInvoicedCents)}
                          </td>
                          <td data-label="Invoices">
                            <Link
                              className={styles.invoiceLink}
                              href={`/invoices?projectId=${project.id}`}
                            >
                              View invoices
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
