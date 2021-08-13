import { User } from "../interfaces/users";
import { accountId, basePath } from "./index";
import { Discussion } from "../interfaces/discussions";

const docusign = require("docusign-esign");


interface makeEnvelopeProps {
  pdfDoc: string;
  emailSubject: string;
  name: string;
  submissionId: string;
  signers: User[];
  discussion: Discussion;
}

function makeEnvelope({
  pdfDoc,
  emailSubject,
  name,
  submissionId,
  signers,
  discussion,
}: makeEnvelopeProps) {
  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = emailSubject;

  // add the documents
  let doc1 = new docusign.Document(),
    doc1b64 = pdfDoc;
  doc1.documentBase64 = doc1b64;
  doc1.name = name; // can be different from actual file name
  doc1.fileExtension = "pdf";
  doc1.documentId = submissionId;

  // The order in the docs array determines the order in the envelope
  env.documents = [doc1];

  // Create a signer recipient to sign the document, identified by name and email
  // We set the clientUserId to enable embedded signing for the recipient
  // We're setting the parameters via the object creation
  // for (const [index, signerUser] of signers.entries()){
  //   let signer = docusign.Signer.constructFromObject({
  //     email: signerUser.email,
  //     name: `${signerUser.firstName} ${signerUser.lastName}`,
  //     clientUserId: signerUser.id,
  //     recipientId: index+1,
  //   });
  //
  // }

  const signHeres = signers.map((signerUser, index) => {
    let signer = docusign.Signer.constructFromObject({
      email: signerUser.email,
      name: `${signerUser.firstName} ${signerUser.lastName}`,
      clientUserId: signerUser.id,
      recipientId: index + 1,
    });

    let signHere = docusign.SignHere.constructFromObject({
      anchorString: "/sn1/",
      anchorYOffset: "10",
      anchorUnits: "pixels",
      anchorXOffset: "20",
    });

    let signer1Tabs = docusign.Tabs.constructFromObject({
      signHereTabs: [signHere],
    });

    signer.tabs = signer1Tabs;

    return signer;
  });

  // Add the recipient to the envelope object
  let recipients = docusign.Recipients.constructFromObject({
    signers: signHeres,
  });
  env.recipients = recipients;

  env.customFields = {
    textCustomFields: [
      {
        name: "discussionId",
        required: "false",
        show: "false",
        value: discussion.id,
      },
      {
        name: "submissionId",
        required: "false",
        show: "false",
        value: submissionId,
      },
    ],
  };

  // Request that the envelope be sent by setting |status| to "sent".
  // To request that the envelope be created as a draft, set to "created"
  env.status = "sent";

  // env.attachments = [{
  //   name: 'discussion',
  //   label: 'Discussion',
  //   value: discussion.id,
  //   attachmentType: 'string'
  // }]

  return env;
}

interface CreateEnvelopeProps {
  pdfDoc: string;
  // emailSubject: string;
  // name: string;
  submissionId: string;
  signers: User[];
  discussion: Discussion;
  token: string
}
export const createEnvelope = async ({
  pdfDoc,
  submissionId,
  signers,
  discussion,
  token
}: CreateEnvelopeProps) => {
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + token);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient),
    results = null;

  // Make the envelope request body
  console.log("Starting making envelope");
  let envelope = makeEnvelope({
    pdfDoc,
    submissionId,
    signers,
    emailSubject: "New Chimpee agreement to sign",
    name: discussion.title,
    discussion,
  });

  // console.log('envelope', envelope)

  try {
    results = await envelopesApi.createEnvelope(accountId, { envelopeDefinition: envelope });
    return results;
  } catch (e) {
    console.log(e.response.text);
  }
};
