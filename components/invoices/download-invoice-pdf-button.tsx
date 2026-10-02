"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function DownloadInvoicePdfButton() {
  async function downloadPDF() {
    const element = document.getElementById("invoice-document");

    if (!element) return;

    const canvas = await html2canvas(element, {
  scale: 2,
  backgroundColor: "#ffffff",
  useCORS: true,

  onclone: (clonedDocument) => {

    const invoice =
      clonedDocument.getElementById("invoice-document");

    if (invoice) {
      invoice.style.width = "794px";
      invoice.style.padding = "40px";
      invoice.style.boxSizing = "border-box";
    }


    const noPrintElements =
      clonedDocument.querySelectorAll(".no-print");

    noPrintElements.forEach((element) => {
      (element as HTMLElement).style.display = "none";
    });


    const allElements =
      clonedDocument.querySelectorAll("*");

    allElements.forEach((element) => {
      const el = element as HTMLElement;

      el.style.color = "#000000";
      el.style.backgroundColor = "#ffffff";
      el.style.borderColor = "#dddddd";
    });

  },
});

    const imageData = canvas.toDataURL("image/png");

    const pdf = new jsPDF(
      "p",
      "mm",
      "a4"
    );

    const pdfWidth =
      pdf.internal.pageSize.getWidth();

    const pdfHeight =
      (canvas.height * pdfWidth) /
      canvas.width;

    pdf.addImage(
      imageData,
      "PNG",
      0,
      0,
      pdfWidth,
      pdfHeight
    );

    pdf.save("invoice.pdf");
  }

  return (
    <button
      type="button"
      onClick={downloadPDF}
      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
    >
      Download PDF
    </button>
  );
}