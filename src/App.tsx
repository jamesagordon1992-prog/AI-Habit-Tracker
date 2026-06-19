import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundService } from './services/soundService';
import { notificationService } from './services/notificationService';
import { 
  Trophy, 
  Settings, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Heart, 
  Zap, 
  Star,
  Globe,
  Menu,
  ChevronRight,
  X,
  ShieldCheck,
  MessageSquare,
  Ear,
  Lightbulb,
  Wind,
  Activity,
  Users,
  FastForward,
  Battery,
  Lock,
  Calendar,
  Coffee,
  Target,
  Trash2,
  Edit3,
  Save,
  Glasses,
  Crown,
  Info,
  MousePointer2,
  Dice5,
  Footprints,
  Flame,
  Compass,
  Bell,
  Share2
} from 'lucide-react';
import { Quest, UserStats, CheckIn, Goal, Campaign, UserCampaignProgress, Achievement, UserAchievement } from './types';

const CATEGORY_ICONS: Record<string, any> = {
  'Psychological Safety': ShieldCheck,
  'Change Leadership': Compass,
  'AI Fluency': Zap,
  'Orchestration': Users,
  'Coaching Capability': Ear
};

const STAT_ICONS: Record<string, any> = {
  'Clarity': Lightbulb,
  'Trust': Users,
  'Momentum': FastForward,
  'Energy': Battery
};

const ACHIEVEMENT_ICONS: Record<string, any> = {
  'Footprints': Footprints,
  'Flame': Flame,
  'Trophy': Trophy,
  'Star': Star,
  'Crown': Crown,
  'ShieldCheck': ShieldCheck,
  'Zap': Zap,
  'Compass': Compass
};

const PRESSURES = [
  'Resistance', 'Workload', 'Unclear Direction', 'Stakeholder Conflict', 'Morale Dip'
];

const PET_NAMES = [
  'Skye', 'Robin', 'Alex', 'Jordan', 'Casey', 'Puck', 'Echo', 'Nova', 'River', 'Sage', 
  'Quinn', 'Charlie', 'Avery', 'Riley', 'Phoenix', 'Indigo', 'Jude', 'Kit', 'Onyx', 'Zion'
];

export default function App() {
  const [userEmail, setUserEmail] = useState<string>(localStorage.getItem('ellis_user_email') || '');
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('ellis_user_email'));
  const [quests, setQuests] = useState<Quest[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showPetNameEdit, setShowPetNameEdit] = useState(false);
  const [tempPetName, setTempPetName] = useState('');
  const [checkInForm, setCheckInForm] = useState({
    change_temp: 3,
    pressure: 'Workload',
    focus: 'Psychological Safety'
  });
  const [newQuest, setNewQuest] = useState({ title: '', category: 'Psychological Safety', prompt: '', difficulty: 'tiny', tags: '' });
  const [newGoal, setNewGoal] = useState({ title: '', type: 'habit', frequency: 'daily', loops: [] as string[] });
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [dailyPack, setDailyPack] = useState<Quest[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [campaignProgress, setCampaignProgress] = useState<UserCampaignProgress[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [ecosystem, setEcosystem] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [view, setView] = useState<'main' | 'leaderboard' | 'summary'>('main');
  const [idleAction, setIdleAction] = useState<'none' | 'blink' | 'look-left' | 'look-right'>('none');
  const [petInteraction, setPetInteraction] = useState<'none' | 'wiggle' | 'jump' | 'heart'>('none');
  const [sessionCompletions, setSessionCompletions] = useState(0);
  const [celebration, setCelebration] = useState<{ type: 'quest' | 'milestone3' | 'milestone5' | 'goal', active: boolean }>({ type: 'quest', active: false });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [newAchievementEarned, setNewAchievementEarned] = useState<Achievement | null>(null);
  const [isTeams, setIsTeams] = useState(false);
  const [nudgeSettings, setNudgeSettings] = useState({ enabled: false, time: '17:00' });
  const [showMenu, setShowMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'teams') {
      setIsTeams(true);
    }
    
    const savedNudge = localStorage.getItem('ellis_nudge_settings');
    if (savedNudge) {
      const settings = JSON.parse(savedNudge);
      setNudgeSettings(settings);
      if (settings.enabled) {
        const [h, m] = settings.time.split(':');
        notificationService.scheduleNudge(parseInt(h), parseInt(m), "Time for your end-of-day reflection! How did your quests go?");
      }
    }
  }, []);

  const handleToggleNudge = async () => {
    const newEnabled = !nudgeSettings.enabled;
    if (newEnabled) {
      const granted = await notificationService.requestPermission();
      if (!granted) {
        alert("Please enable notifications in your browser to use nudges.");
        return;
      }
    }
    
    const newSettings = { ...nudgeSettings, enabled: newEnabled };
    setNudgeSettings(newSettings);
    localStorage.setItem('ellis_nudge_settings', JSON.stringify(newSettings));
    
    if (newEnabled) {
      const [h, m] = newSettings.time.split(':');
      notificationService.scheduleNudge(parseInt(h), parseInt(m), "Time for your end-of-day reflection! How did your quests go?");
    } else {
      notificationService.cancelNudge();
    }
  };

  const handleUpdateNudgeTime = (time: string) => {
    const newSettings = { ...nudgeSettings, time };
    setNudgeSettings(newSettings);
    localStorage.setItem('ellis_nudge_settings', JSON.stringify(newSettings));
    
    if (newSettings.enabled) {
      const [h, m] = time.split(':');
      notificationService.scheduleNudge(parseInt(h), parseInt(m), "Time for your end-of-day reflection! How did your quests go?");
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchData();
    }
  }, [userEmail]);

  useEffect(() => {
    // Idle animation cycle
    const interval = setInterval(() => {
      const actions: ('none' | 'blink' | 'look-left' | 'look-right')[] = ['none', 'none', 'blink', 'look-left', 'look-right'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      setIdleAction(randomAction);
      setTimeout(() => setIdleAction('none'), 500);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    if (!userEmail) return;
    try {
      const headers = { 'x-user-email': userEmail };
      const [qRes, sRes, cRes, gRes, dpRes, acRes, cpRes, lbRes, wsRes, ecoRes, achRes] = await Promise.all([
        fetch('/api/quests'),
        fetch('/api/stats', { headers }),
        fetch('/api/checkin', { headers }),
        fetch('/api/goals', { headers }),
        fetch('/api/admin/daily-pack'),
        fetch('/api/campaigns/active', { headers }),
        fetch('/api/campaigns/progress', { headers }),
        fetch('/api/leaderboard'),
        fetch('/api/stats/weekly', { headers }),
        fetch('/api/ecosystem'),
        fetch('/api/achievements', { headers })
      ]);

      const questsData = await qRes.json().catch(() => []);
      const statsData = await sRes.json().catch(() => null);
      const checkInData = await cRes.json().catch(() => null);
      const goalsData = await gRes.json().catch(() => []);
      const globalDailyPackIds = await dpRes.json().catch(() => []);
      const activeCampaignsData = await acRes.json().catch(() => []);
      const campaignProgressData = await cpRes.json().catch(() => []);
      const leaderboardData = await lbRes.json().catch(() => []);
      const weeklyStatsData = await wsRes.json().catch(() => null);
      const ecosystemData = await ecoRes.json().catch(() => null);
      const achData = await achRes.json().catch(() => ({ allAchievements: [], userAchievements: [] }));

      setQuests(questsData);
      setStats(statsData);
      setCheckIn(checkInData);
      setGoals(goalsData);
      setActiveCampaigns(activeCampaignsData);
      setCampaignProgress(campaignProgressData);
      setLeaderboard(leaderboardData);
      setWeeklyStats(weeklyStatsData);
      setEcosystem(ecosystemData);
      setAchievements(achData.allAchievements);
      setUserAchievements(achData.userAchievements);

      if (!checkInData) {
        setShowCheckIn(true);
      }

      // Quest Selection Logic: Use global pack if set, otherwise random
      if (globalDailyPackIds && globalDailyPackIds.length > 0) {
        const pack = questsData.filter((q: Quest) => globalDailyPackIds.includes(q.id));
        setDailyPack(pack);
      } else if (activeCampaignsData && activeCampaignsData.length > 0) {
        const topCampaign = activeCampaignsData.sort((a: Campaign, b: Campaign) => b.priority_level - a.priority_level)[0];
        const poolIds = JSON.parse(topCampaign.quest_pool);
        const campaignQuests = questsData.filter((q: Quest) => poolIds.includes(q.id));
        
        if (topCampaign.priority_level === 4 && poolIds.length > 0) {
          // Mode 4: Locked Path (Sequential)
          const progress = campaignProgressData.find((p: any) => p.campaign_id === topCampaign.id);
          const completedCount = progress ? progress.completed_quests_count : 0;
          const pack = campaignQuests.slice(completedCount, completedCount + 3);
          setDailyPack(pack.length > 0 ? pack : campaignQuests.slice(0, 3));
        } else if (topCampaign.priority_level === 3 && poolIds.length > 0) {
          // Mode 3: Full Override
          const pack = campaignQuests.sort(() => 0.5 - Math.random()).slice(0, 3);
          setDailyPack(pack);
        } else {
          const tinies = questsData.filter((q: Quest) => q.difficulty === 'tiny').sort(() => 0.5 - Math.random());
          const smalls = questsData.filter((q: Quest) => q.difficulty === 'small').sort(() => 0.5 - Math.random());
          
          let pack: Quest[] = [];
          if (topCampaign.priority_level === 2 && campaignQuests.length > 0) {
            // Mode 2: Injected Quest
            pack.push(campaignQuests[0]);
            pack.push(...tinies.filter(q => !poolIds.includes(q.id)).slice(0, 1));
            pack.push(...smalls.filter(q => !poolIds.includes(q.id)).slice(0, 1));
          } else if (topCampaign.priority_level === 1 && campaignQuests.length > 0) {
            // Mode 1: Light Nudge (Prefer campaign quests in random selection)
            const mixedTinies = [...campaignQuests.filter(q => q.difficulty === 'tiny'), ...tinies].sort(() => 0.5 - Math.random());
            const mixedSmalls = [...campaignQuests.filter(q => q.difficulty === 'small'), ...smalls].sort(() => 0.5 - Math.random());
            pack = [...mixedTinies.slice(0, 2), ...mixedSmalls.slice(0, 1)];
          } else {
            pack = [...tinies.slice(0, 2), ...smalls.slice(0, 1)];
          }
          setDailyPack(pack);
        }
      } else {
        const focus = checkInData?.focus;
        
        const getWeightedQuests = (difficulty: string, count: number) => {
          const pool = questsData.filter((q: Quest) => q.difficulty === difficulty);
          if (!focus) return pool.sort(() => 0.5 - Math.random()).slice(0, count);
          
          const matching = pool.filter(q => q.category === focus);
          const others = pool.filter(q => q.category !== focus);
          
          const selected: Quest[] = [];
          const matchingCopy = [...matching];
          const othersCopy = [...others];

          for (let i = 0; i < count; i++) {
            // 70% chance to pick from matching if available
            if (matchingCopy.length > 0 && Math.random() < 0.7) {
              const idx = Math.floor(Math.random() * matchingCopy.length);
              selected.push(matchingCopy.splice(idx, 1)[0]);
            } else if (othersCopy.length > 0) {
              const idx = Math.floor(Math.random() * othersCopy.length);
              selected.push(othersCopy.splice(idx, 1)[0]);
            } else if (matchingCopy.length > 0) {
              const idx = Math.floor(Math.random() * matchingCopy.length);
              selected.push(matchingCopy.splice(idx, 1)[0]);
            }
          }
          return selected;
        };

        const tinies = getWeightedQuests('tiny', 2);
        const smalls = getWeightedQuests('small', 1);
        setDailyPack([...tinies, ...smalls]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const fetchAdminData = async () => {
    const res = await fetch('/api/admin/all-quests');
    setAllQuests(await res.json());
  };

  const toggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowAdminAuth(true);
      setAdminPasswordInput('');
      setAdminAuthError(false);
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'Ellis123!') {
      setIsAdmin(true);
      setShowAdminAuth(false);
      fetchAdminData();
    } else {
      setAdminAuthError(true);
    }
  };

  const handleOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    const demoId = `user-${Math.random().toString(36).substring(2, 8)}@ellis.dev`;
    localStorage.setItem('ellis_user_email', demoId);
    setUserEmail(demoId);
    setShowOnboarding(false);
  };

  const handleUpdatePetName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPetName.trim()) return;
    
    const headers = { 
      'Content-Type': 'application/json',
      'x-user-email': userEmail 
    };
    
    await fetch('/api/stats/pet-name', {
      method: 'POST',
      headers,
      body: JSON.stringify({ pet_name: tempPetName })
    });
    
    setStats(prev => prev ? { ...prev, pet_name: tempPetName } : null);
    setShowPetNameEdit(false);
  };

  const generateRandomName = () => {
    const name = PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)];
    setTempPetName(name);
  };

  const handleComplete = async (questId: number) => {
    soundService.playSuccess();
    const res = await fetch('/api/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
      body: JSON.stringify({ questId })
    });
    const data = await res.json();
    if (res.ok) {
      setDailyPack(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));
      const newCount = sessionCompletions + 1;
      setSessionCompletions(newCount);
      
      if (data.earnedAchievements && data.earnedAchievements.length > 0) {
        setNewAchievementEarned(data.earnedAchievements[0]);
        setUserAchievements(prev => [...prev, ...data.earnedAchievements.map((a: any) => ({ achievement_id: a.id, earned_at: new Date().toISOString() }))]);
      }

      // Track campaign progress
      if (activeCampaigns.length > 0) {
        const campaign = activeCampaigns[0];
        const poolIds = JSON.parse(campaign.quest_pool);
        if (poolIds.includes(questId)) {
          fetch('/api/campaigns/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
            body: JSON.stringify({ campaignId: campaign.id })
          });
        }
      }
      
      // Trigger animations
      if (newCount === 5) {
        setCelebration({ type: 'milestone5', active: true });
        soundService.playMilestone();
      } else if (newCount === 3) {
        setCelebration({ type: 'milestone3', active: true });
        soundService.playMilestone();
      } else {
        setCelebration({ type: 'quest', active: true });
      }
      
      setTimeout(() => setCelebration(prev => ({ ...prev, active: false })), 3000);
      fetchData();
    }
  };

  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
      body: JSON.stringify(newQuest)
    });
    if (res.ok) {
      setShowAddQuest(false);
      soundService.playSuccess();
      setNewQuest({ title: '', category: 'Psychological Safety', prompt: '', difficulty: 'tiny', tags: '' });
      fetchData();
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
      body: JSON.stringify(newGoal)
    });
    if (res.ok) {
      setShowAddGoal(false);
      soundService.playSuccess();
      setNewGoal({ title: '', type: 'habit', frequency: 'daily', loops: [] });
      setCelebration({ type: 'goal', active: true });
      setTimeout(() => setCelebration(prev => ({ ...prev, active: false })), 2000);
      fetchData();
    }
  };

  const handleToggleGoal = async (id: number, currentStatus: number) => {
    if (currentStatus === 0) {
      soundService.playNotification();
    } else {
      soundService.playToggleOff();
    }
    const res = await fetch('/api/goals/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
      body: JSON.stringify({ id, is_completed: currentStatus === 0 })
    });
    if (res.ok) {
      fetchData();
    }
  };

  const handleCheckIn = async () => {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
      body: JSON.stringify({ ...checkInForm, mood: 3 }) // mood is currently static but could be added to UI
    });
    if (res.ok) {
      setShowCheckIn(false);
      soundService.playSuccess();
      fetchData();
    }
  };

  const toggleQuestStatus = async (id: number, currentStatus: number) => {
    await fetch('/api/admin/toggle-quest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: currentStatus === 0 })
    });
    fetchAdminData();
    fetchData();
  };

  const handleResetSystem = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handlePetClick = () => {
    soundService.playInteraction();
    const interactions: ('wiggle' | 'jump' | 'heart')[] = ['wiggle', 'jump', 'heart'];
    const random = interactions[Math.floor(Math.random() * interactions.length)];
    setPetInteraction(random);
    setTimeout(() => setPetInteraction('none'), 1000);
  };

  if (!stats && !showOnboarding) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0d2b0d] text-[#00ff41] font-mono">
      <div className="pixel-grid" />
      <ShieldCheck className="w-12 h-12 mb-4 animate-pulse text-[#00ff41]" />
      <div className="tracking-widest uppercase text-xs">Initializing Behavioral Engine...</div>
    </div>
  );

  const petMood = stats?.happiness > 70 ? 'HAPPY' : stats?.happiness > 30 ? 'NEUTRAL' : 'SAD';
  const accessories = stats?.accessories ? JSON.parse(stats.accessories) : { hat: 'none', glasses: 'none' };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="tamagotchi-case w-full max-w-2xl">
        <div className={`relative ${isTeams ? 'pt-2' : ''}`}>
      {/* Header */}
      {!isTeams && (
        <header className="flex justify-between items-center mb-8 relative z-50">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
              <ShieldCheck className="w-8 h-8" />
              ELLIS v2.0
            </h1>
            <p className="text-xs opacity-60 uppercase">1% better everyday</p>
          </div>
          <div className="relative">
            <button 
              onClick={() => {
                setShowMenu(!showMenu);
                soundService.playInteraction();
              }}
              className={`p-2 border transition-all flex items-center gap-2 ${showMenu ? 'bg-[#00ff41] text-[#0d2b0d]' : 'pixel-btn-outline'}`}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">SYSTEM MENU</span>
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-[#0d2b0d] border-4 border-[#00ff41] shadow-[8px_8px_0px_0px_rgba(0,255,65,0.3)] p-2 space-y-1"
                >
                  <button 
                    onClick={() => {
                      setView('main');
                      setShowMenu(false);
                      soundService.playInteraction();
                    }}
                    className={`w-full flex items-center gap-3 p-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${view === 'main' ? 'bg-[#00ff41] text-[#0d2b0d]' : 'hover:bg-[#00ff41]/10'}`}
                  >
                    <Activity className="w-4 h-4" />
                    DASHBOARD
                  </button>
                  <button 
                    onClick={() => {
                      setView('leaderboard');
                      setShowMenu(false);
                      soundService.playInteraction();
                    }}
                    className={`w-full flex items-center gap-3 p-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${view === 'leaderboard' ? 'bg-[#00ff41] text-[#0d2b0d]' : 'hover:bg-[#00ff41]/10'}`}
                  >
                    <Globe className="w-4 h-4" />
                    ECOSYSTEM
                  </button>
                  <button 
                    onClick={() => {
                      setView('summary');
                      setShowMenu(false);
                      soundService.playInteraction();
                    }}
                    className={`w-full flex items-center gap-3 p-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${view === 'summary' ? 'bg-[#00ff41] text-[#0d2b0d]' : 'hover:bg-[#00ff41]/10'}`}
                  >
                    <Calendar className="w-4 h-4" />
                    SUMMARY
                  </button>
                  <div className="h-[1px] bg-[#00ff41]/20 my-1" />
                  <button 
                    onClick={() => {
                      toggleAdmin();
                      setShowMenu(false);
                      soundService.playInteraction();
                    }}
                    className="w-full flex items-center gap-3 p-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#00ff41]/10 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    ADMIN CONSOLE
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>
      )}

      {isTeams && (
        <div className="flex justify-between items-center mb-4 border-b border-[#00ff41]/20 pb-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#00ff41]">Teams Integration Active</div>
          <div className="flex gap-2">
            <button onClick={() => setView('main')} className={`p-1 ${view === 'main' ? 'text-[#00ff41]' : 'opacity-40'}`}><Activity className="w-4 h-4" /></button>
            <button onClick={() => setView('leaderboard')} className={`p-1 ${view === 'leaderboard' ? 'text-[#00ff41]' : 'opacity-40'}`}><Globe className="w-4 h-4" /></button>
            <button onClick={() => setView('summary')} className={`p-1 ${view === 'summary' ? 'text-[#00ff41]' : 'opacity-40'}`}><Calendar className="w-4 h-4" /></button>
            <button onClick={toggleAdmin} className="p-1 opacity-40 hover:opacity-100 transition-opacity"><Settings className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {view === 'leaderboard' ? (
        <EcosystemView 
          data={ecosystem} 
          leaderboard={leaderboard}
          currentUserEmail={userEmail} 
          onClose={() => setView('main')} 
        />
      ) : view === 'summary' ? (
        <WeeklySummary stats={weeklyStats} onClose={() => setView('main')} />
      ) : isAdmin ? (
        <AdminPanel 
          userEmail={userEmail}
          allQuests={allQuests} 
          onToggle={toggleQuestStatus} 
          onClose={() => setIsAdmin(false)}
          onAddQuest={async (q) => {
            const res = await fetch('/api/quests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(q)
            });
            if (res.ok) fetchAdminData();
          }}
          onDeleteQuest={async (id) => {
            if (confirm('Are you sure you want to delete this quest from the global bank?')) {
              const res = await fetch(`/api/admin/quests/${id}`, { method: 'DELETE' });
              if (res.ok) fetchAdminData();
            }
          }}
          onUpdateQuest={async (id, q) => {
            const res = await fetch(`/api/admin/quests/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(q)
            });
            if (res.ok) fetchAdminData();
          }}
          onRefresh={fetchData}
        />
      ) : stats ? (
        <div className="space-y-8">
          {/* Tamagotchi Display */}
          <section className="lcd-screen h-72 flex flex-col items-center justify-center relative">
            <div className="scanline" />
            <div className="pixel-grid" />
            
            {/* Pet Sprite */}
            <motion.div
              onClick={handlePetClick}
              animate={{ 
                y: celebration.active || petInteraction === 'jump' ? [0, -40, 0, -20, 0] : [0, -10, 0],
                x: petInteraction === 'wiggle' ? [0, -10, 10, -10, 0] : idleAction === 'look-left' ? -5 : idleAction === 'look-right' ? 5 : 0,
                scale: celebration.active || petInteraction === 'heart' ? [1, 1.4, 1, 1.2, 1] : petMood === 'HAPPY' ? [1, 1.1, 1] : 1,
                rotate: celebration.active ? [0, 10, -10, 10, 0] : 0
              }}
              transition={{ 
                repeat: celebration.active ? 0 : Infinity, 
                duration: celebration.active || petInteraction !== 'none' ? 1 : 2 
              }}
              className="relative mb-4 cursor-pointer group"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[8px] bg-black/50 px-2 py-1 rounded">
                <MousePointer2 className="w-2 h-2 inline mr-1" /> CLICK ME!
              </div>

              <div className="w-24 h-24 border-4 border-[#00ff41] rounded-lg flex flex-col items-center justify-center bg-[#0d2b0d] relative overflow-hidden">
                {/* Accessories */}
                {accessories.hat === 'crown' && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 text-yellow-400">
                    <Crown className="w-6 h-6 fill-yellow-400" />
                  </div>
                )}
                {accessories.glasses === 'cool' && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 text-white">
                    <Glasses className="w-8 h-8" />
                  </div>
                )}

                {celebration.active || petInteraction === 'heart' ? (
                  <div className="text-4xl">
                    {celebration.type === 'milestone5' ? '✧(>‿<)✧' : celebration.type === 'milestone3' ? '٩(◕‿◕)۶' : '(^▽^)'}
                  </div>
                ) : (
                  <>
                    {petMood === 'HAPPY' && (
                      <div className="text-4xl">
                        {idleAction === 'blink' ? '-‿-' : '^‿^'}
                      </div>
                    )}
                    {petMood === 'NEUTRAL' && (
                      <div className="text-4xl">
                        {idleAction === 'blink' ? '-‿-' : '•‿•'}
                      </div>
                    )}
                    {petMood === 'SAD' && (
                      <div className="text-4xl">
                        {idleAction === 'blink' ? '-‿-' : 'ಠ_ಠ'}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <AnimatePresence>
                {celebration.active && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 2 }}
                    className="absolute -top-8 -right-8"
                  >
                    <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {petMood === 'HAPPY' && !celebration.active && (
                <motion.div 
                  animate={{ y: -20, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute -top-4 -right-4 text-[#00ff41]"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </motion.div>
              )}
            </motion.div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 group">
                <h2 className="text-xl font-bold tracking-widest">{stats.pet_name.toUpperCase()}</h2>
                {stats.streak > 0 && (
                  <div className="flex items-center gap-1 bg-[#00ff41] text-[#0d2b0d] px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <Flame className="w-3 h-3 fill-current" /> {stats.streak}
                  </div>
                )}
                <button 
                  onClick={() => {
                    setTempPetName(stats.pet_name);
                    setShowPetNameEdit(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-[#00ff41]"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] opacity-70">LVL {stats.level} AI ADOPTION COMPANION</p>
            </div>

            {/* Behavioral Stats Grid */}
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-2">
              {[
                { label: 'Clarity', val: stats.stat_clarity, icon: Lightbulb },
                { label: 'Trust', val: stats.stat_trust, icon: Users },
                { label: 'Momentum', val: stats.stat_momentum, icon: FastForward },
                { label: 'Energy', val: stats.stat_energy, icon: Battery }
              ].map(s => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-[8px] uppercase">
                    <span className="flex items-center gap-1"><s.icon className="w-2 h-2" /> {s.label}</span>
                    <span>{s.val}%</span>
                  </div>
                  <div className="h-1 bg-[#00ff41]/20 border border-[#00ff41]/40">
                    <div 
                      className="h-full bg-[#00ff41] transition-all duration-500" 
                      style={{ width: `${s.val}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Daily Check-in Status */}
          {activeCampaigns.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#00ff41]/10 border border-[#00ff41]/40 p-3 mb-4 rounded-lg relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff41]" />
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[10px] font-bold text-[#00ff41] uppercase tracking-widest flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> ACTIVE CAMPAIGN: {activeCampaigns[0].title}
                  </h4>
                  <p className="text-[9px] opacity-70 mt-1 italic">"{activeCampaigns[0].business_context_note}"</p>
                </div>
                <div className="text-[8px] bg-[#00ff41] text-[#0d2b0d] px-1 font-bold">LIVE</div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[8px] uppercase opacity-60">
                  <span>Campaign Progress</span>
                  <span>{Math.round((campaignProgress.find(p => p.campaign_id === activeCampaigns[0].id)?.completed_quests_count || 0) / 10 * 100)}%</span>
                </div>
                <div className="h-1 bg-[#00ff41]/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (campaignProgress.find(p => p.campaign_id === activeCampaigns[0].id)?.completed_quests_count || 0) / 10 * 100)}%` }}
                    className="h-full bg-[#00ff41]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {checkIn ? (
            <div className="retro-border p-3 bg-[#0d2b0d]/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>TODAY'S FOCUS: <span className="font-bold">{checkIn.focus.toUpperCase()}</span></span>
              </div>
              <div className="flex items-center gap-1 group relative">
                <span className="text-[10px] opacity-60">TEMP:</span>
                <span className="text-[10px] font-bold">{checkIn.change_temp}/5</span>
                <Info className="w-3 h-3 opacity-40 cursor-help" />
                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#00ff41] border border-[#00ff41] text-[8px] opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-[#0d2b0d]">
                  CHANGE TEMPERATURE: Represents the volatility of your environment. 
                  1 = Stable/Predictable, 5 = High Volatility/Crisis Mode.
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => {
                setShowCheckIn(true);
                soundService.playInteraction();
              }}
              className="pixel-btn w-full text-sm"
            >
              INITIALIZE DAILY CHECK-IN
            </button>
          )}

          {/* Daily Quests */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Zap className="w-5 h-5" />
                DAILY QUEST PACK
              </h3>
              <div className="text-[10px] opacity-60">3 ACTIVE // 1 STRETCH</div>
            </div>

            <div className="grid gap-4">
              {dailyPack.map((quest) => {
                const Icon = CATEGORY_ICONS[quest.category] || Star;
                return (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={!quest.completed ? { scale: 1.02, x: 5 } : {}}
                    className={`retro-border p-4 flex items-center gap-4 transition-all cursor-pointer ${
                      quest.completed 
                        ? 'opacity-40 grayscale cursor-default' 
                        : 'bg-[#0d2b0d]/50 hover:bg-[#00ff41]/10 hover:shadow-[6px_6px_0px_0px_rgba(0,255,65,0.5)]'
                    }`}
                  >
                    <div className="p-2 border-2 border-[#00ff41] rounded-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm uppercase">{quest.title}</h4>
                        <span className={`text-[8px] px-1 border border-[#00ff41] ${quest.difficulty === 'tiny' ? 'bg-[#00ff41] text-[#0d2b0d]' : ''}`}>
                          {quest.difficulty.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-70 leading-tight">{quest.prompt}</p>
                    </div>
                    <button
                      disabled={quest.completed}
                      onClick={() => handleComplete(quest.id)}
                      className={`p-2 rounded-sm border-2 transition-all ${quest.completed ? 'border-[#00ff41] text-[#00ff41]' : 'border-[#00ff41]/30 hover:border-[#00ff41]'}`}
                    >
                      {quest.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Leader Goals (Finch-style) */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5" />
                PERSONAL GOALS
              </h3>
              <button 
                onClick={() => {
                  setShowAddGoal(true);
                  soundService.playInteraction();
                }}
                className="pixel-btn-outline text-xs py-1 px-2 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> ADD GOAL
              </button>
            </div>
            <div className="grid gap-2">
              {goals.length === 0 ? (
                <p className="text-[10px] opacity-40 italic text-center py-4 border border-dashed border-[#00ff41]/30">No active goals. Define your AI adoption path.</p>
              ) : (
                goals.map(goal => (
                  <div key={goal.id} className={`retro-border p-3 flex items-center justify-between transition-all ${goal.is_completed ? 'opacity-40 bg-[#0d2b0d]/10' : 'bg-[#0d2b0d]/20'}`}>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleToggleGoal(goal.id, goal.is_completed)}
                        className={`p-1 border-2 transition-all ${goal.is_completed ? 'border-[#00ff41] text-[#00ff41]' : 'border-[#00ff41]/30 text-[#00ff41]/30 hover:border-[#00ff41]'}`}
                      >
                        {goal.is_completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className={`text-xs font-bold ${goal.is_completed ? 'line-through' : ''}`}>{goal.title}</div>
                        <div className="text-[8px] opacity-50 uppercase">{goal.type} // {goal.frequency}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {JSON.parse(goal.loops).map((loop: string) => (
                        <span key={loop} className="text-[6px] border border-[#00ff41]/40 px-1">{loop.toUpperCase()}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Achievements Section */}
          <section className="retro-border bg-[#1a1a1a] p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold tracking-widest flex items-center gap-2">
                <Trophy className="w-4 h-4" /> ACHIEVEMENTS
              </h3>
              <span className="text-[10px] opacity-60">{userAchievements.length} / {achievements.length}</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
              {achievements.map(achievement => {
                const isEarned = userAchievements.some(ua => ua.achievement_id === achievement.id);
                const Icon = ACHIEVEMENT_ICONS[achievement.icon] || Trophy;
                return (
                  <div 
                    key={achievement.id}
                    className={`relative group flex flex-col items-center gap-1 ${isEarned ? 'opacity-100' : 'opacity-20 grayscale'}`}
                  >
                    <div className={`p-2 border-2 ${isEarned ? 'border-[#00ff41] bg-[#00ff41]/10' : 'border-black/10'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-32 bg-[#00ff41] border border-[#00ff41] p-2 text-[8px] opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity text-[#0d2b0d]">
                      <div className="font-bold text-[#0d2b0d] mb-1">{achievement.title.toUpperCase()}</div>
                      <div className="opacity-80">{achievement.description}</div>
                      {isEarned && (
                        <div className="mt-1 text-[6px] opacity-50 italic">
                          EARNED: {new Date(userAchievements.find(ua => ua.achievement_id === achievement.id)!.earned_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 opacity-40 italic text-xs">
          WAITING FOR PROFILE SYNC...
        </div>
      )}

      {/* Achievement Earned Modal */}
      <AnimatePresence>
        {newAchievementEarned && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="retro-border bg-[#1a1a1a] p-8 text-center max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#00ff41]/5 animate-pulse" />
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-block p-4 border-4 border-[#00ff41] bg-[#00ff41]/10 mb-6"
                >
                  {(() => {
                    const Icon = ACHIEVEMENT_ICONS[newAchievementEarned.icon] || Trophy;
                    return <Icon className="w-16 h-16 text-[#00ff41]" />;
                  })()}
                </motion.div>
                <h2 className="text-2xl font-bold mb-2 tracking-tighter">ACHIEVEMENT UNLOCKED!</h2>
                <h3 className="text-xl font-bold text-[#00ff41] mb-4">{newAchievementEarned.title.toUpperCase()}</h3>
                <p className="text-sm opacity-80 mb-8">{newAchievementEarned.description}</p>
                <button 
                  onClick={() => setNewAchievementEarned(null)}
                  className="pixel-btn w-full py-3"
                >
                  AWESOME!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Check-In Modal */}
      <AnimatePresence>
        {showCheckIn && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="retro-border bg-[#1a1a1a] p-6 w-full max-w-md space-y-6"
            >
              <h3 className="text-xl font-bold text-center tracking-widest">DAILY CALIBRATION</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase mb-2">How is change feeling today? (1-5)</label>
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button 
                        key={v}
                        type="button"
                        onClick={() => setCheckInForm({ ...checkInForm, change_temp: v })}
                        className={`flex-1 py-2 border-2 transition-all font-bold ${
                          checkInForm.change_temp === v 
                            ? 'bg-[#00ff41] text-[#0d2b0d] border-[#00ff41]' 
                            : 'border-[#00ff41]/30 text-[#00ff41] hover:border-[#00ff41]'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase mb-2">Primary Pressure Point</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESSURES.map(p => (
                      <button 
                        key={p}
                        type="button"
                        onClick={() => setCheckInForm({ ...checkInForm, pressure: p })}
                        className={`text-[10px] p-2 border transition-all ${
                          checkInForm.pressure === p 
                            ? 'bg-[#00ff41] text-[#0d2b0d] border-[#00ff41]' 
                            : 'border-[#00ff41]/40 text-[#00ff41]/60 hover:border-[#00ff41]'
                        }`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase mb-2">Today's Behavioral Focus</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.keys(CATEGORY_ICONS).map(cat => (
                      <button 
                        key={cat}
                        type="button"
                        onClick={() => setCheckInForm({ ...checkInForm, focus: cat })}
                        className={`text-xs p-2 border-2 transition-all font-bold flex items-center justify-center gap-2 ${
                          checkInForm.focus === cat 
                            ? 'bg-[#00ff41] text-[#0d2b0d] border-[#00ff41]' 
                            : 'border-[#00ff41]/30 text-[#00ff41] hover:border-[#00ff41]'
                        }`}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleCheckIn}
                  className="pixel-btn w-full py-3 mt-4 text-sm"
                >
                  COMPLETE CALIBRATION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddGoal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="retro-border bg-[#1a1a1a] p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">NEW ADOPTION GOAL</h3>
                <button onClick={() => setShowAddGoal(false)}><X /></button>
              </div>
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase mb-1">Goal Title</label>
                  <input 
                    required
                    value={newGoal.title}
                    onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                    className="w-full bg-[#0d2b0d]/40 border-2 border-[#00ff41] p-2 focus:outline-none"
                    placeholder="e.g. Be visible during uncertainty"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase mb-1">Type</label>
                    <select 
                      value={newGoal.type}
                      onChange={e => setNewGoal({...newGoal, type: e.target.value as any})}
                      className="w-full bg-[#0d2b0d]/40 border-2 border-[#00ff41] p-2 focus:outline-none"
                    >
                      <option value="habit">Habit</option>
                      <option value="one-off">One-off</option>
                      <option value="project">Project</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase mb-1">Frequency</label>
                    <select 
                      value={newGoal.frequency}
                      onChange={e => setNewGoal({...newGoal, frequency: e.target.value})}
                      className="w-full bg-[#0d2b0d]/40 border-2 border-[#00ff41] p-2 focus:outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase mb-2">Associated Behaviors</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(CATEGORY_ICONS).map(loop => (
                      <button
                        key={loop}
                        type="button"
                        onClick={() => {
                          const loops = newGoal.loops.includes(loop)
                            ? newGoal.loops.filter(l => l !== loop)
                            : [...newGoal.loops, loop];
                          setNewGoal({ ...newGoal, loops });
                        }}
                        className={`text-[8px] p-1 border transition-all ${newGoal.loops.includes(loop) ? 'bg-[#00ff41] text-[#0d2b0d] border-[#00ff41]' : 'border-[#00ff41]/30 text-[#00ff41]/60'}`}
                      >
                        {loop.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" className="pixel-btn w-full mt-4">
                  ESTABLISH GOAL
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Quest Modal (Admin/Custom) */}
      <AnimatePresence>
        {showAddQuest && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="retro-border bg-[#1a1a1a] p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">NEW CUSTOM QUEST</h3>
                <button onClick={() => setShowAddQuest(false)}><X /></button>
              </div>
              <form onSubmit={handleAddQuest} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase mb-1">Title</label>
                  <input 
                    required
                    value={newQuest.title}
                    onChange={e => setNewQuest({...newQuest, title: e.target.value})}
                    className="w-full bg-[#0d2b0d]/40 border-2 border-[#00ff41] p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase mb-1">Prompt</label>
                  <textarea 
                    required
                    value={newQuest.prompt}
                    onChange={e => setNewQuest({...newQuest, prompt: e.target.value})}
                    className="w-full bg-[#0d2b0d]/40 border-2 border-[#00ff41] p-2 focus:outline-none h-20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase mb-1">Category</label>
                    <select 
                      value={newQuest.category}
                      onChange={e => setNewQuest({...newQuest, category: e.target.value as any})}
                      className="w-full bg-[#0d2b0d]/40 border-2 border-[#00ff41] p-2 focus:outline-none"
                    >
                      {Object.keys(CATEGORY_ICONS).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase mb-1">Difficulty</label>
                    <select 
                      value={newQuest.difficulty}
                      onChange={e => setNewQuest({...newQuest, difficulty: e.target.value as any})}
                      className="w-full bg-[#0d2b0d]/40 border-2 border-[#00ff41] p-2 focus:outline-none"
                    >
                      <option value="tiny">Tiny</option>
                      <option value="small">Small</option>
                      <option value="stretch">Stretch</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="pixel-btn w-full mt-4">
                  INITIALIZE QUEST
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {celebration.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden"
          >
            {/* Confetti-like particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0,
                  rotate: 0 
                }}
                animate={{ 
                  x: (Math.random() - 0.5) * 1000, 
                  y: (Math.random() - 0.5) * 1000,
                  scale: [0, 1, 0.5],
                  rotate: Math.random() * 360
                }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute"
              >
                {i % 3 === 0 ? <Star className="text-yellow-400 fill-yellow-400 w-6 h-6" /> : 
                 i % 3 === 1 ? <Heart className="text-red-400 fill-red-400 w-6 h-6" /> : 
                 <Zap className="text-blue-400 fill-blue-400 w-6 h-6" />}
              </motion.div>
            ))}

            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="bg-[#0d2b0d]/90 border-4 border-[#00ff41] p-8 rounded-2xl text-center shadow-[0_0_50px_rgba(0,255,65,0.3)]"
            >
              <h2 className="text-3xl font-black tracking-tighter text-[#00ff41] mb-2">
                {celebration.type === 'milestone5' ? 'UNSTOPPABLE!' : 
                 celebration.type === 'milestone3' ? 'TRIPLE THREAT!' : 
                 celebration.type === 'goal' ? 'GOAL SET!' : 'QUEST COMPLETE!'}
              </h2>
              <p className="text-xs uppercase tracking-widest opacity-80">
                {celebration.type === 'milestone5' ? '5 TASKS SMASHED TODAY' : 
                 celebration.type === 'milestone3' ? '3 TASKS IN THE BAG' : 
                 celebration.type === 'goal' ? 'ELLIS IS PROUD OF YOUR VISION' : 'ELLIS IS CHEERING FOR YOU'}
              </p>
              <div className="mt-4 text-4xl">
                {celebration.type === 'milestone5' ? '👑' : 
                 celebration.type === 'milestone3' ? '🔥' : 
                 celebration.type === 'goal' ? '🎯' : '✨'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nudge Settings */}
      <div className="mt-8 p-4 retro-border bg-[#0d2b0d]/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#00ff41]" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Daily Nudge Reminders</h3>
          </div>
          <button 
            onClick={handleToggleNudge}
            className={`px-3 py-1 text-[8px] border transition-all ${nudgeSettings.enabled ? 'bg-[#00ff41] text-[#0d2b0d] border-[#00ff41]' : 'border-[#00ff41]/40 text-[#00ff41]'}`}
          >
            {nudgeSettings.enabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
        {nudgeSettings.enabled && (
          <div className="flex items-center gap-4 mt-2">
            <label className="text-[8px] uppercase opacity-60">Nudge Time:</label>
            <input 
              type="time" 
              value={nudgeSettings.time}
              onChange={(e) => handleUpdateNudgeTime(e.target.value)}
              className="bg-black/40 border border-[#00ff41]/30 text-[#00ff41] text-[10px] px-2 py-1 focus:outline-none focus:border-[#00ff41]"
            />
          </div>
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-[#00ff41]/30 flex justify-center">
        <button 
          onClick={handleResetSystem}
          className="pixel-btn-outline px-8 py-4 flex items-center gap-3 text-xs font-black tracking-[0.2em] border-4 border-[#00ff41] bg-[#00ff41]/5 hover:bg-[#00ff41]/20 active:translate-y-1 shadow-[8px_8px_0px_0px_rgba(0,255,65,0.2)]"
        >
          <Trash2 className="w-5 h-5" />
          RESET SYSTEM FOR NEW USER
        </button>
      </div>

      {!isTeams && (
        <footer className="mt-12 text-center text-[10px] opacity-40 uppercase tracking-[0.2em]">
          &copy; 2026 <a href="https://www.spongelearning.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ff41] transition-colors underline underline-offset-4">SPONGE LEARNING</a> // ALL RIGHTS RESERVED
        </footer>
      )}

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="lcd-screen max-w-sm w-full p-8 space-y-6 text-center border-4 border-[#00ff41]"
            >
              <div className="pixel-grid" />
              <ShieldCheck className="w-16 h-16 mx-auto text-[#00ff41] mb-4" />
              <h2 className="text-2xl font-black tracking-tighter">INITIALIZING ELLIS</h2>
              <p className="text-xs opacity-70 leading-relaxed uppercase tracking-widest text-center px-4">
                Welcome, Pioneer. Initializing your behavioral AI adoption profile. Press below to establish a neural connection.
              </p>
              
              <form onSubmit={handleOnboarding} className="space-y-4">
                <button 
                  type="submit" 
                  className="pixel-btn w-full py-4 text-sm mt-4 border-2 border-black"
                  onClick={() => soundService.playInteraction()}
                >
                  ESTABLISH CONNECTION
                </button>
              </form>
              
              <p className="text-[8px] opacity-40 uppercase tracking-widest">
                By connecting, you agree to behavioral data tracking for AI adoption and learning purposes.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Auth Modal */}
      <AnimatePresence>
        {showAdminAuth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="lcd-screen max-w-xs w-full p-6 space-y-6 text-center border-4 border-[#00ff41]"
            >
              <div className="scanline" />
              <Lock className="w-12 h-12 mx-auto text-[#00ff41] mb-2" />
              <h2 className="text-xl font-black tracking-tighter">ADMIN ACCESS</h2>
              <p className="text-[10px] opacity-70 uppercase tracking-widest">
                Restricted Area. Please provide authorization credentials.
              </p>
              
              <form onSubmit={handleAdminAuth} className="space-y-4">
                <div className="space-y-1">
                  <input 
                    type="password"
                    required
                    placeholder="ENTER PASSWORD"
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      setAdminAuthError(false);
                    }}
                    autoFocus
                    className={`w-full bg-[#0d2b0d]/40 border-2 ${adminAuthError ? 'border-red-500' : 'border-[#00ff41]/40'} p-3 text-sm focus:outline-none focus:border-[#00ff41] text-center font-mono`}
                  />
                  {adminAuthError && (
                    <p className="text-[8px] text-red-500 uppercase font-bold">Access Denied: Invalid Credentials</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowAdminAuth(false)}
                    className="border-2 border-[#00ff41]/40 py-2 text-[10px] uppercase hover:bg-[#00ff41]/10"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit" 
                    className="pixel-btn py-2 text-[10px]"
                  >
                    AUTHORIZE
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet Name Edit Modal */}
      <AnimatePresence>
        {showPetNameEdit && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="lcd-screen max-w-xs w-full p-6 space-y-6 border-2 border-[#00ff41]"
            >
              <div className="pixel-grid" />
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-widest">RENAME COMPANION</h3>
                <button 
                  onClick={() => {
                    setShowPetNameEdit(false);
                    soundService.playInteraction();
                  }} 
                  className="hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdatePetName} className="space-y-4">
                <div className="relative">
                  <input 
                    type="text"
                    required
                    maxLength={12}
                    placeholder="New Name"
                    value={tempPetName}
                    onChange={(e) => setTempPetName(e.target.value)}
                    className="w-full bg-[#0d2b0d]/30 border border-[#00ff41]/40 p-3 text-sm focus:outline-none focus:border-[#00ff41] pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      generateRandomName();
                      soundService.playInteraction();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00ff41]/60 hover:text-[#00ff41]"
                    title="Random Name"
                  >
                    <Dice5 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowPetNameEdit(false);
                      soundService.playInteraction();
                    }}
                    className="pixel-btn-outline py-2 text-xs"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit" 
                    className="pixel-btn py-2 text-xs"
                    onClick={() => soundService.playInteraction()}
                  >
                    CONFIRM
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset System Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="lcd-screen max-w-sm w-full p-8 space-y-6 text-center border-4 border-[#00ff41]"
            >
              <div className="pixel-grid" />
              <Trash2 className="w-16 h-16 mx-auto text-[#00ff41] mb-4" />
              <h2 className="text-2xl font-black tracking-tighter text-[#00ff41]">CRITICAL RESET</h2>
              <p className="text-xs opacity-70 leading-relaxed uppercase tracking-widest text-center px-4 text-[#00ff41]">
                This will clear all current session data and return to initial onboarding. Are you sure you want to proceed?
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button 
                  onClick={() => {
                    setShowResetConfirm(false);
                    soundService.playInteraction();
                  }}
                  className="pixel-btn-outline py-3 text-xs"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => {
                    confirmReset();
                    soundService.playInteraction();
                  }}
                  className="pixel-btn bg-red-600 border-red-800 hover:bg-red-700 w-full py-3 text-xs text-white"
                >
                  CONFIRM RESET
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function WeeklySummary({ stats, onClose }: { stats: any, onClose: () => void }) {
  if (!stats) return null;

  const categories = Object.entries(stats.categories || {}).sort((a: any, b: any) => b[1] - a[1]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          WEEKLY PERFORMANCE SUMMARY
        </h2>
        <button 
          onClick={() => {
            onClose();
            soundService.playInteraction();
          }} 
          className="pixel-btn-outline text-xs"
        >
          BACK TO DASHBOARD
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="retro-border p-4 bg-[#0d2b0d]/30 text-center">
          <div className="text-[10px] opacity-60 uppercase mb-1">Total Completions</div>
          <div className="text-3xl font-bold text-[#00ff41]">{stats.totalCompletions}</div>
        </div>
        <div className="retro-border p-4 bg-[#0d2b0d]/30 text-center">
          <div className="text-[10px] opacity-60 uppercase mb-1">Avg Reflection</div>
          <div className="text-3xl font-bold text-[#00ff41]">{stats.avgReflection.toFixed(1)}/10</div>
        </div>
        <div className="retro-border p-4 bg-[#0d2b0d]/30 text-center">
          <div className="text-[10px] opacity-60 uppercase mb-1">Active Days</div>
          <div className="text-3xl font-bold text-[#00ff41]">{Object.keys(stats.dailyCounts || {}).length}</div>
        </div>
      </div>

      <div className="lcd-screen p-6 space-y-6">
        <div className="pixel-grid" />
        <div className="relative z-10">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-[#00ff41]/30 pb-2">Behavioural Balance</h3>
          <div className="space-y-4">
            {categories.map(([cat, count]: any) => (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase">
                  <span>{cat}</span>
                  <span>{count} Quests</span>
                </div>
                <div className="h-2 bg-[#00ff41]/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / stats.totalCompletions) * 100}%` }}
                    className="h-full bg-[#00ff41]"
                  />
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-xs opacity-40 italic text-center py-4">No data recorded for this week yet.</p>
            )}
          </div>
        </div>

        <div className="bg-[#00ff41]/5 p-4 rounded border border-[#00ff41]/20 relative z-10">
          <h4 className="text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
            <Zap className="w-3 h-3" /> Weekly Insight
          </h4>
          <p className="text-xs opacity-80 leading-relaxed">
            {stats.totalCompletions > 5 
              ? "Excellent consistency! You're building strong behavioural momentum. Your focus on " + (categories[0]?.[0] || "growth") + " is showing clear results."
              : "A steady start. Focus on completing at least one 'Tiny' quest daily to maintain your streak and build the habit loop."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function PetSprite({ name, level, mood = 'HAPPY', accessories = {}, interaction = 'none', isMe = false, onClick }: { 
  name: string, 
  level: number, 
  mood?: 'HAPPY' | 'NEUTRAL' | 'SAD', 
  accessories?: any, 
  interaction?: string,
  isMe?: boolean,
  onClick?: () => void
}) {
  return (
    <motion.div
      onClick={onClick}
      animate={{ 
        y: interaction === 'jump' ? [0, -20, 0, -10, 0] : [0, -5, 0],
        x: interaction === 'wiggle' ? [0, -5, 5, -5, 0] : 0,
        scale: interaction === 'heart' ? [1, 1.2, 1, 1.1, 1] : mood === 'HAPPY' ? [1, 1.05, 1] : 1,
      }}
      transition={{ 
        repeat: Infinity, 
        duration: interaction !== 'none' ? 1 : 2 
      }}
      className="relative cursor-pointer group flex flex-col items-center"
    >
      <div className={`w-12 h-12 border-2 ${isMe ? 'border-[#00ff41]' : 'border-[#00ff41]/40'} rounded flex flex-col items-center justify-center bg-[#0d2b0d] relative overflow-hidden`}>
        {/* Accessories */}
        {accessories?.hat === 'crown' && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 text-yellow-400">
            <Crown className="w-3 h-3 fill-yellow-400" />
          </div>
        )}
        {accessories?.glasses === 'cool' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 text-white">
            <Glasses className="w-4 h-4" />
          </div>
        )}

        <div className="text-xl">
          {mood === 'HAPPY' ? '^‿^' : mood === 'NEUTRAL' ? '•‿•' : 'ಠ_ಠ'}
        </div>
      </div>
      <div className="mt-1 text-[6px] uppercase font-bold bg-black/60 px-1 rounded whitespace-nowrap">
        {name} (L{level})
      </div>
    </motion.div>
  );
}

function PetPlain({ leaderboard, avgTrust, currentUserEmail }: { leaderboard: any[], avgTrust: number, currentUserEmail: string }) {
  const [petPositions, setPetPositions] = useState<any[]>([]);

  useEffect(() => {
    // Initialize positions
    const positions = leaderboard.map((user, i) => {
      // Spread based on trust. High trust (100) -> radius 50. Low trust (0) -> radius 200.
      const radius = 150 - (avgTrust * 1.2); 
      const angle = (i / leaderboard.length) * Math.PI * 2;
      return {
        email: user.user_email,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        targetX: Math.cos(angle) * radius,
        targetY: Math.sin(angle) * radius,
        interaction: 'none' as any,
        lastInteraction: 0
      };
    });
    setPetPositions(positions);
  }, [leaderboard, avgTrust]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPetPositions(prev => prev.map(p => {
        const now = Date.now();
        let interaction = p.interaction;
        
        // Randomly start an interaction if close to another pet and trust is high
        if (now - p.lastInteraction > 5000 && Math.random() > 0.7) {
          const others = prev.filter(o => o.email !== p.email);
          const nearby = others.find(o => {
            const dist = Math.sqrt(Math.pow(o.x - p.x, 2) + Math.pow(o.y - p.y, 2));
            return dist < 60;
          });

          if (nearby && avgTrust > 60) {
            interaction = Math.random() > 0.5 ? 'jump' : 'heart';
          } else if (Math.random() > 0.9) {
            interaction = 'wiggle';
          }
        }

        // Reset interaction after some time
        if (interaction !== 'none' && now - p.lastInteraction > 2000) {
          interaction = 'none';
        }

        // Slight wandering
        const wanderX = (Math.random() - 0.5) * 10;
        const wanderY = (Math.random() - 0.5) * 10;

        return {
          ...p,
          x: p.x + (p.targetX - p.x) * 0.1 + wanderX,
          y: p.y + (p.targetY - p.y) * 0.1 + wanderY,
          interaction,
          lastInteraction: interaction !== 'none' && p.interaction === 'none' ? now : p.lastInteraction
        };
      }));
    }, 200);
    return () => clearInterval(interval);
  }, [avgTrust]);

  return (
    <div className="relative w-full h-64 bg-[#0d2b0d]/50 border-2 border-[#00ff41]/20 rounded-lg overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00ff41 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      {/* Interaction Icons (Coffee, etc) */}
      {petPositions.map(p => {
        if (p.interaction === 'heart' || p.interaction === 'jump') {
          return (
            <motion.div
              key={`icon-${p.email}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, y: -20 }}
              exit={{ opacity: 0, scale: 0 }}
              style={{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)` }}
              className="absolute z-20 pointer-events-none"
            >
              {p.interaction === 'heart' ? <Heart className="w-4 h-4 text-red-500 fill-current" /> : <Coffee className="w-4 h-4 text-brown-400" />}
            </motion.div>
          );
        }
        return null;
      })}

      {petPositions.map(p => {
        const user = leaderboard.find(u => u.user_email === p.email);
        if (!user) return null;
        return (
          <div 
            key={p.email} 
            className="absolute transition-all duration-500 ease-out"
            style={{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)`, transform: 'translate(-50%, -50%)' }}
          >
            <PetSprite 
              name={user.pet_name} 
              level={user.level} 
              isMe={user.user_email === currentUserEmail}
              interaction={p.interaction}
              accessories={user.accessories ? JSON.parse(user.accessories) : {}}
            />
          </div>
        );
      })}

      {/* Trust Indicator Overlay */}
      <div className="absolute bottom-2 right-2 text-[8px] uppercase opacity-40 font-mono">
        Social Density: {avgTrust > 70 ? 'High (Cohesive)' : avgTrust > 40 ? 'Medium (Distributed)' : 'Low (Isolated)'}
      </div>
    </div>
  );
}

function EcosystemView({ data, leaderboard, currentUserEmail, onClose }: { data: any, leaderboard: any[], currentUserEmail: string, onClose: () => void }) {
  if (!data) return null;

  const health = data.health || 100;
  const isDegraded = health < 40;
  const isCritical = health < 20;

  const stats = [
    { label: 'Psychological Safety', value: data.avg_trust, icon: ShieldCheck },
    { label: 'Change Leadership', value: data.avg_clarity, icon: Compass },
    { label: 'AI Fluency', value: data.avg_momentum, icon: Zap },
    { label: 'Orchestration', value: data.avg_momentum, icon: Users },
    { label: 'Coaching Capability', value: data.avg_trust, icon: Ear },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 relative transition-all duration-1000 ${isCritical ? 'grayscale contrast-125' : isDegraded ? 'grayscale-[0.5]' : ''}`}
    >
      {/* Visual Degradation Overlays */}
      {isDegraded && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          {isCritical && <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ repeat: Infinity, duration: 0.1 }} className="absolute inset-0 bg-red-900/10" />}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className={`w-6 h-6 ${isCritical ? 'text-red-500 animate-pulse' : 'text-[#00ff41]'}`} />
            COLLECTIVE ECOSYSTEM
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#0d2b0d]/40 border border-[#00ff41]/30 rounded">
            <span className="text-[8px] uppercase opacity-60">System Integrity:</span>
            <span className={`text-xs font-mono font-bold ${health > 70 ? 'text-[#00ff41]' : health > 30 ? 'text-yellow-600' : 'text-red-500'}`}>
              {Math.round(health)}%
            </span>
          </div>
        </div>
        <button 
          onClick={() => {
            onClose();
            soundService.playInteraction();
          }} 
          className="pixel-btn-outline text-xs"
        >
          BACK TO DASHBOARD
        </button>
      </div>

      {/* Collective Pet Plain */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <h3 className="text-[10px] uppercase font-bold tracking-widest opacity-60">Collective Pet Plain</h3>
          <span className="text-[8px] opacity-40 italic">Pets interact more when Psychological Safety is high</span>
        </div>
        <PetPlain leaderboard={leaderboard} avgTrust={data.avg_trust} currentUserEmail={currentUserEmail} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="lcd-screen p-6 space-y-6">
          <div className="pixel-grid" />
          <div className="relative z-10">
            <div className="flex justify-between items-center border-b border-[#00ff41]/30 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest">Global Health</h3>
              {isDegraded && <span className="text-[8px] text-red-500 animate-pulse font-bold">CRITICAL DEGRADATION DETECTED</span>}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="retro-border p-3 bg-[#0d2b0d]/30 text-center">
                <div className="text-[8px] opacity-60 uppercase mb-1">Total Adopters</div>
                <div className="text-xl font-bold text-[#00ff41]">{data.total_users}</div>
              </div>
              <div className="retro-border p-3 bg-[#0d2b0d]/30 text-center">
                <div className="text-[8px] opacity-60 uppercase mb-1">Quests Completed</div>
                <div className="text-xl font-bold text-[#00ff41]">{data.total_completions}</div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              {stats.map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase">
                    <span className="flex items-center gap-1"><s.icon className="w-3 h-3" /> {s.label}</span>
                    <span>{Math.round(s.value)}%</span>
                  </div>
                  <div className="h-2 bg-[#00ff41]/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${s.value}%` }}
                      className={`h-full ${isCritical ? 'bg-red-500' : 'bg-[#00ff41]'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lcd-screen p-6 space-y-6">
          <div className="pixel-grid" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-[#00ff41]/30 pb-2">Active Global Goals</h3>
            <div className="space-y-4 mt-4">
              {data.active_goals && data.active_goals.length > 0 ? (
                data.active_goals.map((goal: any) => (
                  <div key={goal.id} className="space-y-2 p-3 bg-[#0d2b0d]/20 border border-[#00ff41]/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-[#00ff41]">{goal.title}</div>
                        <div className="text-[8px] opacity-60 uppercase">{goal.category}</div>
                      </div>
                      <div className="text-[10px] font-mono">{goal.current_value} / {goal.target_value}</div>
                    </div>
                    <div className="h-1.5 bg-[#00ff41]/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(goal.current_value / goal.target_value) * 100}%` }}
                        className="h-full bg-[#00ff41]"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] opacity-40 italic py-4 text-center">No active global goals. The ecosystem is in maintenance mode.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="lcd-screen p-6 space-y-6">
          <div className="pixel-grid" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-[#00ff41]/30 pb-2">Recent Activity</h3>
            <div className="space-y-3 mt-4">
              {data.recent_activity.map((act: any, i: number) => (
                <div key={i} className="text-[10px] p-2 border border-[#00ff41]/10 bg-[#0d2b0d]/20 flex justify-between items-center">
                  <div>
                    <span className="text-[#00ff41] font-bold">{act.user_email.split('@')[0]}</span>
                    <span className="opacity-60"> completed </span>
                    <span className="italic">"{act.title}"</span>
                  </div>
                  <div className="opacity-40">{new Date(act.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lcd-screen p-6">
          <div className="pixel-grid" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-[#00ff41]/30 pb-2 mb-4">Top Contributors</h3>
            <div className="grid grid-cols-1 gap-2">
              {leaderboard.slice(0, 5).map((user, index) => {
                const isMe = user.user_email === currentUserEmail;
                return (
                  <div key={user.user_email} className={`flex items-center justify-between p-2 border ${isMe ? 'bg-[#00ff41]/10 border-[#00ff41]' : 'border-[#00ff41]/10'} text-[10px]`}>
                    <div className="flex items-center gap-2">
                      <span className="opacity-40">#{index + 1}</span>
                      <span className="font-bold">{user.pet_name}</span>
                      <span className="opacity-40 text-[8px]">({user.user_email.split('@')[0]})</span>
                    </div>
                    <div className="font-mono">Lvl {user.level}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AdminPanel({ userEmail, allQuests, onToggle, onClose, onAddQuest, onDeleteQuest, onUpdateQuest, onRefresh }: { 
  userEmail: string,
  allQuests: Quest[], 
  onToggle: (id: number, status: number) => void, 
  onClose: () => void, 
  onAddQuest: (q: any) => Promise<void>,
  onDeleteQuest: (id: number) => Promise<void>,
  onUpdateQuest: (id: number, q: any) => Promise<void>,
  onRefresh: () => void
}) {
  const categories = ['Psychological Safety', 'Change Leadership', 'AI Fluency', 'Orchestration', 'Coaching Capability'];
  const [activeTab, setActiveTab] = useState<'quests' | 'campaigns' | 'reporting' | 'ecosystem' | 'teams'>('quests');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', category: 'Psychological Safety', prompt: '', difficulty: 'tiny' });
  const [newQuest, setNewQuest] = useState({ title: '', category: 'Psychological Safety', prompt: '', difficulty: 'tiny', tags: '' });
  const [dailyPackIds, setDailyPackIds] = useState<number[]>([]);
  const [wardrobe, setWardrobe] = useState({ hat: 'none', glasses: 'none' });
  const [teamsConfig, setTeamsConfig] = useState({
    webhook_url: '',
    is_enabled: false,
    notify_on_completion: false,
    notify_on_milestone: true,
    daily_summary_time: '18:00'
  });

  // Campaign State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    theme_tag: 'clarity',
    priority_level: 1,
    mandatory_quest: 0,
    reward_type: 'badge',
    focus_loops: [] as string[],
    quest_pool: [] as number[],
    business_context_note: ''
  });

  const [ecosystemGoals, setEcosystemGoals] = useState<any[]>([]);
  const [showEcosystemGoalForm, setShowEcosystemGoalForm] = useState(false);
  const [newEcosystemGoal, setNewEcosystemGoal] = useState({
    title: '',
    description: '',
    target_value: 10,
    category: 'Psychological Safety'
  });

  useEffect(() => {
    fetch('/api/admin/daily-pack').then(res => res.json()).then(data => setDailyPackIds(data || []));
    fetch('/api/admin/campaigns').then(res => res.json()).then(data => setCampaigns(data || []));
    fetch('/api/admin/ecosystem-goals').then(res => res.json()).then(data => setEcosystemGoals(data || []));
    fetch('/api/admin/teams-config').then(res => res.json()).then(data => {
      if (data) setTeamsConfig({
        ...data,
        is_enabled: data.is_enabled === 1,
        notify_on_completion: data.notify_on_completion === 1,
        notify_on_milestone: data.notify_on_milestone === 1
      });
    });
    fetch('/api/stats', { headers: { 'x-user-email': userEmail } })
      .then(res => res.json())
      .then(data => {
        if (data.accessories) setWardrobe(JSON.parse(data.accessories));
      });
  }, [userEmail]);

  const fetchCampaigns = async () => {
    const res = await fetch('/api/admin/campaigns');
    setCampaigns(await res.json());
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCampaign)
    });
    setShowCampaignForm(false);
    fetchCampaigns();
    onRefresh();
  };

  const handleToggleCampaignStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'live' ? 'archived' : 'live';
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;

    await fetch(`/api/admin/campaigns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...campaign, status: nextStatus })
    });
    fetchCampaigns();
    onRefresh();
  };

  const handleDeleteCampaign = async (id: number) => {
    if (confirm('Delete this campaign?')) {
      await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      fetchCampaigns();
      onRefresh();
    }
  };

  const fetchEcosystemGoals = async () => {
    const res = await fetch('/api/admin/ecosystem-goals');
    setEcosystemGoals(await res.json());
  };

  const handleAddEcosystemGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/ecosystem-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEcosystemGoal)
    });
    setShowEcosystemGoalForm(false);
    fetchEcosystemGoals();
    onRefresh();
  };

  const handleDeleteEcosystemGoal = async (id: number) => {
    if (confirm('Delete this ecosystem goal?')) {
      await fetch(`/api/admin/ecosystem-goals/${id}`, { method: 'DELETE' });
      fetchEcosystemGoals();
      onRefresh();
    }
  };

  const handleSaveDailyPack = async () => {
    await fetch('/api/admin/daily-pack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questIds: dailyPackIds })
    });
    soundService.playSuccess();
    alert('Global Daily Pack Updated!');
    onRefresh();
  };

  const handleSaveWardrobe = async (newWardrobe: any) => {
    setWardrobe(newWardrobe);
    soundService.playInteraction();
    await fetch('/api/customize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
      body: JSON.stringify({ accessories: newWardrobe })
    });
    onRefresh();
  };

  const handleSaveTeamsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/teams-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamsConfig)
    });
    soundService.playSuccess();
    alert('Teams Configuration Saved!');
  };

  const toggleInDailyPack = (id: number) => {
    soundService.playInteraction();
    setDailyPackIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddQuest(newQuest);
    setNewQuest({ title: '', category: 'Psychological Safety', prompt: '', difficulty: 'tiny', tags: '' });
    setShowAddForm(false);
  };

  const startEditing = (q: Quest) => {
    setEditingId(q.id);
    setEditForm({ title: q.title, category: q.category, prompt: q.prompt, difficulty: q.difficulty });
  };

  const handleUpdate = async (id: number) => {
    await onUpdateQuest(id, editForm);
    setEditingId(null);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          BEHAVIOUR CHANGE ENGINE
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setActiveTab('quests');
              soundService.playInteraction();
            }}
            className={`text-[10px] px-3 py-1 border ${activeTab === 'quests' ? 'bg-[#00ff41] text-[#0d2b0d]' : 'border-[#00ff41]/40'}`}
          >
            QUEST BANK
          </button>
          <button 
            onClick={() => {
              setActiveTab('campaigns');
              soundService.playInteraction();
            }}
            className={`text-[10px] px-3 py-1 border ${activeTab === 'campaigns' ? 'bg-[#00ff41] text-[#0d2b0d]' : 'border-[#00ff41]/40'}`}
          >
            CAMPAIGNS
          </button>
          <button 
            onClick={() => {
              setActiveTab('reporting');
              soundService.playInteraction();
            }}
            className={`text-[10px] px-3 py-1 border ${activeTab === 'reporting' ? 'bg-[#00ff41] text-[#0d2b0d]' : 'border-[#00ff41]/40'}`}
          >
            REPORTING
          </button>
          <button 
            onClick={() => {
              setActiveTab('ecosystem');
              soundService.playInteraction();
            }}
            className={`text-[10px] px-3 py-1 border ${activeTab === 'ecosystem' ? 'bg-[#00ff41] text-[#0d2b0d]' : 'border-[#00ff41]/40'}`}
          >
            ECOSYSTEM
          </button>
          <button 
            onClick={() => {
              setActiveTab('teams');
              soundService.playInteraction();
            }}
            className={`text-[10px] px-3 py-1 border ${activeTab === 'teams' ? 'bg-[#00ff41] text-[#0d2b0d]' : 'border-[#00ff41]/40'}`}
          >
            TEAMS
          </button>
          <button onClick={onClose} className="pixel-btn-outline text-xs ml-4">EXIT CONSOLE</button>
        </div>
      </div>

      <div className="lcd-screen p-4 space-y-6">
        {activeTab === 'quests' && (
          <>
        <div className="grid grid-cols-2 gap-4 border-b border-[#00ff41]/30 pb-4">
          <div>
            <h3 className="text-[10px] font-bold mb-2 uppercase tracking-widest">WARDROBE</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSaveWardrobe({...wardrobe, hat: wardrobe.hat === 'crown' ? 'none' : 'crown'})}
                className={`p-2 border ${wardrobe.hat === 'crown' ? 'bg-[#00ff41] text-[#0d2b0d]' : 'border-[#00ff41]/40'}`}
              >
                <Crown className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleSaveWardrobe({...wardrobe, glasses: wardrobe.glasses === 'cool' ? 'none' : 'cool'})}
                className={`p-2 border ${wardrobe.glasses === 'cool' ? 'bg-[#00ff41] text-[#0d2b0d]' : 'border-[#00ff41]/40'}`}
              >
                <Glasses className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <button 
              onClick={handleSaveDailyPack}
              className="pixel-btn text-[8px] py-1"
            >
              SAVE GLOBAL DAILY PACK ({dailyPackIds.length})
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center border-b border-[#00ff41]/30 pb-2">
          <h3 className="text-sm font-bold uppercase tracking-widest">GLOBAL REPOSITORY</h3>
          <button 
            onClick={() => {
              setShowAddForm(!showAddForm);
              soundService.playInteraction();
            }}
            className="text-[10px] px-2 py-1 border border-[#00ff41] hover:bg-[#00ff41] hover:text-[#0d2b0d] transition-all"
          >
            {showAddForm ? 'CANCEL' : '+ NEW QUEST'}
          </button>
        </div>

        {showAddForm && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-4 border-b border-[#00ff41]/20 pb-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[8px] uppercase mb-1">Quest Title</label>
                <input 
                  value={newQuest.title}
                  onChange={e => setNewQuest({...newQuest, title: e.target.value})}
                  className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs focus:outline-none focus:border-[#00ff41]"
                  placeholder="e.g., Morning Huddle"
                  required
                />
              </div>
              <div>
                <label className="block text-[8px] uppercase mb-1">Category</label>
                <select 
                  value={newQuest.category}
                  onChange={e => setNewQuest({...newQuest, category: e.target.value})}
                  className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs focus:outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] uppercase mb-1">Difficulty</label>
                <select 
                  value={newQuest.difficulty}
                  onChange={e => setNewQuest({...newQuest, difficulty: e.target.value})}
                  className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs focus:outline-none"
                >
                  <option value="tiny">Tiny</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[8px] uppercase mb-1">Behavioral Prompt</label>
                <textarea 
                  value={newQuest.prompt}
                  onChange={e => setNewQuest({...newQuest, prompt: e.target.value})}
                  className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs focus:outline-none h-20"
                  placeholder="What should the adopter do?"
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="pixel-btn w-full py-2 text-[10px]"
              onClick={() => soundService.playInteraction()}
            >
              DEPLOY TO GLOBAL BANK
            </button>
          </motion.form>
        )}
        
        <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {categories.map(cat => (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-[#00ff41]/20"></div>
                <h4 className="text-[10px] font-bold text-[#00ff41] uppercase tracking-[0.2em]">{cat}</h4>
                <div className="h-[1px] flex-1 bg-[#00ff41]/20"></div>
              </div>
              
              <div className="grid gap-2">
                {allQuests.filter(q => q.category === cat).map(q => (
                  <div key={q.id} className="flex flex-col p-3 border border-[#00ff41]/20 bg-[#0d2b0d]/30 hover:border-[#00ff41]/50 transition-colors gap-3">
                    {editingId === q.id ? (
                      <div className="space-y-3">
                        <input 
                          value={editForm.title}
                          onChange={e => setEditForm({...editForm, title: e.target.value})}
                          className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/60 p-1 text-xs focus:outline-none"
                        />
                        <textarea 
                          value={editForm.prompt}
                          onChange={e => setEditForm({...editForm, prompt: e.target.value})}
                          className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/60 p-1 text-[10px] focus:outline-none h-16"
                        />
                        <div className="flex justify-between items-center">
                          <select 
                            value={editForm.difficulty}
                            onChange={e => setEditForm({...editForm, difficulty: e.target.value})}
                            className="bg-[#0d2b0d]/40 border border-[#00ff41]/60 p-1 text-[10px] focus:outline-none"
                          >
                            <option value="tiny">Tiny</option>
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                          </select>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setEditingId(null);
                                  soundService.playInteraction();
                                }} 
                                className="text-[8px] opacity-60 hover:opacity-100"
                              >
                                CANCEL
                              </button>
                              <button 
                                onClick={() => {
                                  handleUpdate(q.id);
                                  soundService.playInteraction();
                                }} 
                                className="flex items-center gap-1 text-[8px] bg-[#00ff41] text-[#0d2b0d] px-2 py-1 rounded"
                              >
                                <Save className="w-3 h-3" /> SAVE
                              </button>
                            </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-xs font-bold">{q.title}</div>
                            <div className="text-[8px] opacity-60 uppercase">{q.difficulty} // {q.prompt.substring(0, 60)}...</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => toggleInDailyPack(q.id)}
                              className={`text-[8px] px-2 py-1 border transition-all ${dailyPackIds.includes(q.id) ? 'bg-yellow-400 text-black border-yellow-400' : 'border-yellow-400/30 text-yellow-400/50'}`}
                            >
                              {dailyPackIds.includes(q.id) ? 'IN DAILY PACK' : 'ADD TO DAILY'}
                            </button>
                            <button 
                              onClick={() => onToggle(q.id, q.is_active)}
                              className={`text-[8px] px-2 py-1 border transition-all ${q.is_active ? 'bg-[#00ff41] text-[#0d2b0d] border-[#00ff41]' : 'border-[#00ff41]/30 text-[#00ff41]/50'}`}
                            >
                              {q.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </button>
                            <button onClick={() => startEditing(q)} className="p-1 hover:text-[#00ff41] transition-colors">
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button onClick={() => onDeleteQuest(q.id)} className="p-1 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {allQuests.filter(q => q.category === cat).length === 0 && (
                  <p className="text-[8px] opacity-30 italic text-center">No quests in this bank.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    )}

    {activeTab === 'campaigns' && (
      <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#00ff41]/30 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest">BEHAVIOUR SPRINTS</h3>
              <button 
                onClick={() => setShowCampaignForm(!showCampaignForm)}
                className="text-[10px] px-2 py-1 border border-[#00ff41] hover:bg-[#00ff41] hover:text-[#0d2b0d] transition-all"
              >
                {showCampaignForm ? 'CANCEL' : '+ CREATE CAMPAIGN'}
              </button>
            </div>

            {showCampaignForm && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                onSubmit={handleAddCampaign}
                className="space-y-4 border-b border-[#00ff41]/20 pb-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[8px] uppercase mb-1">Campaign Title</label>
                    <input 
                      value={newCampaign.title}
                      onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}
                      className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs focus:outline-none"
                      placeholder="e.g., Clarity Under Pressure"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase mb-1">Start Date</label>
                    <input 
                      type="date"
                      value={newCampaign.start_date}
                      onChange={e => setNewCampaign({...newCampaign, start_date: e.target.value})}
                      className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase mb-1">End Date</label>
                    <input 
                      type="date"
                      value={newCampaign.end_date}
                      onChange={e => setNewCampaign({...newCampaign, end_date: e.target.value})}
                      className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase mb-1">Influence Mode (1-4)</label>
                    <select 
                      value={newCampaign.priority_level}
                      onChange={e => setNewCampaign({...newCampaign, priority_level: parseInt(e.target.value)})}
                      className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs focus:outline-none"
                    >
                      <option value={1}>1: Light Nudge</option>
                      <option value={2}>2: Daily Injected Quest</option>
                      <option value={3}>3: Full Override</option>
                      <option value={4}>4: Locked Path</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase mb-1">Theme Tag</label>
                    <input 
                      value={newCampaign.theme_tag}
                      onChange={e => setNewCampaign({...newCampaign, theme_tag: e.target.value})}
                      className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[8px] uppercase mb-1">Business Context Note (Shown to Users)</label>
                    <input 
                      value={newCampaign.business_context_note}
                      onChange={e => setNewCampaign({...newCampaign, business_context_note: e.target.value})}
                      className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs focus:outline-none"
                      placeholder="e.g., This week we're building clarity under pressure."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[8px] uppercase mb-1">Quest Pool (Select Quests)</label>
                    <div className="max-h-32 overflow-y-auto border border-[#00ff41]/20 p-2 space-y-1">
                      {allQuests.map(q => (
                        <label key={q.id} className="flex items-center gap-2 text-[10px] cursor-pointer hover:bg-[#00ff41]/10 p-1">
                          <input 
                            type="checkbox"
                            checked={newCampaign.quest_pool.includes(q.id)}
                            onChange={() => {
                              const pool = newCampaign.quest_pool.includes(q.id)
                                ? newCampaign.quest_pool.filter(id => id !== q.id)
                                : [...newCampaign.quest_pool, q.id];
                              setNewCampaign({...newCampaign, quest_pool: pool});
                            }}
                            className="accent-[#00ff41]"
                          />
                          <span>{q.title} ({q.category})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <button type="submit" className="pixel-btn w-full py-2 text-[10px]">INITIALIZE CAMPAIGN</button>
              </motion.form>
            )}

            <div className="space-y-4">
              {campaigns.map(c => (
                <div key={c.id} className="retro-border p-4 bg-[#0d2b0d]/30 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-[#00ff41]">{c.title.toUpperCase()}</h4>
                      <p className="text-[9px] opacity-60">{c.start_date} — {c.end_date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleToggleCampaignStatus(c.id, c.status)}
                        className={`text-[8px] px-2 py-1 border ${c.status === 'live' ? 'bg-[#00ff41] text-[#0d2b0d]' : 'border-[#00ff41]/40'}`}
                      >
                        {c.status.toUpperCase()}
                      </button>
                      <button onClick={() => handleDeleteCampaign(c.id)} className="p-1 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[8px] uppercase opacity-70">
                    <div className="flex items-center gap-1"><Target className="w-2 h-2" /> MODE {c.priority_level}</div>
                    <div className="flex items-center gap-1"><Activity className="w-2 h-2" /> {JSON.parse(c.quest_pool).length} QUESTS</div>
                    <div className="flex items-center gap-1"><Trophy className="w-2 h-2" /> {c.reward_type}</div>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && (
                <p className="text-[10px] opacity-30 italic text-center py-8">No campaigns scheduled.</p>
              )}
            </div>
          </div>
        )}
        {activeTab === 'reporting' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#00ff41]/30 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest">DATA EXPORT & BI CONNECT</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="retro-border p-4 bg-[#0d2b0d]/30 space-y-4">
                <h4 className="text-xs font-bold text-[#00ff41] uppercase">Power BI / Tableau Integration</h4>
                <p className="text-[10px] opacity-70 leading-relaxed">
                  To avoid "WebBrowserContents" errors in Power BI, use the <strong>CSV Endpoint</strong> or the <strong>Advanced Editor</strong> method.
                </p>
                
                <div className="space-y-2">
                  <label className="text-[8px] uppercase opacity-50">Option A: CSV (Recommended)</label>
                  <div className="bg-black/40 p-2 rounded border border-[#00ff41]/20 font-mono text-[9px] break-all text-[#00ff41]">
                    {window.location.origin}/api/admin/reporting/completions.csv
                  </div>
                  <button 
                    onClick={() => window.open('/api/admin/reporting/completions.csv', '_blank')}
                    className="pixel-btn w-full py-1 text-[8px]"
                  >
                    DOWNLOAD CSV
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] uppercase opacity-50">Option B: JSON API</label>
                  <div className="bg-black/40 p-2 rounded border border-[#00ff41]/20 font-mono text-[9px] break-all text-[#00ff41]">
                    {window.location.origin}/api/admin/reporting/export
                  </div>
                </div>
              </div>

              <div className="retro-border p-4 bg-[#0d2b0d]/30 space-y-4">
                <h4 className="text-xs font-bold text-[#00ff41] uppercase">Data Schema Info</h4>
                <ul className="text-[9px] space-y-2 opacity-70">
                  <li className="flex justify-between"><span>Completions</span> <span className="text-[#00ff41]">Flattened JSON</span></li>
                  <li className="flex justify-between"><span>Check-ins</span> <span className="text-[#00ff41]">Daily Mood/Pressure</span></li>
                  <li className="flex justify-between"><span>User Stats</span> <span className="text-[#00ff41]">Level/XP/Streak</span></li>
                  <li className="flex justify-between"><span>Campaigns</span> <span className="text-[#00ff41]">Progress per Sprint</span></li>
                </ul>
                <div className="p-2 bg-[#00ff41]/5 border border-[#00ff41]/10 rounded">
                  <p className="text-[8px] italic">Note: All timestamps are in ISO 8601 format for easy parsing in Power Query.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#00ff41]/10 p-4 rounded border border-[#00ff41]/30">
              <h4 className="text-[10px] font-bold uppercase mb-2">Power BI Troubleshooting</h4>
              <p className="text-[9px] opacity-80 leading-relaxed">
                If you see an error about <strong>WebBrowserContents</strong>, it means Power BI is trying to scrape the page as HTML. 
                <br /><br />
                <strong>Fix:</strong> In Power BI, go to <strong>Get Data &gt; Web</strong>, choose <strong>Basic</strong>, and paste the <strong>CSV URL</strong> above. 
                Alternatively, use the <strong>Advanced Editor</strong> and ensure your query starts with: 
                <code className="bg-black/40 px-1 text-[#00ff41]">Source = Csv.Document(Web.Contents("URL_HERE"))</code>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'ecosystem' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#00ff41]/30 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest">ECOSYSTEM GOALS</h3>
              <button 
                onClick={() => setShowEcosystemGoalForm(!showEcosystemGoalForm)}
                className="text-[10px] px-2 py-1 border border-[#00ff41] hover:bg-[#00ff41] hover:text-[#0d2b0d] transition-all"
              >
                {showEcosystemGoalForm ? 'CANCEL' : '+ NEW GLOBAL GOAL'}
              </button>
            </div>

            {showEcosystemGoalForm && (
              <form onSubmit={handleAddEcosystemGoal} className="space-y-4 bg-[#0d2b0d]/20 p-4 border border-[#00ff41]/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[8px] uppercase mb-1">Goal Title</label>
                    <input 
                      value={newEcosystemGoal.title}
                      onChange={e => setNewEcosystemGoal({...newEcosystemGoal, title: e.target.value})}
                      className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase mb-1">Target Completions</label>
                    <input 
                      type="number"
                      value={newEcosystemGoal.target_value}
                      onChange={e => setNewEcosystemGoal({...newEcosystemGoal, target_value: parseInt(e.target.value)})}
                      className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase mb-1">Category</label>
                    <select 
                      value={newEcosystemGoal.category}
                      onChange={e => setNewEcosystemGoal({...newEcosystemGoal, category: e.target.value})}
                      className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs"
                    >
                      {Object.keys(CATEGORY_ICONS).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="pixel-btn w-full py-2 text-[10px]">ACTIVATE GLOBAL GOAL</button>
              </form>
            )}

            <div className="space-y-2">
              {ecosystemGoals.map(goal => (
                <div key={goal.id} className="p-3 border border-[#00ff41]/20 bg-[#0d2b0d]/10 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold">{goal.title}</div>
                    <div className="text-[8px] opacity-60 uppercase">{goal.category} • TARGET: {goal.target_value}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] font-mono">{goal.current_value} / {goal.target_value}</div>
                    <span className={`text-[8px] px-2 py-0.5 rounded ${goal.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-[#00ff41]/20 text-[#00ff41]'}`}>
                      {goal.status.toUpperCase()}
                    </span>
                    <button onClick={() => handleDeleteEcosystemGoal(goal.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#00ff41]/30 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest">Microsoft Teams Integration</h3>
            </div>
            
            <form onSubmit={handleSaveTeamsConfig} className="space-y-4 max-w-lg">
              <div className="flex items-center justify-between p-3 bg-[#00ff41]/5 border border-[#00ff41]/20 rounded">
                <div>
                  <div className="text-xs font-bold">Enable Integration</div>
                  <div className="text-[8px] opacity-60">Send updates to a Teams channel via Webhook</div>
                </div>
                <button 
                  type="button"
                  onClick={() => setTeamsConfig({...teamsConfig, is_enabled: !teamsConfig.is_enabled})}
                  className={`px-3 py-1 text-[8px] border ${teamsConfig.is_enabled ? 'bg-[#00ff41] text-[#0d2b0d] border-[#00ff41]' : 'border-[#00ff41]/40'}`}
                >
                  {teamsConfig.is_enabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {teamsConfig.is_enabled && (
                <>
                  <div>
                    <label className="block text-[8px] uppercase mb-1">Incoming Webhook URL</label>
                    <input 
                      type="url"
                      value={teamsConfig.webhook_url}
                      onChange={e => setTeamsConfig({...teamsConfig, webhook_url: e.target.value})}
                      className="w-full bg-[#0d2b0d]/40 border border-[#00ff41]/40 p-2 text-xs focus:outline-none focus:border-[#00ff41]"
                      placeholder="https://outlook.office.com/webhook/..."
                      required
                    />
                    <p className="text-[8px] opacity-40 mt-1">Create this in Teams via: Channel Settings &gt; Connectors &gt; Incoming Webhook</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={teamsConfig.notify_on_completion}
                        onChange={e => setTeamsConfig({...teamsConfig, notify_on_completion: e.target.checked})}
                        className="accent-[#00ff41]"
                      />
                      <label className="text-[8px] uppercase">Notify on every completion</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={teamsConfig.notify_on_milestone}
                        onChange={e => setTeamsConfig({...teamsConfig, notify_on_milestone: e.target.checked})}
                        className="accent-[#00ff41]"
                      />
                      <label className="text-[8px] uppercase">Notify on Ecosystem Goals</label>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                    <h4 className="text-[10px] font-bold mb-1">TEAMS APP STORE TIP</h4>
                    <p className="text-[9px] opacity-80 leading-relaxed">
                      To list Ellis in your organization's App Store, use the following URL as your Tab URL:
                      <br />
                      <code className="bg-black/40 px-1 text-[#00ff41] break-all">{window.location.origin}/?mode=teams</code>
                    </p>
                  </div>
                </>
              )}

              <button type="submit" className="pixel-btn w-full py-2 text-[10px]">SAVE TEAMS CONFIGURATION</button>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
}


