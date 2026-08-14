"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateInvoiceStatusAction } from "@/actions/invoiceActions";
import DeleteConfirmModal from "./DeleteConfirmModal";
import styles from "./InvoiceActions.module.css";

export default function InvoiceActions({ invoice }) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  if (!invoice) {
    return null;
  }

  const canMarkPaid = invoice.status !== "paid" && invoice.status !== "void";

  function markAsPaid() {
    setError(null);

    startTransition(async () => {
      const result = await updateInvoiceStatusAction(invoice.id, "paid");

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <>
      <div className={styles.actions}>
        <Link
          className={styles.tertiaryButton}
          href={`/invoices/${invoice.id}`}
        >
          View
        </Link>
        <Link
          className={styles.secondaryButton}
          href={`/invoices/${invoice.id}/edit`}
        >
          Edit
        </Link>
        {canMarkPaid ? (
          <button
            className={styles.primaryButton}
            type="button"
            onClick={markAsPaid}
            disabled={isPending}
          >
            {isPending ? "Updating..." : "Mark as Paid"}
          </button>
        ) : null}
        <button
          className={styles.dangerButton}
          type="button"
          onClick={() => {
            setError(null);
            setIsDeleteOpen(true);
          }}
          disabled={isPending}
        >
          Delete
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {isDeleteOpen ? (
        <DeleteConfirmModal
          invoice={invoice}
          onClose={() => setIsDeleteOpen(false)}
        />
      ) : null}
    </>
  );
}
