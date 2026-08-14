"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteInvoiceAction } from "@/actions/invoiceActions";
import { formatInvoiceNumber } from "@/lib/formatters";
import styles from "./DeleteConfirmModal.module.css";

function getInvoiceNumber(invoice) {
  return invoice?.invoice_number ?? invoice?.invoiceNumber ?? invoice?.id ?? "";
}

export default function DeleteConfirmModal({ invoice, onClose }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const invoiceNumber = formatInvoiceNumber(getInvoiceNumber(invoice));

  function confirmDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deleteInvoiceAction(invoice.id);

      if (result.error) {
        setError(result.error);
        return;
      }

      onClose();
      router.refresh();
    });
  }

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        aria-labelledby="delete-invoice-title"
        aria-modal="true"
        className={styles.modal}
        role="dialog"
      >
        <h2 className={styles.title} id="delete-invoice-title">
          Delete invoice
        </h2>
        <p className={styles.message}>
          Are you sure you want to delete invoice {invoiceNumber}?
        </p>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <button
            className={styles.dangerButton}
            type="button"
            onClick={confirmDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Confirm"}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
