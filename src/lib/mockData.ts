export const CURRENT_USER = { username: "current_user", displayName: "我" };

export interface ChatUser {
  username: string;
  displayName: string;
  avatar: string;
}

export interface Chat {
  id: string;
  user: ChatUser;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
}

export const MOCK_CHATS: Chat[] = [
  {
    id: "c1",
    user: {
      username: "alice",
      displayName: "Alice Zhang",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    lastMessage: "Thanks for the feedback on my latest article!",
    time: "2m ago",
    unread: 2,
    messages: [
      { id: "m1", senderId: "alice", text: "Hi! I just read your latest post about design systems.", time: "10:30 AM" },
      { id: "m2", senderId: CURRENT_USER.username, text: "Oh thank you! What did you think about the color section?", time: "10:32 AM" },
      { id: "m3", senderId: "alice", text: "It was really insightful. I especially liked how you broke down the 60-30-10 rule.", time: "10:33 AM" },
      { id: "m4", senderId: "alice", text: "Thanks for the feedback on my latest article!", time: "10:35 AM" },
    ],
  },
  {
    id: "c2",
    user: {
      username: "bob",
      displayName: "Bob Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    lastMessage: "Would love to collaborate on a post together",
    time: "1h ago",
    unread: 0,
    messages: [
      { id: "m5", senderId: "bob", text: "Hey! Your blog is really coming together.", time: "Yesterday" },
      { id: "m6", senderId: CURRENT_USER.username, text: "Thanks Bob! Been working hard on it.", time: "Yesterday" },
      { id: "m7", senderId: "bob", text: "Would love to collaborate on a post together", time: "1h ago" },
    ],
  },
  {
    id: "c3",
    user: {
      username: "carol",
      displayName: "Carol Liu",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    },
    lastMessage: "Did you see the new design trends article?",
    time: "3h ago",
    unread: 1,
    messages: [
      { id: "m8", senderId: "carol", text: "Did you see the new design trends article?", time: "3h ago" },
      { id: "m9", senderId: "carol", text: "It reminded me of your style!", time: "3h ago" },
    ],
  },
];
