"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProjectAction } from "@/actions/projectActions";
import styles from "./ProjectsPage.module.css";

const emptyFormData = {
  clientId: "",
  name: "",
  description: "",
  hourlyRate: "",
};

function parseHourlyRateCents(value) {
  const text = String(value || "").trim();

  if (text === "") {
    return null;
  }

  const normalizedText = text.replace(/[$£€,\s]/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedText)) {
    return Number.NaN;
  }

  return Math.round(Number(normalizedText) * 100);
}

export default function ProjectInlineForm({ clients }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const hasClients = clients.length > 0;

  function openForm() {
    setFormData({
      ...emptyFormData,
      clientId: clients[0]?.id ? String(clients[0].id) : "",
    });
    setError(null);
    setIsOpen(true);
  }

  function closeForm() {
    setFormData(emptyFormData);
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

    const hourlyRateCents = parseHourlyRateCents(formData.hourlyRate);

    if (Number.isNaN(hourlyRateCents)) {
      setError("Hourly rate must be a valid amount, such as 75 or 75.50.");
      return;
    }

    startTransition(async () => {
      const result = await createProjectAction({
        clientId: formData.clientId,
        name: formData.name,
        description: formData.description,
        hourlyRateCents,
      });

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
      <button className={styles.primaryButton} type="button" onClick={openForm}>
        Add Project
      </button>
    );
  }

  return (
    <form className={styles.inlineForm} onSubmit={submitForm}>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Client</span>
          <select
            name="clientId"
            required
            value={formData.clientId}
            onChange={updateField}
            disabled={!hasClients}
          >
            {hasClients ? null : (
              <option value="">Add a client first</option>
            )}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Project name</span>
          <input
            name="name"
            required
            value={formData.name}
            onChange={updateField}
          />
        </label>
        <label className={`${styles.field} ${styles.fullWidth}`}>
          <span>Description</span>
          <textarea
            name="description"
            rows="2"
            value={formData.description}
            onChange={updateField}
          />
        </label>
        <label className={styles.field}>
          <span>Hourly rate</span>
          <input
            name="hourlyRate"
            inputMode="decimal"
            placeholder="75.00"
            value={formData.hourlyRate}
            onChange={updateField}
          />
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.formActions}>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={isPending || !hasClients}
        >
          {isPending ? "Saving..." : "Create"}
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
