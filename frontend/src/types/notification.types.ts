export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}
