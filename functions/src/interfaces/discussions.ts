import { Comment } from "./comments";
import { GraphicJSON } from "./esri";
import { FirebaseCollection } from "./firebase";

export enum DiscussionStatus {
  Open = "Open",
  Submitted = "Submitted",
  Agreed = "Agreed",
}
export enum DiscussionRequestStatus {
  Open = "Open",
  Revoked = "Revoked",
  InProgress = "InProgress",
  Completed = "Completed",
}

export enum DiscussionChangeStatus {
  Published = "Published",
}

export interface MapConfig {
  baseMap: string;
  latitude: number;
  longitude: number;
  zoom: number;
}
// TODO: Map config, center, zoom
export interface Discussion {
  id: string;
  spaceId: string;
  objectiveIds: Record<string, boolean>;
  status: DiscussionStatus;
  title: string;
  description: string;
  changes: FirebaseCollection<DiscussionChange>;
  requests: FirebaseCollection<DiscussionRequest>;
  approverUserIds: Record<string, boolean>;
  map: MapConfig;
  submissions: Record<string, Submission>;
}

export interface Submission {
  envelope: {
    envelopeId: string;
    status: string;
    statusDateTime: string;
    uri: string;
  };
}

export interface DiscussionRequest {
  id: string;
  authorUserId: string;
  assignedUserIds?: Record<string, boolean>;
  time: number;
  comments?: FirebaseCollection<Comment>;
  title: string;
  description: string;
  status: DiscussionRequestStatus;
  solutionChangeId?: string;
  graphics?: GraphicJSON[];
  type?: DiscussionActionType;
  screenShotUrl?: string;
}

export interface DiscussionChange {
  id: string;
  authorUserId: string;
  time: number;
  comments?: FirebaseCollection<Comment>;
  title: string;
  description: string;
  solvedRequestIds?: Record<string, boolean>;
  type?: DiscussionActionType;
  status: DiscussionChangeStatus;
}

export enum DiscussionActionType {
  Change = "Change",
  Request = "Request",
}
