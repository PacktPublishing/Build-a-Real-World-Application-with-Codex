"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import {
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
} from "@/lib/formatters";
import InvoiceActions from "./InvoiceActions";
import styles from "./InvoicesPage.module.css";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function sortInvoices(invoices, sortBy, sortDirection) {
  return [...invoices].sort((first, second) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    if (sortBy === "total") {
      return (first.totalCents - second.totalCents) * direction;
    }

    const firstDue = first.dueDate || "";
    const secondDue = second.dueDate || "";

    return firstDue.localeCompare(secondDue) * direction;
  });
}

export default function InvoicesTable({
  hasInvoices,
  invoices,
  initialFilters = {},
}) {
  const initialStatus = statusFilters.some(
    (filter) => filter.value === initialFilters.status,
  )
    ? initialFilters.status
    : "all";
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortDirection, setSortDirection] = useState("asc");
  const hasServerFilters = Boolean(
    initialFilters.status || initialFilters.clientId || initialFilters.projectId,
  );

  function clearClientFilters() {
    setStatusFilter("all");
    setSearchTerm("");
  }

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    if (initialFilters.clientId) {
      params.set("clientId", initialFilters.clientId);
    }

    if (initialFilters.projectId) {
      params.set("projectId", initialFilters.projectId);
    }

    const query = params.toString();

    return query.length > 0
      ? `/api/invoices/export?${query}`
      : "/api/invoices/export";
  }, [initialFilters.clientId, initialFilters.projectId, statusFilter]);

  const visibleInvoices = useMemo(() => {
    const query = normalizeSearch(searchTerm);
    const filteredInvoices = invoices.filter((invoice) => {
      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;
      const matchesSearch =
        query.length === 0 ||
        normalizeSearch(invoice.clientName).includes(query) ||
        normalizeSearch(invoice.invoiceNumber).includes(query) ||
        normalizeSearch(formatInvoiceNumber(invoice.invoiceNumber)).includes(
          query,
        );

      return matchesStatus && matchesSearch;
    });

    return sortInvoices(filteredInvoices, sortBy, sortDirection);
  }, [invoices, searchTerm, sortBy, sortDirection, statusFilter]);

  return (
    <div className={styles.panel}>
      <div className={styles.filterBar}>
        <div className={styles.statusFilters} aria-label="Invoice status">
          {statusFilters.map((filter) => (
            <button
              className={`${styles.filterButton} ${
                statusFilter === filter.value ? styles.activeFilter : ""
              }`}
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className={styles.searchField}>
          <span>Search</span>
          <input
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Client or invoice number"
            type="search"
            value={searchTerm}
          />
        </label>

        <div className={styles.sortControls}>
          <label className={styles.selectField}>
            <span>Sort by</span>
            <select
              onChange={(event) => setSortBy(event.target.value)}
              value={sortBy}
            >
              <option value="dueDate">Due date</option>
              <option value="total">Total amount</option>
            </select>
          </label>

          <button
            className={styles.secondaryButton}
            onClick={() =>
              setSortDirection((current) =>
                current === "asc" ? "desc" : "asc",
              )
            }
            type="button"
          >
            {sortDirection === "asc" ? "Ascending" : "Descending"}
          </button>

          <a className={styles.exportButton} href={exportHref}>
            Export CSV
          </a>
        </div>
      </div>

      {!hasInvoices ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            No invoices yet. Create your first invoice to get started.
          </p>
          <Link className={styles.primaryButton} href="/invoices/new">
            Create Invoice
          </Link>
        </div>
      ) : visibleInvoices.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            No invoices match the current filter.
          </p>
          {hasServerFilters ? (
            <Link className={styles.secondaryButton} href="/invoices">
              Clear Filter
            </Link>
          ) : (
            <button
              className={styles.secondaryButton}
              onClick={clearClientFilters}
              type="button"
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col">Client</th>
                <th scope="col">Project</th>
                <th scope="col">Issue date</th>
                <th scope="col">Due date</th>
                <th scope="col">Status</th>
                <th scope="col">Total</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td data-label="Invoice">
                    <strong className={styles.invoiceNumber}>
                      {formatInvoiceNumber(invoice.invoiceNumber)}
                    </strong>
                  </td>
                  <td data-label="Client">{invoice.clientName}</td>
                  <td data-label="Project">{invoice.projectName}</td>
                  <td data-label="Issue date">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td data-label="Due date">{formatDate(invoice.dueDate)}</td>
                  <td data-label="Status">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td data-label="Total">
                    {formatCurrency(invoice.totalCents, invoice.currency)}
                  </td>
                  <td data-label="Actions">
                    <InvoiceActions invoice={invoice} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
