export interface Quest {
  id: number;
  title: string;
  prompt: string;
  category: 'Psychological Safety' | 'Change Leadership' | 'AI Fluency' | 'Orchestration' | 'Coaching Capability';
  difficulty: 'tiny' | 'small' | 'stretch';
  estimated_minutes: number;
  tags: string; // JSON string array
  is_active: number;
  is_system: number;
  evidence_prompt?: string;
  reflection_prompt?: string;
  completed?: boolean;
}

export interface UserStats {
  id: number;
  pet_name: string;
  happiness: number;
  experience: number;
  level: number;
  streak: number;
  last_completed_date: string | null;
  stat_clarity: number;
  stat_trust: number;
  stat_momentum: number;
  stat_energy: number;
  accessories?: string; // JSON string
  pet_shape?: string;
  pet_eyes?: string;
  pet_mouth?: string;
}

export interface CheckIn {
  id: number;
  date: string;
  mood: number;
  change_temp: number;
  pressure: string;
  focus: string;
}

export interface Goal {
  id: number;
  title: string;
  type: 'habit' | 'one-off' | 'project';
  frequency: string;
  loops: string; // JSON string array
  is_completed: number;
}

export interface Campaign {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'scheduled' | 'live' | 'archived';
  theme_tag: string;
  priority_level: number;
  mandatory_quest: number;
  reward_type: string;
  focus_loops: string; // JSON string array
  quest_pool: string; // JSON string array of IDs
  business_context_note: string;
}

export interface UserCampaignProgress {
  user_email: string;
  campaign_id: number;
  completed_quests_count: number;
  last_active_date: string;
  is_completed: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  category?: string;
}

export interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}
