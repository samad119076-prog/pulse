export interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  text: string;
  likes: number;
  timeAgo: string;
  isLiked?: boolean;
}

export interface VideoItem {
  id: string;
  videoUrl: string;
  posterUrl?: string;
  userHandle: string;
  displayName: string;
  userAvatar: string;
  isVerified?: boolean;
  isSubscribed?: boolean;
  description: string;
  tags: string[];
  soundTitle: string;
  soundAuthor: string;
  soundAvatar?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isDisliked?: boolean;
  isSaved?: boolean;
  comments: CommentItem[];
  themeColor?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export type AiRole = 'copilot' | 'analyst' | 'creator';
