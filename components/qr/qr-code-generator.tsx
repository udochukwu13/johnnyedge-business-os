"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

type QRCodeGeneratorProps = {
  value: string;
  label?: string;
  fileName?: string;
};

export default function QRCodeGenerator({
  value,
  label = "QR Code",
  fileName = "qr-code",
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function downloadQRCode() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const url = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.png`;
    link.click();
  }

  function printQRCode() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const imageUrl = canvas.toDataURL("image/png");

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to print the QR code.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${label}</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              font-family: Arial, sans-serif;
              text-align: center;
            }

            img {
              width: 240px;
              height: 240px;
            }

            h2 {
              margin-top: 16px;
              font-size: 18px;
            }
          </style>
        </head>

        <body>
          <img src="${imageUrl}" alt="${label}" />
          <h2>${label}</h2>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <QRCodeCanvas
        ref={canvasRef}
        value={value}
        size={160}
        level="H"
        includeMargin
      />

      {label && (
        <div className="mt-2 text-sm font-semibold text-slate-700">
          {label}
        </div>
      )}

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={downloadQRCode}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Download
        </button>

        <button
          type="button"
          onClick={printQRCode}
          className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          Print
        </button>
      </div>
    </div>
  );
}