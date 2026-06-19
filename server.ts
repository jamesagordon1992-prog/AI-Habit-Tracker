import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("ellis_v6.db");

// Initialize Database
db.exec(`
  -- DELETE FROM quests; 
  
  CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT DEFAULT 'tiny',
    estimated_minutes INTEGER DEFAULT 5,
    tags TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    is_system INTEGER DEFAULT 0,
    evidence_prompt TEXT,
    reflection_prompt TEXT
  );

  CREATE TABLE IF NOT EXISTS user_stats (
    user_email TEXT PRIMARY KEY,
    pet_name TEXT DEFAULT 'Ellis',
    happiness INTEGER DEFAULT 50,
    experience INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    last_completed_date TEXT,
    stat_clarity INTEGER DEFAULT 50,
    stat_trust INTEGER DEFAULT 50,
    stat_momentum INTEGER DEFAULT 50,
    stat_energy INTEGER DEFAULT 50,
    last_stat_update INTEGER,
    accessories TEXT DEFAULT '{"hat": "none", "glasses": "none"}'
  );

  CREATE TABLE IF NOT EXISTS global_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    requirement_type TEXT NOT NULL, -- 'streak', 'total_completions', 'level', 'category_completions'
    requirement_value INTEGER NOT NULL,
    category TEXT -- optional, for category-specific achievements
  );

  CREATE TABLE IF NOT EXISTS user_achievements (
    user_email TEXT,
    achievement_id TEXT,
    earned_at TEXT,
    PRIMARY KEY (user_email, achievement_id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'draft',
    theme_tag TEXT,
    priority_level INTEGER DEFAULT 1,
    mandatory_quest INTEGER DEFAULT 0,
    reward_type TEXT,
    focus_loops TEXT DEFAULT '[]',
    quest_pool TEXT DEFAULT '[]',
    business_context_note TEXT
  );

  CREATE TABLE IF NOT EXISTS user_campaign_progress (
    user_email TEXT,
    campaign_id INTEGER,
    completed_quests_count INTEGER DEFAULT 0,
    last_active_date TEXT,
    is_completed INTEGER DEFAULT 0,
    PRIMARY KEY (user_email, campaign_id)
  );

  CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    quest_id INTEGER,
    date TEXT,
    difficulty TEXT,
    time_to_complete INTEGER,
    reflection_score INTEGER,
    evidence TEXT,
    FOREIGN KEY(quest_id) REFERENCES quests(id)
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    date TEXT,
    mood INTEGER,
    change_temp INTEGER,
    pressure TEXT,
    focus TEXT,
    UNIQUE(user_email, date)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    frequency TEXT NOT NULL,
    loops TEXT DEFAULT '[]',
    is_completed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ecosystem_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'completed'
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS teams_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    webhook_url TEXT,
    is_enabled INTEGER DEFAULT 0,
    notify_on_completion INTEGER DEFAULT 0,
    notify_on_milestone INTEGER DEFAULT 1,
    daily_summary_time TEXT -- HH:mm
  );

  -- Insert default teams config if not exists
  INSERT OR IGNORE INTO teams_config (id, is_enabled) VALUES (1, 0);

  -- Insert default ecosystem health if not exists
  INSERT OR IGNORE INTO global_config (key, value) VALUES ('ecosystem_health', '100');
  INSERT OR IGNORE INTO global_config (key, value) VALUES ('last_decay_timestamp', '0');
`);

// Seed initial quests if empty
const initialQuests = [
  // Psychological Safety
  { title: "AI Friction Spotting", category: "Psychological Safety", difficulty: "small", prompt: "Ask a teammate: 'What's the absolute hardest or most frustrating part about using AI tools right now?' Log the major friction theme.", tags: '["ai", "safety", "trust"]' },
  { title: "Adoption Thanks", category: "Psychological Safety", difficulty: "tiny", prompt: "Send a specific, public message thanking a teammate who experimented with or shared an AI prompting win today.", tags: '["recognition", "safety"]' },
  { title: "Output Challenge", category: "Psychological Safety", difficulty: "tiny", prompt: "Actively thank a teammate during a meeting for challenging or constructively questioning an AI-generated output.", tags: '["feedback", "safety", "trust"]' },
  { title: "Prompt Failure Share", category: "Psychological Safety", difficulty: "tiny", prompt: "Openly share a specific instance where an AI prompt or tool completely failed you, and outline the key lesson you learned.", tags: '["humility", "learning"]' },
  { title: "Blind Spot Stress-Test", category: "Psychological Safety", difficulty: "tiny", prompt: "In your next team discussion, ask: 'How can we use generative AI to stress-test our blind spots or identify missing perspectives on this?'", tags: '["inclusion", "ai"]' },
  { title: "AI Fear Dialogue", category: "Psychological Safety", difficulty: "stretch", prompt: "Conduct a supportive, 1:1 curiosity conversation with a 'resistant' colleague to understand their real AI adoption concerns without judgment.", tags: '["resistance", "ai", "trust"]' },
  { title: "Apathy Pivot", category: "Psychological Safety", difficulty: "small", prompt: "Identify a process where your team is sluggish or apathetic about AI, and ask: 'What single barrier would make this tool feel useful to you again?'", tags: '["apathy", "safety"]' },
  
  // Change Leadership
  { title: "Commercial AI Context", category: "Change Leadership", difficulty: "tiny", prompt: "Write and share a 3-line update explaining what new AI capability we're prioritizing, its commercial purpose, and the practical next step.", tags: '["clarity", "commercial"]' },
  { title: "Automation Trade-off", category: "Change Leadership", difficulty: "small", prompt: "Select one manual, repetitive task you are deprioritizing or dropping this week in favor of an AI-assisted/automated route.", tags: '["priorities", "automation"]' },
  { title: "Adoption Anchor", category: "Change Leadership", difficulty: "tiny", prompt: "Say to your team: 'Here's exactly what we know so far about our AI tools and guidelines' to provide a stable anchor during workflow pivots.", tags: '["clarity", "stability"]' },
  { title: "Uncertainty Empathy", category: "Change Leadership", difficulty: "tiny", prompt: "Acknowledge AI workflow uncertainty directly to a teammate: 'We are learning and adapting together, and it's okay not to have the full picture yet.'", tags: '["transparency", "empathy"]' },
  { title: "Strategic AI Alignment", category: "Change Leadership", difficulty: "small", prompt: "Explain the commercial 'why' behind an AI tool decision as a tool for business growth, rather than just an efficiency mandate.", tags: '["commercial", "strategy"]' },
  { title: "Core Purpose Reassure", category: "Change Leadership", difficulty: "small", prompt: "Anchor your team amid rapid AI updates by saying: 'Our central focus on delivering customer value stays identical, regardless of the tools we adopt.'", tags: '["ambiguity", "purpose"]' },
  
  // AI Fluency
  { title: "Constraint Prompt", category: "AI Fluency", difficulty: "small", prompt: "Draft a major communication or outline by instructing an AI tool, explicitly defining its role, contextual constraints, and target tone.", tags: '["fluency", "prompting"]' },
  { title: "Prompt Library Share", category: "AI Fluency", difficulty: "tiny", prompt: "Share a specific, highly successful prompt format or sequence you used with your teammates in chat.", tags: '["knowledge-sharing"]' },
  { title: "AI Sounding Board", category: "AI Fluency", difficulty: "tiny", prompt: "Instruct an LLM to play the role of an adversarial critic to stress-test your strategy, and log 1 useful risk it identifies.", tags: '["ai", "strategy"]' },
  { title: "AI Concept Demystify", category: "AI Fluency", difficulty: "small", prompt: "Help demystify a fundamental AI concept (e.g., tokens, hallucination, LLM generation) for a colleague to grow your own confidence.", tags: '["confidence", "fluency"]' },
  { title: "Risk Spotting Partner", category: "AI Fluency", difficulty: "small", prompt: "Feed a draft proposal or decision paper to AI, asking it to expose three hidden commercial risks and suggest mitigations.", tags: '["decision-making", "ai"]' },
  
  // Orchestration
  { title: "AI Spotlight Space", category: "Orchestration", difficulty: "stretch", prompt: "Carve out the first 10 minutes of your next team sync specifically for team members to showcase AI wins, tools, and prompting breakthroughs.", tags: '["innovation", "orchestration"]' },
  { title: "Co-build automation", category: "Orchestration", difficulty: "small", prompt: "Spend 15 minutes helping a colleague set up an AI assistant extension or build a template to automate a major friction point in their week.", tags: '["enablement", "orchestration"]' },
  { title: "Cross-Department Connect", category: "Orchestration", difficulty: "small", prompt: "Meet with an active AI adopter in another department to share notes on successful generative AI use cases in your corporate processes.", tags: '["alignment", "collaboration"]' },
  { title: "Time-back Audit", category: "Orchestration", difficulty: "small", prompt: "Instruct your team to flag any high-friction repetitive tasks this week that should be streamlined or automated next using AI workflows.", tags: '["utilisation", "audit"]' },
  
  // Coaching Capability
  { title: "Manual Habit Redirect", category: "Coaching Capability", difficulty: "small", prompt: "Spot a teammate executing a repetitive task 'the old manual way' and gently coach them with: 'How might AI draft or outline the first 80% of this for you?'", tags: '["habits", "coaching"]' },
  { title: "AI Block Listening", category: "Coaching Capability", difficulty: "tiny", prompt: "In your next 1:1, ask: 'Where are you feeling most held back from experimenting with AI?' and listen actively for 2 minutes without jumping to answers.", tags: '["listening", "coaching"]' },
  { title: "Socratic Prompt Coach", category: "Coaching Capability", difficulty: "tiny", prompt: "When a colleague is stuck with sub-optimal AI tool output, coach them by asking: 'What was your specific instruction, and what did the AI miss?'", tags: '["coaching", "prompting"]' },
  { title: "Prompt Step Coaching", category: "Coaching Capability", difficulty: "tiny", prompt: "Help a teammate structure complex problems by asking: 'If you had to guide an expert AI assistant step-by-step through this task, what sequence would you give?'", tags: '["listening", "frameworks"]' }
];

const insertQuest = db.prepare("INSERT INTO quests (title, category, difficulty, prompt, tags, is_system) VALUES (?, ?, ?, ?, ?, 1)");
initialQuests.forEach(q => {
  const exists = db.prepare("SELECT id FROM quests WHERE title = ?").get(q.title);
  if (!exists) {
    insertQuest.run(q.title, q.category, q.difficulty, q.prompt, q.tags);
  }
});

// Seed initial achievements
const initialAchievements = [
  { id: 'first_step', title: 'First Step', description: 'Complete your first quest', icon: 'Footprints', requirement_type: 'total_completions', requirement_value: 1 },
  { id: 'streak_3', title: '3-Day Streak', description: 'Complete quests 3 days in a row', icon: 'Flame', requirement_type: 'streak', requirement_value: 3 },
  { id: 'streak_7', title: 'Week Warrior', description: 'Complete quests 7 days in a row', icon: 'Trophy', requirement_type: 'streak', requirement_value: 7 },
  { id: 'level_5', title: 'Rising Star', description: 'Reach level 5', icon: 'Star', requirement_type: 'level', requirement_value: 5 },
  { id: 'level_10', title: 'Adoption Legend', description: 'Reach level 10', icon: 'Crown', requirement_type: 'level', requirement_value: 10 },
  { id: 'trust_builder', title: 'Trust Builder', description: 'Complete 5 quests in Psychological Safety or Coaching', icon: 'ShieldCheck', requirement_type: 'category_completions', requirement_value: 5, category: 'Trust' },
  { id: 'momentum_master', title: 'Momentum Master', description: 'Complete 5 quests in AI Fluency or Orchestration', icon: 'Zap', requirement_type: 'category_completions', requirement_value: 5, category: 'Momentum' },
  { id: 'clarity_king', title: 'Clarity King', description: 'Complete 5 quests in Change Leadership', icon: 'Compass', requirement_type: 'category_completions', requirement_value: 5, category: 'Clarity' }
];

const insertAchievement = db.prepare("INSERT OR IGNORE INTO achievements (id, title, description, icon, requirement_type, requirement_value, category) VALUES (?, ?, ?, ?, ?, ?, ?)");
initialAchievements.forEach(a => insertAchievement.run(a.id, a.title, a.description, a.icon, a.requirement_type, a.requirement_value, a.category || null));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/quests", (req, res) => {
    const quests = db.prepare("SELECT * FROM quests WHERE is_active = 1").all();
    res.json(quests);
  });

  app.post("/api/quests", (req, res) => {
    const { title, category, prompt, difficulty, tags } = req.body;
    const result = db.prepare("INSERT INTO quests (title, category, prompt, difficulty, tags, is_system) VALUES (?, ?, ?, ?, ?, 0)").run(title, category, prompt, difficulty, tags || '[]');
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/checkin", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const today = new Date().toISOString().split('T')[0];
    const checkin = db.prepare("SELECT * FROM checkins WHERE user_email = ? AND date = ?").get(userEmail, today);
    res.json(checkin || null);
  });

  app.post("/api/checkin", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const { mood, change_temp, pressure, focus } = req.body;
    const today = new Date().toISOString().split('T')[0];
    try {
      db.prepare("INSERT INTO checkins (user_email, date, mood, change_temp, pressure, focus) VALUES (?, ?, ?, ?, ?, ?)").run(userEmail, today, mood, change_temp, pressure, focus);
      res.json({ success: true });
    } catch (e) {
      db.prepare("UPDATE checkins SET mood = ?, change_temp = ?, pressure = ?, focus = ? WHERE user_email = ? AND date = ?").run(mood, change_temp, pressure, focus, userEmail, today);
      res.json({ success: true, updated: true });
    }
  });

  app.get("/api/goals", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const goals = db.prepare("SELECT * FROM goals WHERE user_email = ?").all(userEmail);
    res.json(goals);
  });

  app.post("/api/goals", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const { title, type, frequency, loops } = req.body;
    const result = db.prepare("INSERT INTO goals (user_email, title, type, frequency, loops) VALUES (?, ?, ?, ?, ?)").run(userEmail, title, type, frequency, JSON.stringify(loops || []));
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/goals/toggle", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const { id, is_completed } = req.body;
    db.prepare("UPDATE goals SET is_completed = ? WHERE id = ? AND user_email = ?").run(is_completed ? 1 : 0, id, userEmail);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    
    // Ensure user stats exist
    db.prepare("INSERT OR IGNORE INTO user_stats (user_email, last_stat_update) VALUES (?, ?)").run(userEmail, Date.now());

    const stats = db.prepare("SELECT * FROM user_stats WHERE user_email = ?").get(userEmail) as any;
    if (!stats) return res.json(null);

    const now = Date.now();
    const lastUpdate = stats.last_stat_update || now;
    const hoursElapsed = (now - lastUpdate) / (1000 * 60 * 60);

    if (hoursElapsed >= 1) {
      // Decay 1% per hour for each stat
      const decay = Math.floor(hoursElapsed);
      const newClarity = Math.max(0, stats.stat_clarity - decay);
      const newTrust = Math.max(0, stats.stat_trust - decay);
      const newMomentum = Math.max(0, stats.stat_momentum - decay);
      const newEnergy = Math.max(0, stats.stat_energy - decay);
      const newHappiness = Math.max(0, stats.happiness - Math.floor(decay / 2));

      db.prepare(`
        UPDATE user_stats 
        SET stat_clarity = ?, stat_trust = ?, stat_momentum = ?, stat_energy = ?, happiness = ?, last_stat_update = ?
        WHERE user_email = ?
      `).run(newClarity, newTrust, newMomentum, newEnergy, newHappiness, now, userEmail);

      return res.json({ 
        ...stats, 
        stat_clarity: newClarity, 
        stat_trust: newTrust, 
        stat_momentum: newMomentum, 
        stat_energy: newEnergy,
        happiness: newHappiness,
        last_stat_update: now 
      });
    }

    res.json(stats);
  });

  app.post("/api/stats/pet-name", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const { pet_name } = req.body;
    db.prepare("UPDATE user_stats SET pet_name = ? WHERE user_email = ?").run(pet_name, userEmail);
    res.json({ success: true });
  });

  app.post("/api/complete", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const { questId, reflection_score, time_to_complete, evidence } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();
    
    const quest = db.prepare("SELECT * FROM quests WHERE id = ?").get(questId) as any;
    if (!quest) return res.status(404).json({ error: "Quest not found" });

    // Record completion
    db.prepare("INSERT INTO completions (user_email, quest_id, date, difficulty, time_to_complete, reflection_score, evidence) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      userEmail, questId, today, quest.difficulty, time_to_complete || quest.estimated_minutes, reflection_score || 5, evidence || ""
    );
    
    // Update stats
    const stats = db.prepare("SELECT * FROM user_stats WHERE user_email = ?").get(userEmail) as any;
    let newExp = stats.experience + (quest.difficulty === 'tiny' ? 10 : quest.difficulty === 'small' ? 20 : 40);
    let newLevel = stats.level;
    if (newExp >= 100) {
      newExp -= 100;
      newLevel += 1;
    }
    
    // Update streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = stats.streak || 0;
    if (stats.last_completed_date === yesterday) {
      newStreak += 1;
    } else if (stats.last_completed_date !== today) {
      newStreak = 1;
    }

    // Update behavioral stats based on category
    let { stat_clarity, stat_trust, stat_momentum, stat_energy } = stats;
    const boost = 10; // Increased boost for completion
    if (quest.category === 'Psychological Safety') stat_trust = Math.min(100, stat_trust + boost);
    if (quest.category === 'Change Leadership') stat_clarity = Math.min(100, stat_clarity + boost);
    if (quest.category === 'Coaching Capability') stat_trust = Math.min(100, stat_trust + boost);
    if (quest.category === 'AI Fluency') stat_momentum = Math.min(100, stat_momentum + boost);
    if (quest.category === 'Orchestration') stat_momentum = Math.min(100, stat_momentum + boost);

    db.prepare(`
      UPDATE user_stats 
      SET experience = ?, level = ?, happiness = MIN(100, happiness + 10),
          stat_clarity = ?, stat_trust = ?, stat_momentum = ?, stat_energy = ?,
          streak = ?, last_completed_date = ?,
          last_stat_update = ?
      WHERE user_email = ?
    `).run(newExp, newLevel, stat_clarity, stat_trust, stat_momentum, stat_energy, newStreak, today, now, userEmail);

    // Check for achievements
    const earnedAchievements: any[] = [];
    const allAchievements = db.prepare("SELECT * FROM achievements").all() as any[];
    const existingAchievements = db.prepare("SELECT achievement_id FROM user_achievements WHERE user_email = ?").all(userEmail).map((a: any) => a.achievement_id);

    for (const achievement of allAchievements) {
      if (existingAchievements.includes(achievement.id)) continue;

      let meetsRequirement = false;
      if (achievement.requirement_type === 'streak') {
        if (newStreak >= achievement.requirement_value) meetsRequirement = true;
      } else if (achievement.requirement_type === 'total_completions') {
        const total = db.prepare("SELECT COUNT(*) as count FROM completions WHERE user_email = ?").get(userEmail) as any;
        if (total.count >= achievement.requirement_value) meetsRequirement = true;
      } else if (achievement.requirement_type === 'level') {
        if (newLevel >= achievement.requirement_value) meetsRequirement = true;
      } else if (achievement.requirement_type === 'category_completions') {
        const categories = achievement.category === 'Trust' ? ['Psychological Safety', 'Coaching Capability'] :
                           achievement.category === 'Momentum' ? ['AI Fluency', 'Orchestration'] :
                           achievement.category === 'Clarity' ? ['Change Leadership'] : [];
        
        const count = db.prepare(`
          SELECT COUNT(*) as count 
          FROM completions c 
          JOIN quests q ON c.quest_id = q.id 
          WHERE c.user_email = ? AND q.category IN (${categories.map(() => '?').join(',')})
        `).get(userEmail, ...categories) as any;
        
        if (count.count >= achievement.requirement_value) meetsRequirement = true;
      }

      if (meetsRequirement) {
        db.prepare("INSERT INTO user_achievements (user_email, achievement_id, earned_at) VALUES (?, ?, ?)").run(userEmail, achievement.id, today);
        earnedAchievements.push(achievement);
      }
    }

    // Update Ecosystem Health on completion
    const healthRow = db.prepare("SELECT value FROM global_config WHERE key = 'ecosystem_health'").get() as any;
    let currentHealth = parseFloat(healthRow?.value || "100");
    currentHealth = Math.min(100, currentHealth + 1); // +1 health per completion
    db.prepare("UPDATE global_config SET value = ? WHERE key = 'ecosystem_health'").run(currentHealth.toString());

    // Update Ecosystem Goals progress
    db.prepare(`
      UPDATE ecosystem_goals 
      SET current_value = current_value + 1 
      WHERE category = ? AND status = 'active'
    `).run(quest.category);

    // Check for Teams notification
    const teamsConfig = db.prepare("SELECT * FROM teams_config WHERE id = 1").get() as any;
    if (teamsConfig && teamsConfig.is_enabled && teamsConfig.notify_on_completion) {
      sendToTeams(`${userEmail} completed a quest: "${quest.title}" (${quest.category})! Ecosystem health is improving.`);
    }

    // Auto-complete goals if target reached
    const completedGoals = db.prepare("SELECT * FROM ecosystem_goals WHERE current_value >= target_value AND status = 'active'").all() as any[];
    if (completedGoals.length > 0 && teamsConfig && teamsConfig.is_enabled && teamsConfig.notify_on_milestone) {
      for (const goal of completedGoals) {
        sendToTeams(`🏆 ECOSYSTEM GOAL ACHIEVED: "${goal.title}"! The collective has reached ${goal.target_value} completions in ${goal.category}.`);
      }
    }

    db.prepare(`
      UPDATE ecosystem_goals 
      SET status = 'completed' 
      WHERE current_value >= target_value AND status = 'active'
    `).run();
    
    res.json({ success: true, experience: newExp, level: newLevel, streak: newStreak, earnedAchievements });
  });

  app.get("/api/achievements", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const allAchievements = db.prepare("SELECT * FROM achievements").all();
    const userAchievements = db.prepare("SELECT achievement_id, earned_at FROM user_achievements WHERE user_email = ?").all(userEmail);
    res.json({ allAchievements, userAchievements });
  });

  app.get("/api/admin/all-quests", (req, res) => {
    const quests = db.prepare("SELECT * FROM quests").all();
    res.json(quests);
  });

  app.post("/api/admin/toggle-quest", (req, res) => {
    const { id, is_active } = req.body;
    db.prepare("UPDATE quests SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, id);
    res.json({ success: true });
  });

  app.get("/api/admin/reporting/export", (req, res) => {
    const completions = db.prepare(`
      SELECT c.*, q.title as quest_title, q.category as quest_category
      FROM completions c
      JOIN quests q ON c.quest_id = q.id
    `).all();

    const checkins = db.prepare("SELECT * FROM checkins").all();
    const userStats = db.prepare("SELECT * FROM user_stats").all();
    const campaignProgress = db.prepare(`
      SELECT cp.*, c.title as campaign_title
      FROM user_campaign_progress cp
      JOIN campaigns c ON cp.campaign_id = c.id
    `).all();

    res.json({
      export_date: new Date().toISOString(),
      completions,
      checkins,
      user_stats: userStats,
      campaign_progress: campaignProgress
    });
  });

  app.get("/api/admin/reporting/completions.csv", (req, res) => {
    const completions = db.prepare(`
      SELECT c.id, c.user_email, c.date, c.difficulty, c.time_to_complete, c.reflection_score,
             q.title as quest_title, q.category as quest_category
      FROM completions c
      JOIN quests q ON c.quest_id = q.id
    `).all() as any[];

    if (completions.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      return res.send("id,user_email,date,difficulty,time_to_complete,reflection_score,quest_title,quest_category");
    }

    const headers = Object.keys(completions[0]).join(",");
    const rows = completions.map(c => 
      Object.values(c).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=completions.csv');
    res.send(`${headers}\n${rows}`);
  });

  app.get("/api/admin/daily-pack", (req, res) => {
    const config = db.prepare("SELECT value FROM global_config WHERE key = 'daily_pack'").get() as any;
    res.json(config ? JSON.parse(config.value) : null);
  });

  app.post("/api/admin/daily-pack", (req, res) => {
    const { questIds } = req.body;
    db.prepare("INSERT OR REPLACE INTO global_config (key, value) VALUES ('daily_pack', ?)").run(JSON.stringify(questIds));
    res.json({ success: true });
  });

  app.post("/api/customize", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const { accessories } = req.body;
    db.prepare("UPDATE user_stats SET accessories = ? WHERE user_email = ?").run(JSON.stringify(accessories), userEmail);
    res.json({ success: true });
  });

  // Campaign Endpoints
  app.get("/api/admin/campaigns", (req, res) => {
    const campaigns = db.prepare("SELECT * FROM campaigns").all();
    res.json(campaigns);
  });

  app.post("/api/admin/campaigns", (req, res) => {
    const { title, description, start_date, end_date, status, theme_tag, priority_level, mandatory_quest, reward_type, focus_loops, quest_pool, business_context_note } = req.body;
    const result = db.prepare(`
      INSERT INTO campaigns (title, description, start_date, end_date, status, theme_tag, priority_level, mandatory_quest, reward_type, focus_loops, quest_pool, business_context_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, start_date, end_date, status || 'draft', theme_tag, priority_level || 1, mandatory_quest || 0, reward_type, JSON.stringify(focus_loops || []), JSON.stringify(quest_pool || []), business_context_note);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/admin/campaigns/:id", (req, res) => {
    const { id } = req.params;
    const { title, description, start_date, end_date, status, theme_tag, priority_level, mandatory_quest, reward_type, focus_loops, quest_pool, business_context_note } = req.body;
    db.prepare(`
      UPDATE campaigns 
      SET title = ?, description = ?, start_date = ?, end_date = ?, status = ?, theme_tag = ?, priority_level = ?, mandatory_quest = ?, reward_type = ?, focus_loops = ?, quest_pool = ?, business_context_note = ?
      WHERE id = ?
    `).run(title, description, start_date, end_date, status, theme_tag, priority_level, mandatory_quest, reward_type, JSON.stringify(focus_loops), JSON.stringify(quest_pool), business_context_note, id);
    res.json({ success: true });
  });

  app.delete("/api/admin/campaigns/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM campaigns WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/campaigns/active", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const campaigns = db.prepare("SELECT * FROM campaigns WHERE status = 'live' AND start_date <= ? AND end_date >= ?").all(today, today);
    res.json(campaigns);
  });

  app.get("/api/campaigns/progress", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const progress = db.prepare("SELECT * FROM user_campaign_progress WHERE user_email = ?").all(userEmail);
    res.json(progress);
  });

  app.get("/api/ecosystem", (req, res) => {
    // Handle Decay
    const now = Date.now();
    const lastDecay = parseInt(db.prepare("SELECT value FROM global_config WHERE key = 'last_decay_timestamp'").get()?.value || "0");
    const healthRow = db.prepare("SELECT value FROM global_config WHERE key = 'ecosystem_health'").get();
    let currentHealth = parseFloat(healthRow?.value || "100");

    // Decay every hour (3600000 ms)
    if (now - lastDecay > 3600000) {
      const hoursPassed = Math.floor((now - lastDecay) / 3600000);
      const decayAmount = hoursPassed * 0.5; // 0.5 health per hour
      currentHealth = Math.max(0, currentHealth - decayAmount);
      
      db.prepare("UPDATE global_config SET value = ? WHERE key = 'ecosystem_health'").run(currentHealth.toString());
      db.prepare("UPDATE global_config SET value = ? WHERE key = 'last_decay_timestamp'").run(now.toString());
    }

    const globalStats = db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(level) as total_levels,
        SUM(experience) as total_experience,
        AVG(stat_clarity) as avg_clarity,
        AVG(stat_trust) as avg_trust,
        AVG(stat_momentum) as avg_momentum,
        AVG(stat_energy) as avg_energy,
        AVG(happiness) as avg_happiness
      FROM user_stats
    `).get() as any;

    const totalCompletions = db.prepare("SELECT COUNT(*) as count FROM completions").get() as any;
    
    // Get recent activity for the "live" feel
    const recentActivity = db.prepare(`
      SELECT c.user_email, q.title, q.category, c.date
      FROM completions c
      JOIN quests q ON c.quest_id = q.id
      ORDER BY c.id DESC
      LIMIT 5
    `).all();

    // Get active ecosystem goals
    const activeGoals = db.prepare("SELECT * FROM ecosystem_goals WHERE status = 'active'").all();

    res.json({
      ...globalStats,
      health: currentHealth,
      total_completions: totalCompletions.count,
      recent_activity: recentActivity,
      active_goals: activeGoals
    });
  });

  // Admin Ecosystem Goals Endpoints
  app.get("/api/admin/ecosystem-goals", (req, res) => {
    const goals = db.prepare("SELECT * FROM ecosystem_goals ORDER BY id DESC").all();
    res.json(goals);
  });

  app.get("/api/admin/teams-config", (req, res) => {
    const config = db.prepare("SELECT * FROM teams_config WHERE id = 1").get();
    res.json(config);
  });

  app.post("/api/admin/teams-config", (req, res) => {
    const { webhook_url, is_enabled, notify_on_completion, notify_on_milestone, daily_summary_time } = req.body;
    db.prepare(`
      UPDATE teams_config 
      SET webhook_url = ?, is_enabled = ?, notify_on_completion = ?, notify_on_milestone = ?, daily_summary_time = ?
      WHERE id = 1
    `).run(webhook_url, is_enabled ? 1 : 0, notify_on_completion ? 1 : 0, notify_on_milestone ? 1 : 0, daily_summary_time);
    res.json({ success: true });
  });

  async function sendToTeams(message: string) {
    const config = db.prepare("SELECT * FROM teams_config WHERE id = 1").get() as any;
    if (!config || !config.is_enabled || !config.webhook_url) return;

    try {
      await fetch(config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "message",
          attachments: [
            {
              contentType: "application/vnd.microsoft.card.adaptive",
              content: {
                type: "AdaptiveCard",
                body: [
                  {
                    type: "TextBlock",
                    size: "Medium",
                    weight: "Bolder",
                    text: "Ellis Ecosystem Update"
                  },
                  {
                    type: "TextBlock",
                    text: message,
                    wrap: true
                  }
                ],
                $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                version: "1.0"
              }
            }
          ]
        })
      });
    } catch (e) {
      console.error("Failed to send to Teams:", e);
    }
  }

  app.post("/api/admin/ecosystem-goals", (req, res) => {
    const { title, description, target_value, category } = req.body;
    const result = db.prepare(`
      INSERT INTO ecosystem_goals (title, description, target_value, category, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, description, target_value, category, new Date().toISOString());
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/admin/ecosystem-goals/:id", (req, res) => {
    db.prepare("DELETE FROM ecosystem_goals WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/leaderboard", (req, res) => {
    const leaderboard = db.prepare(`
      SELECT user_email, pet_name, level, experience, accessories
      FROM user_stats
      ORDER BY level DESC, experience DESC
      LIMIT 10
    `).all();
    res.json(leaderboard);
  });

  app.get("/api/stats/weekly", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(now.setDate(diff)).toISOString().split('T')[0];
    
    const completions = db.prepare(`
      SELECT c.*, q.category
      FROM completions c
      JOIN quests q ON c.quest_id = q.id
      WHERE c.user_email = ? AND c.date >= ?
    `).all(userEmail, monday) as any[];

    const stats = {
      totalCompletions: completions.length,
      avgReflection: completions.length > 0 ? completions.reduce((acc, c) => acc + c.reflection_score, 0) / completions.length : 0,
      categories: completions.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      dailyCounts: completions.reduce((acc, c) => {
        acc[c.date] = (acc[c.date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json(stats);
  });

  app.post("/api/campaigns/track", (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || 'default@example.com';
    const { campaignId } = req.body;
    const today = new Date().toISOString().split('T')[0];

    try {
      const progress = db.prepare("SELECT * FROM user_campaign_progress WHERE user_email = ? AND campaign_id = ?").get(userEmail, campaignId) as any;
      if (progress) {
        db.prepare("UPDATE user_campaign_progress SET completed_quests_count = completed_quests_count + 1, last_active_date = ? WHERE user_email = ? AND campaign_id = ?")
          .run(today, userEmail, campaignId);
      } else {
        db.prepare("INSERT INTO user_campaign_progress (user_email, campaign_id, completed_quests_count, last_active_date) VALUES (?, ?, 1, ?)")
          .run(userEmail, campaignId, today);
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to track progress" });
    }
  });

  app.delete("/api/admin/quests/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM quests WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.put("/api/admin/quests/:id", (req, res) => {
    const { id } = req.params;
    const { title, category, prompt, difficulty } = req.body;
    db.prepare("UPDATE quests SET title = ?, category = ?, prompt = ?, difficulty = ? WHERE id = ?")
      .run(title, category, prompt, difficulty, id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
