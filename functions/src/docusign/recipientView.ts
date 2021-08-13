import { Discussion } from "../interfaces/discussions";
import { appUrl } from "../../config";
import { User } from "../interfaces/users";
import { accountId, basePath } from "./index";

const docusign = require("docusign-esign");

interface makeRecipientViewRequestProps {
  signer: User;
  discussion: Discussion;
  submissionId: string;
}
function makeRecipientViewRequest({
  discussion,
  submissionId,
  signer,
}: makeRecipientViewRequestProps) {
  let viewRequest = new docusign.RecipientViewRequest();

  viewRequest.returnUrl = `${appUrl}/spaces/${discussion.spaceId}/discussions/${discussion.id}/submissions/${submissionId}?state=signed&signerId=${signer.id}`;

  viewRequest.authenticationMethod = "none";

  viewRequest.email = signer.email;
  viewRequest.userName = `${signer.firstName} ${signer.lastName}`;
  viewRequest.clientUserId = signer.id;

  return viewRequest;
}

interface CreateRecipientViewProps {
  signer: User;
  discussion: Discussion;
  submissionId: string;
  envelope: any;
  token: string;
}

export const createRecipientView = async ({
  signer,
  submissionId,
  discussion,
  envelope,
  token
}: CreateRecipientViewProps) => {
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + token);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

  let viewRequest = makeRecipientViewRequest({ signer, discussion, submissionId });

  try {
    const { url } = await envelopesApi.createRecipientView(accountId, envelope.envelopeId, {
      recipientViewRequest: viewRequest,
    });

    return url;
  } catch (e) {
    console.log("error", e);
  }
};
