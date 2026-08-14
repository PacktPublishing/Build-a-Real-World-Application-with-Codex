"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createInvoiceAction,
  updateInvoiceAction,
} from "@/actions/invoiceActions";
import { formatCurrency } from "@/lib/formatters";
import styles from "./InvoiceForm.module.css";

const invoiceStatuses = ["draft", "sent", "paid", "overdue", "void"];

const emptyLineItem = {
  description: "",
  quantity: "1",
  unitPriceDollars: "",
};

function nextLineItemKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function createLineItem(overrides = {}) {
  return {
    key: nextLineItemKey(),
    ...emptyLineItem,
    ...overrides,
  };
}

function centsToDollars(cents) {
  if (cents === undefined || cents === null || cents === "") {
    return "";
  }

  return (Number(cents) / 100).toFixed(2);
}

function dollarsToCents(value) {
  const text = String(value || "").trim();

  if (text === "") {
    return 0;
  }

  const normalizedText = text.replace(/[$£€,\s]/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedText)) {
    return Number.NaN;
  }

  return Math.round(Number(normalizedText) * 100);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialClientId(invoice, clients) {
  if (invoice?.client?.id) {
    return String(invoice.client.id);
  }

  return clients[0]?.id ? String(clients[0].id) : "";
}

function getInitialProjectId(invoice, projects, clientId) {
  if (invoice?.projectId) {
    return String(invoice.projectId);
  }

  const firstProject = projects.find(
    (project) => String(project.clientId) === String(clientId),
  );

  return firstProject?.id ? String(firstProject.id) : "";
}

function invoiceToLineItems(invoice) {
  if (!invoice?.lineItems?.length) {
    return [createLineItem()];
  }

  return invoice.lineItems.map((item) =>
    createLineItem({
      description: item.description || "",
      quantity: String(item.quantity ?? "1"),
      unitPriceDollars: centsToDollars(item.unitPriceCents),
    }),
  );
}

function getLineTotalCents(item) {
  const quantity = Number(item.quantity || 0);
  const unitPriceCents = dollarsToCents(item.unitPriceDollars);

  if (!Number.isFinite(quantity) || Number.isNaN(unitPriceCents)) {
    return 0;
  }

  return Math.round(quantity * unitPriceCents);
}

export default function InvoiceForm({
  mode,
  invoice = null,
  clients,
  projects,
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const initialClientId = getInitialClientId(invoice, clients);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [selectedProjectId, setSelectedProjectId] = useState(() =>
    getInitialProjectId(invoice, projects, initialClientId),
  );
  const [invoiceNumber, setInvoiceNumber] = useState(
    invoice?.invoiceNumber || "",
  );
  const [issueDate, setIssueDate] = useState(
    invoice?.issueDate || getTodayDate(),
  );
  const [dueDate, setDueDate] = useState(invoice?.dueDate || "");
  const [status, setStatus] = useState(invoice?.status || "draft");
  const [lineItems, setLineItems] = useState(() => invoiceToLineItems(invoice));
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const availableProjects = useMemo(
    () =>
      projects.filter(
        (project) => String(project.clientId) === String(selectedClientId),
      ),
    [projects, selectedClientId],
  );
  const totalCents = useMemo(
    () =>
      lineItems.reduce((sum, item) => sum + getLineTotalCents(item), 0),
    [lineItems],
  );
  const hasClients = clients.length > 0;
  const hasProjects = availableProjects.length > 0;

  function updateClient(event) {
    const nextClientId = event.target.value;
    const nextProjects = projects.filter(
      (project) => String(project.clientId) === String(nextClientId),
    );
    const selectedProjectStillValid = nextProjects.some(
      (project) => String(project.id) === String(selectedProjectId),
    );

    setSelectedClientId(nextClientId);
    setSelectedProjectId(
      selectedProjectStillValid ? selectedProjectId : String(nextProjects[0]?.id || ""),
    );
  }

  function updateLineItem(key, field, value) {
    setLineItems((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addLineItem() {
    setLineItems((current) => [...current, createLineItem()]);
  }

  function removeLineItem(key) {
    setLineItems((current) => {
      if (current.length === 1) {
        return [createLineItem()];
      }

      return current.filter((item) => item.key !== key);
    });
  }

  function buildPayload() {
    const parsedLineItems = lineItems.map((item, index) => {
      const unitPriceCents = dollarsToCents(item.unitPriceDollars);
      const quantity = Number(item.quantity);

      if (Number.isNaN(unitPriceCents)) {
        throw new Error(`Line item ${index + 1} unit price must be a valid dollar amount.`);
      }

      return {
        description: item.description,
        quantity,
        unitPriceCents,
      };
    });

    return {
      projectId: selectedProjectId,
      invoiceNumber,
      status,
      issueDate,
      dueDate,
      currency: invoice?.currency || "USD",
      paidCents: status === "paid" ? totalCents : 0,
      lineItems: parsedLineItems,
    };
  }

  function submitForm(event) {
    event.preventDefault();
    setError(null);

    let payload;

    try {
      payload = buildPayload();
    } catch (submissionError) {
      setError(submissionError.message);
      return;
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateInvoiceAction(invoice.id, payload)
        : await createInvoiceAction(payload);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/invoices");
      router.refresh();
    });
  }

  function cancelForm() {
    router.push("/invoices");
  }

  return (
    <form className={styles.form} onSubmit={submitForm}>
      <div className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Invoice</p>
            <h2 className={styles.sectionTitle}>Details</h2>
          </div>
        </div>

        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Client</span>
            <select
              value={selectedClientId}
              onChange={updateClient}
              disabled={!hasClients || isPending}
              required
            >
              {hasClients ? null : <option value="">Add a client first</option>}
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Project</span>
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              disabled={!hasProjects || isPending}
              required
            >
              {hasProjects ? null : (
                <option value="">No projects for this client</option>
              )}
              {availableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Invoice number</span>
            <input
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              disabled={isPending}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              disabled={isPending}
            >
              {invoiceStatuses.map((invoiceStatus) => (
                <option key={invoiceStatus} value={invoiceStatus}>
                  {invoiceStatus}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Issue date</span>
            <input
              type="date"
              value={issueDate}
              onChange={(event) => setIssueDate(event.target.value)}
              disabled={isPending}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={isPending}
            />
          </label>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Line items</p>
            <h2 className={styles.sectionTitle}>Billable work</h2>
          </div>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={addLineItem}
            disabled={isPending}
          >
            Add Line Item
          </button>
        </div>

        <div className={styles.lineItems}>
          <div className={styles.lineItemHeader} aria-hidden="true">
            <span>Description</span>
            <span>Quantity</span>
            <span>Unit price</span>
            <span>Line total</span>
            <span>Actions</span>
          </div>

          {lineItems.map((item, index) => (
            <div className={styles.lineItemRow} key={item.key}>
              <label className={styles.lineField}>
                <span>Description</span>
                <input
                  value={item.description}
                  onChange={(event) =>
                    updateLineItem(item.key, "description", event.target.value)
                  }
                  placeholder={`Line item ${index + 1}`}
                  disabled={isPending}
                  required
                />
              </label>

              <label className={styles.lineField}>
                <span>Quantity</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(event) =>
                    updateLineItem(item.key, "quantity", event.target.value)
                  }
                  disabled={isPending}
                  required
                />
              </label>

              <label className={styles.lineField}>
                <span>Unit price</span>
                <input
                  inputMode="decimal"
                  min="0"
                  placeholder="125.00"
                  step="0.01"
                  type="number"
                  value={item.unitPriceDollars}
                  onChange={(event) =>
                    updateLineItem(
                      item.key,
                      "unitPriceDollars",
                      event.target.value,
                    )
                  }
                  disabled={isPending}
                  required
                />
              </label>

              <output className={styles.lineTotal}>
                <span>Line total</span>
                <strong>{formatCurrency(getLineTotalCents(item), "USD")}</strong>
              </output>

              <button
                className={styles.dangerButton}
                type="button"
                onClick={() => removeLineItem(item.key)}
                disabled={isPending}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className={styles.totalRow}>
          <span>Total</span>
          <strong>{formatCurrency(totalCents, "USD")}</strong>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.formActions}>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={isPending || !hasClients || !hasProjects}
        >
          {isPending ? "Saving..." : isEdit ? "Save Invoice" : "Create Invoice"}
        </button>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={cancelForm}
          disabled={isPending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
