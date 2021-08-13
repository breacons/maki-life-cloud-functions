export interface Space {
  id: string;
  name: string;
  memberIds: Record<string, boolean>;
  adminIds: Record<string, boolean>;
  discussionIds?: string[];
  objectiveIds?: string[];
  logo?: string;
  ownerId: string;
}
