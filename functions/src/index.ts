import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createPdf, downloadScreenshots } from "./pdf";
import { generateAccessToken } from "./docusign";
import { Discussion } from "./interfaces/discussions";
import { createEnvelope } from "./docusign/envelope";
import { createRecipientView } from "./docusign/recipientView";
import * as cors from "cors";
import {downloadDocument} from "./docusign/download";
const corsHandler = cors({ origin: true });

admin.initializeApp();

// export const token = functions.https.onRequest(async (request, response) => {
//   functions.logger.info("Hello logs!", { structuredData: true });
//   // await generateAccessToken()
//   const token = await generateAccessToken();
//   response.send("Hello from Firebase!2");
// });

export const submitDiscussion = functions.https.onRequest(async (request, response) => {
  corsHandler(request, response, async () => {
    const discussionId = request.body.discussionId as string;
    const submissionId = request.body.submissionId as string;

    const discussionRef = await admin.database().ref(`discussions/${discussionId}`).once("value");
    const discussion: Discussion = await discussionRef.val();

    const usersRef = await admin.database().ref("users").once("value");
    const users = await usersRef.val();



    await downloadScreenshots({ discussion });
    const { pdfDoc } = await createPdf({ submissionId, discussion, users });

    const token = await generateAccessToken();

    const signers = Object.keys(discussion.approverUserIds || {}).map((userId) => users[userId]);
    const envelope = await createEnvelope({
      pdfDoc,
      submissionId,
      discussion,
      signers,
      token,
    });

    const submissionPath = `discussions/${discussionId}/submissions/${submissionId}`;
    await admin.database().ref(submissionPath).update({ envelope });

    const discussionPath = `discussions/${discussionId}`;
    await admin.database().ref(discussionPath).update({ status: "Submitted" });

    response.json({});
  });
});

export const requestSigning = functions.https.onRequest(async (request, response) => {
  corsHandler(request, response, async () => {
    const discussionId = request.body.discussionId as string;
    const submissionId = request.body.submissionId as string;
    const userId = request.body.userId as string;

    const discussionRef = await admin.database().ref(`discussions/${discussionId}`).once("value");
    const discussion: Discussion = await discussionRef.val();

    const usersRef = await admin.database().ref(`users/${userId}`).once("value");
    const user = await usersRef.val();

    const envelope = discussion.submissions[submissionId]["envelope"];

    const token = await generateAccessToken();

    const viewUrl = await createRecipientView({
      signer: user,
      discussion,
      submissionId: submissionId,
      envelope,
      token,
    });

    response.json({ url: viewUrl });
  });
});

export const download = functions.https.onRequest(async (request, response) => {
  const token = await generateAccessToken();
  downloadDocument({envelopeId: 'ebd3f308-60e4-4099-8d18-c24309157085', documentId: '95939941', token})
});

export const webhook = functions.https.onRequest(async (request, response) => {
  const body = request.body;
  functions.logger.info("Webhook");
  functions.logger.info(JSON.stringify(body));

  const fields = body.customFields.textCustomFields;

  const discussionField = fields.find((field: any) => field.name === "discussionId");
  const submissionField = fields.find((field: any) => field.name === "submissionId");

  const discussionId = discussionField.value;
  const submissionId = submissionField.value;

  const envelopePath = `discussions/${discussionId}/submissions/${submissionId}/envelope`;

  functions.logger.info(discussionId, submissionId, envelopePath);

  await admin.database().ref(envelopePath).update(body);

  if (body.status === "completed") {
    const discussionPath = `discussions/${discussionId}`;
    await admin.database().ref(discussionPath).update({ status: "Agreed" });
  }

  if (body.status === "declined") {
    const discussionPath = `discussions/${discussionId}`;
    await admin.database().ref(discussionPath).update({ status: "Open" });
  }

  response.json({});
});



// const d = {
//   status: "sent",
//   documentsUri: "/envelopes/bbc3c0ec-4052-4557-83d4-233b6eb06458/documents",
//   recipientsUri: "/envelopes/bbc3c0ec-4052-4557-83d4-233b6eb06458/recipients",
//   attachmentsUri: "/envelopes/bbc3c0ec-4052-4557-83d4-233b6eb06458/attachments",
//   envelopeUri: "/envelopes/bbc3c0ec-4052-4557-83d4-233b6eb06458",
//   emailSubject: "New Chimpee agreement to sign",
//   envelopeId: "bbc3c0ec-4052-4557-83d4-233b6eb06458",
//   signingLocation: "online",
//   customFieldsUri: "/envelopes/bbc3c0ec-4052-4557-83d4-233b6eb06458/custom_fields",
//   notificationUri: "/envelopes/bbc3c0ec-4052-4557-83d4-233b6eb06458/notification",
//   enableWetSign: "true",
//   allowMarkup: "false",
//   allowReassign: "true",
//   createdDateTime: "2021-08-09T10:41:31.7Z",
//   lastModifiedDateTime: "2021-08-09T10:41:31.717Z",
//   initialSentDateTime: "2021-08-09T10:41:32.42Z",
//   sentDateTime: "2021-08-09T10:41:32.42Z",
//   statusChangedDateTime: "2021-08-09T10:42:14.273Z",
//   documentsCombinedUri: "/envelopes/bbc3c0ec-4052-4557-83d4-233b6eb06458/documents/combined",
//   certificateUri: "/envelopes/bbc3c0ec-4052-4557-83d4-233b6eb06458/documents/certificate",
//   templatesUri: "/envelopes/bbc3c0ec-4052-4557-83d4-233b6eb06458/templates",
//   expireEnabled: "true",
//   expireDateTime: "2021-12-07T10:41:32.42Z",
//   expireAfter: "120",
//   sender: {
//     userName: "Márton Elődi",
//     userId: "daa2d15a-628c-41cd-bd6e-f4bf7a262847",
//     accountId: "8cf0e1da-cd1d-4d4e-a866-30170a471feb",
//     email: "elodimarci@gmail.com",
//   },
//   folders: [
//     {
//       name: "Sent Items",
//       type: "sentitems",
//       owner: { userId: "daa2d15a-628c-41cd-bd6e-f4bf7a262847", email: "elodimarci@gmail.com" },
//       folderId: "91249d23-3a3f-4d71-9966-e28e027adb3a",
//       uri: "/folders/91249d23-3a3f-4d71-9966-e28e027adb3a",
//     },
//     { name: "out_for_signature" },
//     { name: "waiting_for_others" },
//   ],
//   customFields: {
//     textCustomFields: [
//       {
//         fieldId: "10595481210",
//         name: "discussionId",
//         show: "false",
//         required: "false",
//         value: "yrf7d8s9jin",
//       },
//       {
//         fieldId: "10595481211",
//         name: "submissionId",
//         show: "false",
//         required: "false",
//         value: "546738298",
//       },
//     ],
//     listCustomFields: [],
//   },
//   recipients: {
//     signers: [
//       {
//         signatureInfo: {
//           signatureName: "Bill NonMember",
//           signatureInitials: "BN",
//           fontStyle: "docusign7",
//         },
//         creationReason: "sender",
//         isBulkRecipient: "false",
//         recipientSuppliesTabs: "true",
//         requireUploadSignature: "false",
//         name: "Bill NonMember",
//         firstName: "",
//         lastName: "",
//         email: "elodimarci+nonmember@gmail.com",
//         recipientId: "2",
//         recipientIdGuid: "56c6226c-62f4-4325-aac6-54f9b82eb5be",
//         requireIdLookup: "false",
//         userId: "ee9b9752-93a1-4588-80f5-1fc63ad4adc1",
//         clientUserId: "aeMIUPpLa5YSKXwwcrz3dGStAcU2",
//         routingOrder: "1",
//         status: "sent",
//         completedCount: "0",
//         deliveryMethod: "email",
//         totalTabCount: "0",
//         recipientType: "signer",
//       },
//       {
//         signatureInfo: {
//           signatureName: "John Exper",
//           signatureInitials: "JE",
//           fontStyle: "docusign7",
//         },
//         creationReason: "sender",
//         isBulkRecipient: "false",
//         recipientSuppliesTabs: "true",
//         requireUploadSignature: "false",
//         name: "John Exper",
//         firstName: "",
//         lastName: "",
//         email: "elodimarci+expert@gmail.com",
//         recipientId: "1",
//         recipientIdGuid: "92534287-e862-4c15-ab96-f366df365b33",
//         requireIdLookup: "false",
//         userId: "635b7be8-677f-4bbf-a8ac-51b3ca21ef4c",
//         clientUserId: "2udjjeJMvBOlzCgoLezD8xvFNW83",
//         routingOrder: "1",
//         status: "sent",
//         completedCount: "0",
//         deliveryMethod: "email",
//         totalTabCount: "0",
//         recipientType: "signer",
//       },
//       {
//         signatureInfo: {
//           signatureName: "Marci Elodi",
//           signatureInitials: "ME",
//           fontStyle: "docusign7",
//         },
//         tabs: {
//           signHereTabs: [
//             {
//               stampType: "signature",
//               name: "",
//               tabLabel:
//                 "Signature 1_SignHere_f762de2b-8b60-4162-8035-6f757aa3fdf3_0922e4b1-38bb-4158-9c83-edea21bb56b8",
//               scaleValue: "1",
//               optional: "false",
//               documentId: "546738298",
//               recipientId: "3",
//               pageNumber: "4",
//               xPosition: "38",
//               yPosition: "227",
//               tabId: "744f74f0-662c-4943-8539-de99daf5f9e5",
//               status: "signed",
//               tabType: "signhere",
//             },
//           ],
//         },
//         creationReason: "sender",
//         isBulkRecipient: "false",
//         recipientSuppliesTabs: "true",
//         requireUploadSignature: "false",
//         name: "Marci Elodi",
//         firstName: "",
//         lastName: "",
//         email: "elodimarci@gmail.com",
//         recipientId: "3",
//         recipientIdGuid: "0922e4b1-38bb-4158-9c83-edea21bb56b8",
//         requireIdLookup: "false",
//         userId: "50f3c38f-c309-4401-9a01-1043b3661082",
//         clientUserId: "m7WtW0JCmtVK75Z4b7doHnrfO002",
//         routingOrder: "1",
//         status: "completed",
//         completedCount: "1",
//         signedDateTime: "2021-08-09T10:42:14.273Z",
//         deliveredDateTime: "2021-08-09T10:42:03.29Z",
//         deliveryMethod: "email",
//         totalTabCount: "1",
//         recipientType: "signer",
//       },
//     ],
//     agents: [],
//     editors: [],
//     intermediaries: [],
//     carbonCopies: [],
//     certifiedDeliveries: [],
//     inPersonSigners: [],
//     seals: [],
//     witnesses: [],
//     notaries: [],
//     recipientCount: "3",
//     currentRoutingOrder: "1",
//   },
//   purgeState: "unpurged",
//   envelopeIdStamping: "true",
//   is21CFRPart11: "false",
//   signerCanSignOnMobile: "true",
//   autoNavigation: "true",
//   isSignatureProviderEnvelope: "false",
//   hasFormDataChanged: "false",
//   allowComments: "true",
//   hasComments: "false",
//   allowViewHistory: "true",
//   envelopeMetadata: {
//     allowAdvancedCorrect: "true",
//     enableSignWithNotary: "true",
//     allowCorrect: "true",
//   },
//   anySigner: null,
//   envelopeLocation: "current_site",
//   isDynamicEnvelope: "false",
// };
