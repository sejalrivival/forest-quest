// ════════════════════════════════════════════════════
//  Forest Quest — data.js
//  All LocalStorage read/write, state management
// ════════════════════════════════════════════════════

const FQ = (() => {

  // ── STORAGE KEY ──
  const KEY = 'forestQuestData_v2';

  // ── DEFAULT STATE ──
  function defaultState() {
    return {
      profile: {
        name: 'Adventurer',
        avatar: '🧝',
        createdAt: today()
      },
      stats: {
        xp: 0,
        totalXP: 0,
        coins: 0,
        totalCoins: 0,
        level: 1,
        streak: 0,
        bestStreak: 0,
        lastActiveDate: null,
        totalTasksCompleted: 0,
        totalRewardsRedeemed: 0
      },
      tasks: [],
      rewards: [],
      completionLog: {},   // { 'YYYY-MM-DD': [taskId, ...] }
      xpLog: {},           // { 'YYYY-MM-DD': xpAmount }
      redeemLog: [],       // [{rewardId, name, cost, icon, date}]
      achievements: {},    // { achievementId: { unlockedAt } }
      forestProgress: {
        productiveDays: 0,
        lastGrowthDate: null
      }
    };
  }

  // ── STATE ──
  let state = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge defaults for any missing keys
        state = deepMerge(defaultState(), parsed);
      } else {
        state = defaultState();
        seedDefaults();
      }
    } catch (e) {
      console.warn('FQ: failed to parse saved data, using defaults.', e);
      state = defaultState();
      seedDefaults();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error('FQ: failed to save data.', e);
    }
  }

  function deepMerge(base, override) {
    const result = { ...base };
    for (const k in override) {
      if (override[k] && typeof override[k] === 'object' && !Array.isArray(override[k])) {
        result[k] = deepMerge(base[k] || {}, override[k]);
      } else {
        result[k] = override[k];
      }
    }
    return result;
  }

  function seedDefaults() {
    // Seed some example tasks
    state.tasks = [
      { id: uid(), name: 'Drink 8 glasses of water', category: 'Health', xp: 15, coins: 8, repeat: 'daily', notes: '', createdAt: today() },
      { id: uid(), name: 'Read for 20 minutes', category: 'Learning', xp: 20, coins: 10, repeat: 'daily', notes: '', createdAt: today() },
      { id: uid(), name: 'Take a 15-min walk', category: 'Fitness', xp: 25, coins: 12, repeat: 'daily', notes: '', createdAt: today() },
      { id: uid(), name: 'Tidy up bedroom', category: 'Chores', xp: 20, coins: 10, repeat: 'daily', notes: '', createdAt: today() }
    ];
    // Seed some example rewards
    state.rewards = [
      { id: uid(), name: 'Sweet Treat 🍬', desc: 'One piece of candy or chocolate', icon: '🍬', cost: 30, createdAt: today() },
      { id: uid(), name: 'Gaming Session 🎮', desc: '30 minutes of video games', icon: '🎮', cost: 80, createdAt: today() },
      { id: uid(), name: 'Movie Night 🎬', desc: 'Pick any movie!', icon: '🎬', cost: 150, createdAt: today() },
      { id: uid(), name: 'Extra Reading Time 📚', desc: '1 hour guilt-free reading', icon: '📚', cost: 60, createdAt: today() }
    ];
    save();
  }

  // ── HELPERS ──
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  }

  // ── LEVEL MATH ──
  // XP needed to reach level N: 100 * N * (N+1) / 2 cumulative
  function xpForLevel(level) {
    return 100 * level;  // XP to go from level-1 to level
  }

  function totalXpForLevel(level) {
    // Total XP needed to reach this level from 0
    return level <= 1 ? 0 : (level - 1) * level * 50;
  }

  function computeLevel(totalXP) {
    let level = 1;
    while (totalXP >= totalXpForLevel(level + 1)) {
      level++;
      if (level > 999) break;
    }
    return level;
  }

  function xpIntoCurrentLevel(totalXP) {
    const level = computeLevel(totalXP);
    return totalXP - totalXpForLevel(level);
  }

  function xpNeededForNextLevel(totalXP) {
    const level = computeLevel(totalXP);
    return totalXpForLevel(level + 1) - totalXpForLevel(level);
  }

  // ── STREAK UPDATE ──
  function updateStreak() {
    const t = today();
    const last = state.stats.lastActiveDate;
    if (last === t) return; // already counted today

    const yesterday = dateOffset(-1);
    if (last === yesterday) {
      state.stats.streak++;
    } else if (last !== t) {
      // Not yesterday → reset if last was more than 1 day ago
      if (last && last < yesterday) {
        state.stats.streak = 1;
      } else if (!last) {
        state.stats.streak = 1;
      }
    }
    state.stats.lastActiveDate = t;
    if (state.stats.streak > state.stats.bestStreak) {
      state.stats.bestStreak = state.stats.streak;
    }
  }

  function dateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  // ── TASK COMPLETION ──
  function isTaskDoneToday(taskId) {
    const log = state.completionLog[today()] || [];
    return log.includes(taskId);
  }

  function completeTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return null;
    if (isTaskDoneToday(taskId)) return null; // already done

    const t = today();
    if (!state.completionLog[t]) state.completionLog[t] = [];
    state.completionLog[t].push(taskId);

    // Award XP & coins
    state.stats.xp += task.xp;
    state.stats.totalXP += task.xp;
    state.stats.coins += task.coins;
    state.stats.totalCoins += task.coins;
    state.stats.totalTasksCompleted++;

    // Update XP log
    state.xpLog[t] = (state.xpLog[t] || 0) + task.xp;

    // Update streak
    updateStreak();

    // Recalculate level
    const newLevel = computeLevel(state.stats.totalXP);
    const oldLevel = state.stats.level;
    state.stats.level = newLevel;

    // Forest growth
    updateForestGrowth();

    save();
    return { task, levelUp: newLevel > oldLevel, newLevel, oldLevel };
  }

  function uncompleteTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return null;
    const t = today();
    const log = state.completionLog[t] || [];
    const idx = log.indexOf(taskId);
    if (idx === -1) return null;

    state.completionLog[t].splice(idx, 1);
    state.stats.xp = Math.max(0, state.stats.xp - task.xp);
    state.stats.totalXP = Math.max(0, state.stats.totalXP - task.xp);
    state.stats.coins = Math.max(0, state.stats.coins - task.coins);
    state.stats.totalCoins = Math.max(0, state.stats.totalCoins - task.coins);
    state.stats.totalTasksCompleted = Math.max(0, state.stats.totalTasksCompleted - 1);
    state.xpLog[t] = Math.max(0, (state.xpLog[t] || 0) - task.xp);
    state.stats.level = computeLevel(state.stats.totalXP);
    save();
    return task;
  }

  // ── FOREST GROWTH ──
  function updateForestGrowth() {
    const t = today();
    if (state.forestProgress.lastGrowthDate === t) return;
    const log = state.completionLog[t] || [];
    if (log.length > 0) {
      state.forestProgress.productiveDays++;
      state.forestProgress.lastGrowthDate = t;
    }
  }

  // ── TASKS CRUD ──
  function addTask(data) {
    const task = {
      id: uid(),
      name: data.name.trim(),
      category: data.category || 'Other',
      xp: Math.max(1, parseInt(data.xp) || 10),
      coins: Math.max(1, parseInt(data.coins) || 5),
      repeat: data.repeat || 'daily',
      notes: data.notes || '',
      createdAt: today()
    };
    state.tasks.push(task);
    save();
    return task;
  }

  function updateTask(id, data) {
    const idx = state.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    state.tasks[idx] = { ...state.tasks[idx], ...data, id };
    save();
    return state.tasks[idx];
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    save();
  }

  // ── REWARDS CRUD ──
  function addReward(data) {
    const reward = {
      id: uid(),
      name: data.name.trim(),
      desc: data.desc || '',
      icon: data.icon || '🎁',
      cost: Math.max(1, parseInt(data.cost) || 50),
      createdAt: today()
    };
    state.rewards.push(reward);
    save();
    return reward;
  }

  function updateReward(id, data) {
    const idx = state.rewards.findIndex(r => r.id === id);
    if (idx === -1) return null;
    state.rewards[idx] = { ...state.rewards[idx], ...data, id };
    save();
    return state.rewards[idx];
  }

  function deleteReward(id) {
    state.rewards = state.rewards.filter(r => r.id !== id);
    save();
  }

  function redeemReward(id) {
    const reward = state.rewards.find(r => r.id === id);
    if (!reward) return { ok: false, reason: 'Reward not found' };
    if (state.stats.coins < reward.cost) return { ok: false, reason: 'Not enough coins' };
    state.stats.coins -= reward.cost;
    state.stats.totalRewardsRedeemed++;
    state.redeemLog.push({ rewardId: id, name: reward.name, icon: reward.icon, cost: reward.cost, date: today() });
    save();
    return { ok: true, reward };
  }

  // ── ACHIEVEMENTS ──
  function unlockAchievement(id) {
    if (state.achievements[id]) return false;
    state.achievements[id] = { unlockedAt: today() };
    save();
    return true;
  }

  // ── GETTERS ──
  function getCompletedToday() {
    const log = state.completionLog[today()] || [];
    return log.map(id => state.tasks.find(t => t.id === id)).filter(Boolean);
  }

  function getStreakCalendar(days = 28) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = dateOffset(-i);
      const log = state.completionLog[d] || [];
      result.push({ date: d, count: log.length, active: log.length > 0 });
    }
    return result;
  }

  function getDailyXP(days = 30) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = dateOffset(-i);
      result.push({ date: d, xp: state.xpLog[d] || 0 });
    }
    return result;
  }

  function getDailyTaskCount(days = 30) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = dateOffset(-i);
      result.push({ date: d, count: (state.completionLog[d] || []).length });
    }
    return result;
  }

  function getCategoryBreakdown() {
    const breakdown = {};
    for (const [date, ids] of Object.entries(state.completionLog)) {
      for (const id of ids) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
          breakdown[task.category] = (breakdown[task.category] || 0) + 1;
        }
      }
    }
    return breakdown;
  }

  function getStreakHistory(days = 30) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = dateOffset(-i);
      result.push({ date: d, active: (state.completionLog[d] || []).length > 0 ? 1 : 0 });
    }
    return result;
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forest-quest-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(json) {
    const parsed = JSON.parse(json);
    state = deepMerge(defaultState(), parsed);
    save();
  }

  function resetData() {
    state = defaultState();
    seedDefaults();
    save();
  }

  // ── XP Progress Helpers ──
  function getLevelProgress() {
    const totalXP = state.stats.totalXP;
    const level = state.stats.level;
    const xpIn = xpIntoCurrentLevel(totalXP);
    const xpNeeded = xpNeededForNextLevel(totalXP);
    const pct = Math.min(100, (xpIn / xpNeeded) * 100);
    return { level, xpIn, xpNeeded, pct, totalXP };
  }

  // Initialize
  load();

  return {
    get state() { return state; },
    save,
    today,
    formatDate,
    dateOffset,
    uid,
    getLevelProgress,
    computeLevel,
    xpForLevel,
    isTaskDoneToday,
    completeTask,
    uncompleteTask,
    getCompletedToday,
    getStreakCalendar,
    getDailyXP,
    getDailyTaskCount,
    getCategoryBreakdown,
    getStreakHistory,
    addTask,
    updateTask,
    deleteTask,
    addReward,
    updateReward,
    deleteReward,
    redeemReward,
    unlockAchievement,
    updateForestGrowth,
    exportData,
    importData,
    resetData
  };
})();
