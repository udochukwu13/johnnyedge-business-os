"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function DownloadStatementPdfButton() {
  async function downloadPDF() {
    const element = document.getElementById("customer-statement");

    if (!element) return;

    const canvas = await html2canvas(element, {
  scale: 2,
  useCORS: true,
  backgroundColor: "#ffffff",
  onclone: (clonedDocument) => {
    const allElements = clonedDocument.querySelectorAll("*");

    allElements.forEach((el) => {
      const element = el as HTMLElement;

      element.style.color = "#000000";
      element.style.backgroundColor = "#ffffff";
      element.style.borderColor = "#dddddd";
    });
  },
});

    const imageData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const width = pdf.internal.pageSize.getWidth();

    const height =
      (canvas.height * width) / canvas.width;

    pdf.addImage(
      imageData,
      "PNG",
      0,
      0,
      width,
      height
    );

    pdf.save("customer-statement.pdf");
  }

  return (
    <button
      type="button"
      onClick={downloadPDF}
      className="mt-4 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
    >
      Download PDF
    </button>
  );
}