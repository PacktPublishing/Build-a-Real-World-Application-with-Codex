"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createClientAction,
  updateClientAction,
} from "@/actions/clientActions";
import styles from "./ClientsPage.module.css";

const emptyFormData = {
  name: "",
  company: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

function clientToFormData(client) {
  return {
    name: client?.name || "",
    company: client?.company || "",
    email: client?.email || "",
    phone: client?.phone || "",
    address: client?.address || "",
    notes: client?.notes || "",
  };
}

export default function ClientInlineForm({ mode, client = null }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(() => (
    mode === "edit" ? clientToFormData(client) : emptyFormData
  ));
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = mode === "edit";

  function openForm() {
    setFormData(isEdit ? clientToFormData(client) : emptyFormData);
    setError(null);
    setIsOpen(true);
  }

  function closeForm() {
    setFormData(isEdit ? clientToFormData(client) : emptyFormData);
    setError(null);
    setIsOpen(false);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function submitForm(event) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateClientAction(client.id, formData)
        : await createClientAction(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      setFormData(emptyFormData);
      router.refresh();
    });
  }

  if (!isOpen) {
    return (
      <button
        className={isEdit ? styles.secondaryButton : styles.primaryButton}
        type="button"
        onClick={openForm}
      >
        {isEdit ? "Edit" : "Add Client"}
      </button>
    );
  }

  return (
    <form
      className={`${styles.inlineForm} ${isEdit ? styles.editForm : ""}`}
      onSubmit={submitForm}
    >
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Name</span>
          <input
            name="name"
            required
            value={formData.name}
            onChange={updateField}
          />
        </label>
        <label className={styles.field}>
          <span>Company</span>
          <input
            name="company"
            value={formData.company}
            onChange={updateField}
          />
        </label>
        <label className={styles.field}>
          <span>Email</span>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={updateField}
          />
        </label>
        <label className={styles.field}>
          <span>Phone</span>
          <input
            name="phone"
            value={formData.phone}
            onChange={updateField}
          />
        </label>
        <label className={`${styles.field} ${styles.fullWidth}`}>
          <span>Address</span>
          <textarea
            name="address"
            rows="2"
            value={formData.address}
            onChange={updateField}
          />
        </label>
        <label className={`${styles.field} ${styles.fullWidth}`}>
          <span>Notes</span>
          <textarea
            name="notes"
            rows="2"
            value={formData.notes}
            onChange={updateField}
          />
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.formActions}>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Saving..." : isEdit ? "Save" : "Create"}
        </button>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={closeForm}
          disabled={isPending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
