export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  pregnancyStage?: 'trying' | 'pregnant' | 'postpartum';
  pregnancyWeek?: number;
  childDOB?: string;
  location?: string;
  language: 'en' | 'sw';
  avatarUrl?: string;
  createdAt: string;
}

export interface Child {
  id: string;
  userId: string;
  name: string;
  dateOfBirth: string;
  gender?: 'male' | 'female';
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: ArticleCategory;
  contentType: ContentType;
  imageUrl?: string;
  videoUrl?: string;
  externalUrl?: string;
  source?: string;
  readTime: number;
  duration?: number; // For videos in minutes
  isDownloaded?: boolean;
  createdAt: string;
}

export type ContentType = 'article' | 'video' | 'course' | 'lesson';

export type ArticleCategory = 
  | 'prenatal'
  | 'postnatal'
  | 'nutrition'
  | 'child-development'
  | 'mental-health'
  | 'breastfeeding';

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: ReminderType;
  dueDate: string;
  dueTime?: string;
  isCompleted: boolean;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
}

export type ReminderType = 
  | 'vaccination'
  | 'appointment'
  | 'medication'
  | 'checkup';

export interface Vaccination {
  id: string;
  name: string;
  description: string;
  ageInWeeks: number;
  isCompleted: boolean;
  completedDate?: string;
}

export interface GrowthLog {
  id: string;
  childId: string;
  date: string;
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  notes?: string;
}

export interface ForumPost {
  id: string;
  userId: string;
  userName: string;
  isAnonymous: boolean;
  topic: ForumTopic;
  title: string;
  content: string;
  repliesCount: number;
  likesCount: number;
  createdAt: string;
}

export type ForumTopic = 
  | 'breastfeeding'
  | 'sleep-training'
  | 'nutrition'
  | 'pregnancy'
  | 'postpartum'
  | 'general';

export interface HealthFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy';
  address: string;
  distance?: string;
  rating?: number;
  phone?: string;
  isOpen?: boolean;
  services?: string[];
  latitude?: number;
  longitude?: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'ambulance' | 'hospital' | 'personal' | 'hotline';
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  ageInMonths: number;
  category: 'motor' | 'cognitive' | 'social' | 'language';
  isAchieved: boolean;
  achievedDate?: string;
}
