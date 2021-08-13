import { FirebaseCollection } from './firebase';

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  upvotes?: string[]; // TODO: firebase collection
  downvotes?: string[]; // TODO: firebase collection
  replies: FirebaseCollection<Comment>;
  time: number;
  lastUpdated:  number;
}
