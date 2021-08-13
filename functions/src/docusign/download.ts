import { basePath } from "./index";
import * as admin from "firebase-admin";
const docusign = require("docusign-esign");

interface DownloadDocumentProps {
  token: string;
  envelopeId: string;
  documentId: string;
}

export const downloadDocument = async ({
  token,
  envelopeId,
  documentId,
}: DownloadDocumentProps) => {
  const dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + token);
  // let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

  // const results = await envelopesApi.getDocument(accountId, envelopeId, documentId, null);

  // console.log("Download", results);
  const file = admin.storage().bucket().file(`signed/${envelopeId}/${documentId}.pdf`);

  // let pdfData = Buffer.from(results).toString("base64");
  // const url = await file.getSignedUrl({ action: "read", expires: "03-09-3000" });

  const writeStream = file.createWriteStream({
    resumable: false,
    contentType: "application/pdf",
  });
  // let pdfData = Buffer.concat(results).toString("base64");

  // writeStream.write(results)
  writeStream.end();

  writeStream.on("finish", async () => {
    console.log("finished writing");

    // const url = await file.getSignedUrl({ action: "read", expires: "03-09-3000" });
    // const url =
    //   "https://firebasestorage.googleapis.com/v0/b/chimpee-app.appspot.com/o/submissions%2Fyrf7d8s9jin%2Fgu84923oqlekjvhf9do.pdf?alt=media&token=4d966ba2-05ca-45e7-bf25-d68488d9ccff";
    // return url;

    // resolve({ pdfUrl: url, pdfDoc: pdfData });
  });

  return;
};
