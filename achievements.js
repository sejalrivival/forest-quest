// ════════════════════════════════════════════════════
//  Forest Quest — achievements.js
//  Badge definitions and unlock checking
// ════════════════════════════════════════════════════

const AchievementsModule = (() => {

  const BADGES = [
    // ── FIRST STEPS ──
    {
      id: 'first_task',
      icon: '🌱',
      name: 'First Steps',
      desc: 'Complete your very first quest',
      check: (s) => s.totalTasksCompleted >= 1
    },
    {
      id: 'five_tasks',
      icon: '🌿',
      name: 'Getting Going',
      desc: 'Complete 5 quests in total',
      check: (s) => s.totalTasksCompleted >= 5
    },
    {
      id: 'ten_tasks',
      icon: '✨',
      name: 'Quest Seeker',
      desc: 'Complete 10 quests in total',
      check: (s) => s.totalTasksCompleted >= 10
    },
    {
      id: 'fifty_tasks',
      icon: '⚡',
      name: 'Quest Champion',
      desc: 'Complete 50 quests in total',
      check: (s) => s.totalTasksCompleted >= 50
    },
    {
      id: 'hundred_tasks',
      icon: '🏆',
      name: 'Legend of the Realm',
      desc: 'Complete 100 quests in total',
      check: (s) => s.totalTasksCompleted >= 100
    },
    {
      id: 'fivehundred_tasks',
      icon: '👑',
      name: 'Eternal Champion',
      desc: 'Complete 500 quests in total',
      check: (s) => s.totalTasksCompleted >= 500
    },

    // ── STREAKS ──
    {
      id: 'streak_3',
      icon: '🔥',
      name: 'Kindling',
      desc: 'Maintain a 3-day streak',
      check: (s) => s.bestStreak >= 3
    },
    {
      id: 'streak_7',
      icon: '🌟',
      name: 'Week Warrior',
      desc: 'Maintain a 7-day streak',
      check: (s) => s.bestStreak >= 7
    },
    {
      id: 'streak_14',
      icon: '💪',
      name: 'Fortnight Fire',
      desc: 'Maintain a 14-day streak',
      check: (s) => s.bestStreak >= 14
    },
    {
      id: 'streak_30',
      icon: '🌙',
      name: 'Moon Cycle Master',
      desc: 'Maintain a 30-day streak',
      check: (s) => s.bestStreak >= 30
    },
    {
      id: 'streak_100',
      icon: '☀️',
      name: 'Centurion',
      desc: 'Maintain a 100-day streak',
      check: (s) => s.bestStreak >= 100
    },

    // ── LEVELS ──
    {
      id: 'level_5',
      icon: '⭐',
      name: 'Rising Star',
      desc: 'Reach Level 5',
      check: (s) => s.level >= 5
    },
    {
      id: 'level_10',
      icon: '🌠',
      name: 'Star Explorer',
      desc: 'Reach Level 10',
      check: (s) => s.level >= 10
    },
    {
      id: 'level_20',
      icon: '🌙',
      name: 'Moonlit Adventurer',
      desc: 'Reach Level 20',
      check: (s) => s.level >= 20
    },
    {
      id: 'level_50',
      icon: '🌌',
      name: 'Cosmic Wanderer',
      desc: 'Reach Level 50',
      check: (s) => s.level >= 50
    },

    // ── COINS & REWARDS ──
    {
      id: 'first_redeem',
      icon: '🎁',
      name: 'Treat Yourself',
      desc: 'Redeem your first reward',
      check: (s) => s.totalRewardsRedeemed >= 1
    },
    {
      id: 'five_redeems',
      icon: '🛍️',
      name: 'Reward Hunter',
      desc: 'Redeem 5 rewards',
      check: (s) => s.totalRewardsRedeemed >= 5
    },
    {
      id: 'coins_100',
      icon: '🪙',
      name: 'Coin Collector',
      desc: 'Earn 100 coins in total',
      check: (s) => s.totalCoins >= 100
    },
    {
      id: 'coins_500',
      icon: '💰',
      name: 'Treasure Hunter',
      desc: 'Earn 500 coins in total',
      check: (s) => s.totalCoins >= 500
    },
    {
      id: 'coins_1000',
      icon: '🏦',
      name: 'Golden Vault',
      desc: 'Earn 1,000 coins in total',
      check: (s) => s.totalCoins >= 1000
    },

    // ── XP ──
    {
      id: 'xp_500',
      icon: '💫',
      name: 'XP Sprout',
      desc: 'Earn 500 total XP',
      check: (s) => s.totalXP >= 500
    },
    {
      id: 'xp_1000',
      icon: '🌟',
      name: 'XP Bloomer',
      desc: 'Earn 1,000 total XP',
      check: (s) => s.totalXP >= 1000
    },
    {
      id: 'xp_5000',
      icon: '✨',
      name: 'XP Radiant',
      desc: 'Earn 5,000 total XP',
      check: (s) => s.totalXP >= 5000
    },
    {
      id: 'xp_10000',
      icon: '🌌',
      name: 'XP Legend',
      desc: 'Earn 10,000 total XP',
      check: (s) => s.totalXP >= 10000
    },

    // ── FOREST ──
    {
      id: 'forest_first',
      icon: '🌳',
      name: 'Planting Roots',
      desc: 'Grow your first forest element',
      check: (s, fp) => fp.productiveDays >= 1
    },
    {
      id: 'forest_week',
      icon: '🌲',
      name: 'Forest Tender',
      desc: 'Grow your forest for 7 days',
      check: (s, fp) => fp.productiveDays >= 7
    },
    {
      id: 'forest_month',
      icon: '🌴',
      name: 'Ancient Grove',
      desc: 'Grow your forest for 30 days',
      check: (s, fp) => fp.productiveDays >= 30
    },
    {
      id: 'forest_century',
      icon: '🌍',
      name: 'World Forest',
      desc: 'Grow your forest for 100 days',
      check: (s, fp) => fp.productiveDays >= 100
    }
  ];

  // Check all achievements and unlock newly met ones
  function checkAll() {
    const s = FQ.state.stats;
    const fp = FQ.state.forestProgress;
    const newlyUnlocked = [];

    for (const badge of BADGES) {
      if (!FQ.state.achievements[badge.id]) {
        if (badge.check(s, fp)) {
          FQ.unlockAchievement(badge.id);
          newlyUnlocked.push(badge);
        }
      }
    }
    return newlyUnlocked;
  }

  function getAll() {
    return BADGES.map(b => ({
      ...b,
      unlocked: !!FQ.state.achievements[b.id],
      unlockedAt: FQ.state.achievements[b.id]?.unlockedAt || null
    }));
  }

  function getUnlocked() {
    return getAll().filter(b => b.unlocked);
  }

  function render() {
    const container = document.getElementById('achievementsGrid');
    if (!container) return;
    container.innerHTML = '';

    const all = getAll();
    all.forEach(badge => {
      const card = document.createElement('div');
      card.className = 'achievement-card ' + (badge.unlocked ? 'unlocked' : 'locked');
      card.innerHTML = `
        <div class="achievement-badge-icon">${badge.icon}</div>
        <div class="achievement-name">${badge.name}</div>
        <div class="achievement-desc">${badge.desc}</div>
        ${badge.unlocked ? `<div class="achievement-date">✅ ${FQ.formatDate(badge.unlockedAt)}</div>` : '<div class="achievement-desc" style="color:var(--text-light);font-style:italic">Locked</div>'}
      `;
      container.appendChild(card);
    });

    // Progress bar
    const earned = all.filter(b => b.unlocked).length;
    const total = all.length;
    const fill = document.getElementById('badgesProgressFill');
    const earnedEl = document.getElementById('badgesEarned');
    const totalEl = document.getElementById('badgesTotal');
    if (fill) fill.style.width = total ? (earned / total * 100) + '%' : '0%';
    if (earnedEl) earnedEl.textContent = earned;
    if (totalEl) totalEl.textContent = total;
  }

  function renderRecentBadges() {
    const container = document.getElementById('recentBadges');
    if (!container) return;
    const unlocked = getUnlocked().slice(-5).reverse();
    if (!unlocked.length) {
      container.innerHTML = '<div class="empty-state small"><p>Complete quests to earn your first badge! 🏅</p></div>';
      return;
    }
    container.innerHTML = '';
    unlocked.forEach(b => {
      const chip = document.createElement('div');
      chip.className = 'badge-chip';
      chip.innerHTML = `${b.icon} ${b.name}`;
      container.appendChild(chip);
    });
  }

  return { BADGES, checkAll, getAll, getUnlocked, render, renderRecentBadges };
})();
