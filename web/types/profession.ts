export interface ScheduleItem {
  time: string;
  title: string;
  emoji: string;
  description: string;
  detail: string;
}

export interface Benefit {
  icon: string;
  text: string;
}

export interface CareerStage {
  level: string;
  years: string;
  salary: string;
  current?: boolean;
}

export interface Skill {
  name: string;
  level: number;
}

export interface Dialog {
  message: string;
  options: string[];
  response: string;
}

export interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export interface ProfessionData {
  profession: string;
  level: string;
  company: string;
  vacancies: number;
  competition: string;
  avgSalary?: number | null;
  topCompanies?: string[];
  schedule: ScheduleItem[];
  stack: string[];
  benefits: Benefit[];
  careerPath: CareerStage[];
  skills: Skill[];
  dialog: Dialog;
  videos?: Video[];
  slug: string;
  images: string[];
  generatedAt: string;
  isIT?: boolean;
  // Новые параметры для контекстной генерации
  companySize?: 'startup' | 'medium' | 'large' | 'any';
  location?: 'moscow' | 'spb' | 'other' | 'remote';
  specialization?: string;
}

