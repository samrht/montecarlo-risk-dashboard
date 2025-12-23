import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportDashboardPdf(el: HTMLElement) {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#09090b",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save("MonteCarlo_Dashboard.pdf");
}
