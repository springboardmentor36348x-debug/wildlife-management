import client from "./client";

async function downloadFile(url, fallbackFilename) {
  const response = await client.get(url, { responseType: "blob" });
  const disposition = response.headers["content-disposition"];
  const match = disposition && disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackFilename;

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const downloadSitePdfReport = (siteId, siteName) =>
  downloadFile(`/api/v1/reports/${siteId}/pdf`, `${siteName || "site"}_report.pdf`);

export const downloadSiteExcelReport = (siteId, siteName) =>
  downloadFile(`/api/v1/reports/${siteId}/excel`, `${siteName || "site"}_report.xlsx`);
