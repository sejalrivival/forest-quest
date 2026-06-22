// ════════════════════════════════════════════════════
//  Forest Quest — app.js
//  Main application controller
// ════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── INIT ──
  document.addEventListener('DOMContentLoaded', () => {
    refreshAll();
    setupNav();
    setupTaskModal();
    setupRewardModal();
    setupRedeemModal();
    setupSettingsModal();
    setupMobileMenu();
    ChartsModule.initRangeButtons();
    ForestModule.init();
    setDateDisplay();
    checkDailyReset();
  });

  // ════════════════════
  //  NAV / TABS
  // ════════════════════
  function setupNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    document.querySelectorAll('[data-tab-link]').forEach(el => {
      el.addEventListener('click', () => switchTab(el.dataset.tabLink));
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const panel = document.getElementById('tab-' + tabId);
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');

    // Lazy render per tab
    if (tabId === 'trends') ChartsModule.buildAll();
    if (tabId === 'forest') ForestModule.refresh();
    if (tabId === 'achievements') { AchievementsModule.render(); }
    if (tabId === 'tasks') renderTaskList();
    if (tabId === 'shop') renderShop();

    // Close mobile sidebar
    closeMobileSidebar();
  }

  // ════════════════════
  //  FULL REFRESH
  // ════════════════════
  function refreshAll() {
    renderDashboard();
    renderTaskList();
    renderShop();
    AchievementsModule.renderRecentBadges();
  }

  // ════════════════════
  //  DASHBOARD
  // ════════════════════
  function renderDashboard() {
    const s = FQ.state.stats;
    const lp = FQ.getLevelProgress();

    setText('dashLevel', s.level);
    setText('dashXP', s.totalXP.toLocaleString());
    setText('dashCoins', s.coins.toLocaleString());
    setText('dashStreak', s.streak);
    setText('sidebarLevel', s.level);
    setText('sidebarName', FQ.state.profile.name);
    setText('sidebarAvatar', FQ.state.profile.avatar);
    setText('greetName', FQ.state.profile.name);
    setText('mobileCoins', s.coins.toLocaleString());

    // XP Bar
    setText('xpBarLevel', s.level);
    setText('xpBarNext', s.level + 1);
    setText('xpBarText', `${lp.xpIn.toLocaleString()} / ${lp.xpNeeded.toLocaleString()} XP`);
    const fill = document.getElementById('xpBarFill');
    if (fill) {
      requestAnimationFrame(() => { fill.style.width = lp.pct + '%'; });
    }

    // Today's list
    renderTodayList();

    // Streak calendar
    renderStreakCalendar();

    // Streak count
    setText('calStreak', s.streak);
    setText('todayCount', (() => {
      const done = (FQ.state.completionLog[FQ.today()] || []).length;
      return `${done} done`;
    })());

    AchievementsModule.renderRecentBadges();
  }

  function renderTodayList() {
    const container = document.getElementById('todayList');
    if (!container) return;
    const tasks = FQ.state.tasks;
    const daily = tasks.filter(t => t.repeat === 'daily' || t.repeat === 'once');

    if (!daily.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🌱</div><p>Add quests to see them here!</p></div>';
      return;
    }

    container.innerHTML = '';
    // Sort: incomplete first, then completed
    const sorted = [...daily].sort((a, b) => {
      const aDone = FQ.isTaskDoneToday(a.id) ? 1 : 0;
      const bDone = FQ.isTaskDoneToday(b.id) ? 1 : 0;
      return aDone - bDone;
    });

    sorted.forEach(task => {
      const done = FQ.isTaskDoneToday(task.id);
      const item = document.createElement('div');
      item.className = 'today-item' + (done ? ' done' : '');
      item.dataset.id = task.id;
      item.innerHTML = `
        <div class="today-check">${done ? '✅' : '⬜'}</div>
        <div class="today-name">${escHtml(task.name)}</div>
        <div class="today-reward">+${task.xp}xp</div>
      `;
      item.addEventListener('click', () => handleCompleteTask(task.id));
      container.appendChild(item);
    });
  }

  function renderStreakCalendar() {
    const cal = document.getElementById('streakCalendar');
    if (!cal) return;
    const days = FQ.getStreakCalendar(28);
    const todayStr = FQ.today();
    cal.innerHTML = '';
    days.forEach(d => {
      const el = document.createElement('div');
      el.className = 'cal-day' +
        (d.active ? ' active' : '') +
        (d.date === todayStr ? ' today-marker' : '') +
        (d.count > 0 && d.count < 3 ? ' partial' : '');
      el.title = `${d.date}: ${d.count} tasks`;
      const dayNum = new Date(d.date + 'T00:00:00').getDate();
      el.textContent = dayNum;
      cal.appendChild(el);
    });
  }

  function setDateDisplay() {
    const el = document.getElementById('dateDisplay');
    if (el) {
      const opts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
      el.textContent = new Date().toLocaleDateString('en-US', opts);
    }
  }

  // ════════════════════
  //  TASK COMPLETE FLOW
  // ════════════════════
  function handleCompleteTask(taskId) {
    const alreadyDone = FQ.isTaskDoneToday(taskId);

    if (alreadyDone) {
      // Toggle uncomplete
      const task = FQ.uncompleteTask(taskId);
      if (task) {
        showToast(`Unmarked: ${task.name}`, '↩️');
        afterTaskUpdate();
      }
    } else {
      const result = FQ.completeTask(taskId);
      if (!result) return;

      showToast(`+${result.task.xp} XP, +${result.task.coins} 🪙`, '✨', 'xp');

      // Check achievements
      const newBadges = AchievementsModule.checkAll();
      newBadges.forEach((badge, i) => {
        setTimeout(() => showAchievementFanfare(badge), i * 800);
      });

      // Level up?
      if (result.levelUp) {
        setTimeout(() => showLevelUpFanfare(result.newLevel), newBadges.length * 800 + 400);
        spawnConfetti();
      }

      afterTaskUpdate();
    }
  }

  function afterTaskUpdate() {
    renderDashboard();
    renderTaskList();
    ForestModule.refresh();
  }

  // ════════════════════
  //  TASK LIST
  // ════════════════════
  let currentCatFilter = 'all';

  function renderTaskList() {
    const container = document.getElementById('taskList');
    if (!container) return;
    const tasks = FQ.state.tasks;
    const filtered = currentCatFilter === 'all'
      ? tasks
      : tasks.filter(t => t.category === currentCatFilter);

    if (!tasks.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🗺️</div>
          <h3>Your adventure awaits!</h3>
          <p>Create your first quest to start earning XP and coins.</p>
          <button class="btn btn-primary" id="openAddTaskEmpty">+ Create First Quest</button>
        </div>`;
      document.getElementById('openAddTaskEmpty')?.addEventListener('click', openAddTask);
      return;
    }

    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No quests in this category yet.</p></div>`;
      return;
    }

    container.innerHTML = '';
    // Sort: incomplete today first
    const sorted = [...filtered].sort((a, b) => {
      const aDone = FQ.isTaskDoneToday(a.id) ? 1 : 0;
      const bDone = FQ.isTaskDoneToday(b.id) ? 1 : 0;
      return aDone - bDone;
    });

    sorted.forEach(task => {
      const done = FQ.isTaskDoneToday(task.id);
      const card = document.createElement('div');
      card.className = 'task-card' + (done ? ' completed-today' : '');
      card.innerHTML = `
        <button class="task-complete-btn" aria-label="${done ? 'Undo complete' : 'Complete quest'}">${done ? '✅' : ''}</button>
        <div class="task-info">
          <div class="task-name">${escHtml(task.name)}</div>
          <div class="task-meta">
            <span class="task-cat cat-${task.category}">${catEmoji(task.category)} ${task.category}</span>
            <span class="task-reward-badge">✨ +${task.xp} XP</span>
            <span class="task-reward-badge">🪙 +${task.coins}</span>
            <span class="task-repeat-badge">${task.repeat}</span>
          </div>
        </div>
        <button class="task-edit-btn" aria-label="Edit quest">✏️</button>
      `;
      card.querySelector('.task-complete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleCompleteTask(task.id);
      });
      card.querySelector('.task-edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditTask(task);
      });
      card.addEventListener('click', () => handleCompleteTask(task.id));
      container.appendChild(card);
    });
  }

  // Category filter setup
  document.getElementById('categoryFilter')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('#categoryFilter .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCatFilter = btn.dataset.cat;
    renderTaskList();
  });

  // ════════════════════
  //  TASK MODAL
  // ════════════════════
  let editingTaskId = null;

  function setupTaskModal() {
    document.getElementById('openAddTask')?.addEventListener('click', openAddTask);
    document.getElementById('quickAddBtn')?.addEventListener('click', () => { switchTab('tasks'); openAddTask(); });
    document.getElementById('closeTaskModal')?.addEventListener('click', closeTaskModal);
    document.getElementById('cancelTaskModal')?.addEventListener('click', closeTaskModal);
    document.getElementById('saveTask')?.addEventListener('click', saveTask);
    document.getElementById('deleteTaskBtn')?.addEventListener('click', () => {
      if (editingTaskId && confirm('Delete this quest?')) {
        FQ.deleteTask(editingTaskId);
        closeTaskModal();
        refreshAll();
        showToast('Quest deleted', '🗑️');
      }
    });
    document.getElementById('taskModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'taskModal') closeTaskModal();
    });
  }

  function openAddTask() {
    editingTaskId = null;
    setText('taskModalTitle', 'New Quest');
    document.getElementById('taskName').value = '';
    document.getElementById('taskCategory').value = 'Health';
    document.getElementById('taskXP').value = '10';
    document.getElementById('taskCoins').value = '5';
    document.getElementById('taskRepeat').value = 'daily';
    document.getElementById('taskNotes').value = '';
    document.getElementById('deleteTaskBtn').style.display = 'none';
    openModal('taskModal');
  }

  function openEditTask(task) {
    editingTaskId = task.id;
    setText('taskModalTitle', 'Edit Quest');
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskCategory').value = task.category;
    document.getElementById('taskXP').value = task.xp;
    document.getElementById('taskCoins').value = task.coins;
    document.getElementById('taskRepeat').value = task.repeat;
    document.getElementById('taskNotes').value = task.notes || '';
    document.getElementById('deleteTaskBtn').style.display = 'block';
    openModal('taskModal');
  }

  function closeTaskModal() { closeModal('taskModal'); }

  function saveTask() {
    const name = document.getElementById('taskName').value.trim();
    if (!name) { shakeInput('taskName'); return; }
    const data = {
      name,
      category: document.getElementById('taskCategory').value,
      xp: document.getElementById('taskXP').value,
      coins: document.getElementById('taskCoins').value,
      repeat: document.getElementById('taskRepeat').value,
      notes: document.getElementById('taskNotes').value
    };
    if (editingTaskId) {
      FQ.updateTask(editingTaskId, data);
      showToast('Quest updated! ✨');
    } else {
      FQ.addTask(data);
      showToast('New quest added! 🌱');
    }
    closeTaskModal();
    refreshAll();
  }

  // ════════════════════
  //  REWARD MODAL
  // ════════════════════
  let editingRewardId = null;

  function setupRewardModal() {
    document.getElementById('openAddReward')?.addEventListener('click', openAddReward);
    document.getElementById('openAddRewardEmpty')?.addEventListener('click', openAddReward);
    document.getElementById('closeRewardModal')?.addEventListener('click', closeRewardModal);
    document.getElementById('cancelRewardModal')?.addEventListener('click', closeRewardModal);
    document.getElementById('saveReward')?.addEventListener('click', saveReward);
    document.getElementById('deleteRewardBtn')?.addEventListener('click', () => {
      if (editingRewardId && confirm('Delete this reward?')) {
        FQ.deleteReward(editingRewardId);
        closeRewardModal();
        renderShop();
        showToast('Reward deleted', '🗑️');
      }
    });
    document.getElementById('rewardModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'rewardModal') closeRewardModal();
    });
  }

  function openAddReward() {
    editingRewardId = null;
    setText('rewardModalTitle', 'New Reward');
    document.getElementById('rewardName').value = '';
    document.getElementById('rewardDesc').value = '';
    document.getElementById('rewardIcon').value = '🎁';
    document.getElementById('rewardCost').value = '50';
    document.getElementById('deleteRewardBtn').style.display = 'none';
    openModal('rewardModal');
  }

  function openEditReward(reward) {
    editingRewardId = reward.id;
    setText('rewardModalTitle', 'Edit Reward');
    document.getElementById('rewardName').value = reward.name;
    document.getElementById('rewardDesc').value = reward.desc || '';
    document.getElementById('rewardIcon').value = reward.icon || '🎁';
    document.getElementById('rewardCost').value = reward.cost;
    document.getElementById('deleteRewardBtn').style.display = 'block';
    openModal('rewardModal');
  }

  function closeRewardModal() { closeModal('rewardModal'); }

  function saveReward() {
    const name = document.getElementById('rewardName').value.trim();
    if (!name) { shakeInput('rewardName'); return; }
    const data = {
      name,
      desc: document.getElementById('rewardDesc').value.trim(),
      icon: document.getElementById('rewardIcon').value.trim() || '🎁',
      cost: document.getElementById('rewardCost').value
    };
    if (editingRewardId) {
      FQ.updateReward(editingRewardId, data);
      showToast('Reward updated! ✨');
    } else {
      FQ.addReward(data);
      showToast('Reward added! 🎁');
    }
    closeRewardModal();
    renderShop();
  }

  // ════════════════════
  //  SHOP
  // ════════════════════
  function renderShop() {
    const container = document.getElementById('rewardList');
    if (!container) return;
    const coins = FQ.state.stats.coins;
    setText('shopCoins', coins.toLocaleString());
    setText('mobileCoins', coins.toLocaleString());

    const rewards = FQ.state.rewards;

    if (!rewards.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🎁</div>
          <h3>Build your reward shelf!</h3>
          <p>Add things you love — candy, game time, a movie night.</p>
          <button class="btn btn-primary" id="openAddRewardEmpty2">+ Add First Reward</button>
        </div>`;
      document.getElementById('openAddRewardEmpty2')?.addEventListener('click', openAddReward);
      return;
    }

    container.innerHTML = '';
    rewards.forEach(r => {
      const canAfford = coins >= r.cost;
      const card = document.createElement('div');
      card.className = 'reward-card';
      card.innerHTML = `
        <button class="reward-edit-btn" aria-label="Edit">✏️</button>
        <div class="reward-icon-large">${r.icon || '🎁'}</div>
        <div class="reward-name">${escHtml(r.name)}</div>
        ${r.desc ? `<div class="reward-desc-text">${escHtml(r.desc)}</div>` : ''}
        <div class="reward-cost-badge">🪙 ${r.cost} coins</div>
        <button class="btn btn-primary btn-sm" ${canAfford ? '' : 'disabled style="opacity:.5;cursor:not-allowed"'}>
          ${canAfford ? 'Redeem 🎉' : 'Need more coins'}
        </button>
      `;
      card.querySelector('.reward-edit-btn').addEventListener('click', () => openEditReward(r));
      const redeemBtn = card.querySelector('.btn-primary');
      if (canAfford) {
        redeemBtn.addEventListener('click', () => openRedeemModal(r));
      }
      container.appendChild(card);
    });

    // Redemption history
    const log = FQ.state.redeemLog;
    const histCard = document.getElementById('redemptionHistoryCard');
    const histList = document.getElementById('redemptionList');
    if (histCard && histList) {
      if (log.length) {
        histCard.style.display = 'block';
        histList.innerHTML = '';
        [...log].reverse().slice(0, 20).forEach(entry => {
          const item = document.createElement('div');
          item.className = 'redemption-item';
          item.innerHTML = `
            <div class="redemption-icon">${entry.icon || '🎁'}</div>
            <div class="redemption-info">
              <div class="redemption-name">${escHtml(entry.name)}</div>
              <div class="redemption-date">${FQ.formatDate(entry.date)}</div>
            </div>
            <div class="redemption-cost">-${entry.cost} 🪙</div>
          `;
          histList.appendChild(item);
        });
      } else {
        histCard.style.display = 'none';
      }
    }
  }

  // ════════════════════
  //  REDEEM MODAL
  // ════════════════════
  let redeemTargetId = null;

  function setupRedeemModal() {
    document.getElementById('closeRedeemModal')?.addEventListener('click', () => closeModal('redeemModal'));
    document.getElementById('cancelRedeem')?.addEventListener('click', () => closeModal('redeemModal'));
    document.getElementById('confirmRedeem')?.addEventListener('click', confirmRedeem);
    document.getElementById('redeemModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'redeemModal') closeModal('redeemModal');
    });
  }

  function openRedeemModal(reward) {
    redeemTargetId = reward.id;
    setText('redeemIcon', reward.icon || '🎁');
    setText('redeemName', reward.name);
    setText('redeemCost', reward.cost + ' coins');
    setText('redeemBalance', `You have ${FQ.state.stats.coins} coins. After: ${FQ.state.stats.coins - reward.cost} coins.`);
    openModal('redeemModal');
  }

  function confirmRedeem() {
    const result = FQ.redeemReward(redeemTargetId);
    closeModal('redeemModal');
    if (result.ok) {
      showToast(`Enjoyed: ${result.reward.name} 🎉`, result.reward.icon, 'coin');
      spawnConfetti();
      renderDashboard();
      renderShop();
      const newBadges = AchievementsModule.checkAll();
      newBadges.forEach((badge, i) => {
        setTimeout(() => showAchievementFanfare(badge), i * 800 + 300);
      });
    } else {
      showToast(result.reason, '❌', 'error');
    }
  }

  // ════════════════════
  //  SETTINGS MODAL
  // ════════════════════
  function setupSettingsModal() {
    document.getElementById('openSettings')?.addEventListener('click', openSettings);
    document.getElementById('closeSettings')?.addEventListener('click', () => closeModal('settingsModal'));
    document.getElementById('saveSettings')?.addEventListener('click', saveSettings);
    document.getElementById('settingsModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'settingsModal') closeModal('settingsModal');
    });
    document.getElementById('exportDataBtn')?.addEventListener('click', () => { FQ.exportData(); showToast('Data exported! 📥'); });
    document.getElementById('importDataBtn')?.addEventListener('click', () => document.getElementById('importFileInput').click());
    document.getElementById('importFileInput')?.addEventListener('change', handleImport);
    document.getElementById('resetDataBtn')?.addEventListener('click', () => {
      if (confirm('Reset ALL data? This cannot be undone.')) {
        FQ.resetData();
        refreshAll();
        ForestModule.refresh();
        AchievementsModule.render();
        closeModal('settingsModal');
        showToast('Data reset. Fresh start! 🌱');
      }
    });

    document.getElementById('avatarPicker')?.addEventListener('click', (e) => {
      const opt = e.target.closest('.avatar-opt');
      if (!opt) return;
      document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
      opt.classList.add('selected');
    });
  }

  function openSettings() {
    document.getElementById('settingsName').value = FQ.state.profile.name;
    document.querySelectorAll('.avatar-opt').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.av === FQ.state.profile.avatar);
    });
    openModal('settingsModal');
  }

  function saveSettings() {
    const name = document.getElementById('settingsName').value.trim() || 'Adventurer';
    const selected = document.querySelector('.avatar-opt.selected');
    const avatar = selected ? selected.dataset.av : FQ.state.profile.avatar;
    FQ.state.profile.name = name;
    FQ.state.profile.avatar = avatar;
    FQ.save();
    closeModal('settingsModal');
    renderDashboard();
    showToast('Settings saved! ✨');
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        FQ.importData(ev.target.result);
        refreshAll();
        ForestModule.refresh();
        AchievementsModule.render();
        closeModal('settingsModal');
        showToast('Data imported! 🎉');
      } catch (err) {
        showToast('Import failed — invalid file', '❌', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ════════════════════
  //  MOBILE SIDEBAR
  // ════════════════════
  function setupMobileMenu() {
    document.getElementById('hamburger')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('mobile-open');
      document.getElementById('sidebarOverlay').classList.toggle('show');
    });
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeMobileSidebar);
  }

  function closeMobileSidebar() {
    document.getElementById('sidebar')?.classList.remove('mobile-open');
    document.getElementById('sidebarOverlay')?.classList.remove('show');
  }

  // ════════════════════
  //  FANFARES & TOASTS
  // ════════════════════
  function showAchievementFanfare(badge) {
    const el = document.getElementById('achievementFanfare');
    if (!el) return;
    document.getElementById('fanfareIcon').textContent = badge.icon;
    document.getElementById('fanfareName').textContent = badge.name;
    el.style.display = 'flex';
    spawnConfetti();
    setTimeout(() => { el.style.display = 'none'; }, 2600);
  }

  function showLevelUpFanfare(level) {
    const el = document.getElementById('levelupFanfare');
    if (!el) return;
    document.getElementById('levelupName').textContent = `You reached Level ${level}!`;
    el.style.display = 'flex';
    spawnConfetti();
    setTimeout(() => { el.style.display = 'none'; }, 2600);
  }

  let toastQueue = [];
  function showToast(message, icon = '🌟', type = '') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ` toast-${type}` : '');
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 350);
    }, 2800);
  }

  function spawnConfetti() {
    const colors = ['#8fad88','#e8b4b8','#c5b8e3','#a8d4e6','#e8c97a','#f5dde0'];
    for (let i = 0; i < 42; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.cssText = `
        left: ${10 + Math.random() * 80}%;
        top: -20px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
        border-radius: ${Math.random() > .5 ? '50%' : '2px'};
        animation-duration: ${0.9 + Math.random() * 1.4}s;
        animation-delay: ${Math.random() * 0.4}s;
      `;
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 2400);
    }
  }

  // ════════════════════
  //  DAILY RESET
  // ════════════════════
  function checkDailyReset() {
    // One-time daily quests: already handled by checking completion log per day
    // Weekly tasks reset on week boundary
    const today = FQ.today();
    const lastActive = FQ.state.stats.lastActiveDate;
    if (!lastActive) {
      FQ.state.stats.lastActiveDate = today;
      FQ.save();
    }
  }

  // ════════════════════
  //  HELPERS
  // ════════════════════
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function shakeInput(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.animation = 'none';
    el.style.borderColor = 'var(--danger)';
    el.focus();
    setTimeout(() => el.style.borderColor = '', 1200);
  }

  function catEmoji(cat) {
    const m = { Health:'🌿', Learning:'📚', Chores:'🏠', Fitness:'💪', Creativity:'🎨', Social:'💬', Mindfulness:'🧘', Other:'🌟' };
    return m[cat] || '🌟';
  }

})();
