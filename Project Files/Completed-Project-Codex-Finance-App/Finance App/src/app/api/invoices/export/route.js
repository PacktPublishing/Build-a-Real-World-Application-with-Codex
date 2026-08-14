import { getInvoices } from "@/lib/services";

const csvColumns = [
  "Invoice Number",
  "Client",
  "Project",
  "Issue Date",
  "Due Date",
  "Status",
  "Total",
];

function getFilter(searchParams, name) {
  const value = searchParams.get(name);

  if (value === null || value === "" || value === "all") {
    return undefined;
  }

  return value;
}

function formatCsvDate(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function formatCsvTotal(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

function escapeCsvField(value) {
  const text = String(value ?? "");

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function serializeCsv(rows) {
  return rows
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const invoices = getInvoices({
    status: getFilter(searchParams, "status"),
    clientId: getFilter(searchParams, "clientId"),
    projectId: getFilter(searchParams, "projectId"),
  });

  const rows = [
    csvColumns,
    ...invoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.clientName,
      invoice.projectName,
      formatCsvDate(invoice.issueDate),
      formatCsvDate(invoice.dueDate),
      invoice.status,
      formatCsvTotal(invoice.totalCents),
    ]),
  ];

  return new Response(`${serializeCsv(rows)}\r\n`, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="invoices.csv"',
    },
  });
}
