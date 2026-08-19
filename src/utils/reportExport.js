import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportReportPdf = ({ title, subtitle, columns, rows, summaryLines = [] }) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Nova ERP", 14, 18);
  doc.setFontSize(12);
  doc.text(title, 14, 26);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(subtitle, 14, 32);
    doc.setTextColor(0);
  }

  let startY = subtitle ? 38 : 34;

  if (summaryLines.length > 0) {
    doc.setFontSize(10);
    summaryLines.forEach((line, i) => {
      doc.text(line, 14, startY + i * 6);
    });
    startY += summaryLines.length * 6 + 6;
  }

  autoTable(doc, {
    startY,
    head: [columns],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
};

export const exportReportCsv = ({ title, columns, rows }) => {
  const csvRows = [columns.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))];
  const csvContent = csvRows.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/\s+/g, "_")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};