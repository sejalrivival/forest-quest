// ════════════════════════════════════════════════════
//  Forest Quest — charts.js
//  Trend charts using Chart.js
// ════════════════════════════════════════════════════

const ChartsModule = (() => {

  let xpChart = null;
  let tasksChart = null;
  let categoryChart = null;
  let streakChart = null;
  let currentRange = 7;

  const PALETTE = {
    sage:      '#8fad88',
    sageFade:  'rgba(143,173,136,.2)',
    lav:       '#c5b8e3',
    lavFade:   'rgba(197,184,227,.2)',
    pink:      '#e8b4b8',
    pinkFade:  'rgba(232,180,184,.2)',
    sky:       '#a8d4e6',
    skyFade:   'rgba(168,212,230,.2)',
    gold:      '#e8c97a',
    goldFade:  'rgba(232,201,122,.2)',
    cream:     '#fdf8f2',
    text:      '#6b6460'
  };

  const CAT_COLORS = {
    Health:      '#8fad88',
    Learning:    '#a8c4e8',
    Chores:      '#e8c97a',
    Fitness:     '#e8a8a8',
    Creativity:  '#c5b8e3',
    Social:      '#a8d4e6',
    Mindfulness: '#c5d8a0',
    Other:       '#d4c4b0'
  };

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,.95)',
        titleColor: '#3a3533',
        bodyColor: '#6b6460',
        borderColor: '#e8e0d8',
        borderWidth: 1.5,
        padding: 10,
        cornerRadius: 10,
        titleFont: { family: 'Quicksand', weight: '700', size: 13 },
        bodyFont: { family: 'Quicksand', size: 12 }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: PALETTE.text,
          font: { family: 'Quicksand', size: 11 },
          maxRotation: 45
        },
        border: { color: 'rgba(180,165,150,.2)' }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(180,165,150,.12)' },
        ticks: {
          color: PALETTE.text,
          font: { family: 'Quicksand', size: 11 },
          precision: 0
        },
        border: { color: 'rgba(180,165,150,.2)' }
      }
    }
  };

  function formatLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function buildXPChart(range) {
    const ctx = document.getElementById('xpChart');
    if (!ctx) return;
    const data = FQ.getDailyXP(range);
    const labels = data.map(d => formatLabel(d.date));
    const values = data.map(d => d.xp);

    if (xpChart) xpChart.destroy();
    xpChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'XP Earned',
          data: values,
          borderColor: PALETTE.lav,
          backgroundColor: PALETTE.lavFade,
          borderWidth: 2.5,
          pointBackgroundColor: PALETTE.lav,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          tension: .4,
          fill: true
        }]
      },
      options: {
        ...defaultOptions,
        plugins: { ...defaultOptions.plugins, legend: { display: true, labels: { color: PALETTE.text, font: { family: 'Quicksand', size: 12 }, boxWidth: 12, padding: 12 } } }
      }
    });
  }

  function buildTasksChart(range) {
    const ctx = document.getElementById('tasksChart');
    if (!ctx) return;
    const data = FQ.getDailyTaskCount(range);
    const labels = data.map(d => formatLabel(d.date));
    const values = data.map(d => d.count);

    if (tasksChart) tasksChart.destroy();
    tasksChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Tasks Completed',
          data: values,
          backgroundColor: values.map(v => v > 0 ? PALETTE.sage : PALETTE.sageFade),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        ...defaultOptions,
        plugins: { ...defaultOptions.plugins, legend: { display: true, labels: { color: PALETTE.text, font: { family: 'Quicksand', size: 12 }, boxWidth: 12, padding: 12 } } }
      }
    });
  }

  function buildCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    const breakdown = FQ.getCategoryBreakdown();
    const categories = Object.keys(breakdown);
    const values = categories.map(c => breakdown[c]);
    const colors = categories.map(c => CAT_COLORS[c] || PALETTE.sky);

    if (!categories.length) {
      const parent = ctx.parentElement;
      ctx.style.display = 'none';
      if (!parent.querySelector('.empty-chart')) {
        const em = document.createElement('div');
        em.className = 'empty-chart empty-state small';
        em.innerHTML = '<p style="margin:32px 0">Complete quests to see your category breakdown!</p>';
        parent.appendChild(em);
      }
      return;
    }

    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories.map(c => {
          const emojis = { Health:'🌿', Learning:'📚', Chores:'🏠', Fitness:'💪', Creativity:'🎨', Social:'💬', Mindfulness:'🧘', Other:'🌟' };
          return `${emojis[c] || ''} ${c}`;
        }),
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: PALETTE.text, font: { family: 'Quicksand', size: 11 }, padding: 12, boxWidth: 14, usePointStyle: true }
          },
          tooltip: defaultOptions.plugins.tooltip
        }
      }
    });
  }

  function buildStreakChart(range) {
    const ctx = document.getElementById('streakChart');
    if (!ctx) return;
    const data = FQ.getStreakHistory(range);
    const labels = data.map(d => formatLabel(d.date));
    const values = data.map(d => d.active);

    if (streakChart) streakChart.destroy();
    streakChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Active Days',
          data: values,
          backgroundColor: values.map(v => v > 0 ? PALETTE.pink : 'rgba(232,180,184,.2)'),
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        ...defaultOptions,
        scales: {
          ...defaultOptions.scales,
          y: {
            ...defaultOptions.scales.y,
            max: 1,
            ticks: {
              ...defaultOptions.scales.y.ticks,
              callback: v => v === 1 ? '✅' : ''
            }
          }
        },
        plugins: {
          ...defaultOptions.plugins,
          legend: { display: true, labels: { color: PALETTE.text, font: { family: 'Quicksand', size: 12 }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...defaultOptions.plugins.tooltip,
            callbacks: { label: ctx => ctx.raw === 1 ? 'Active day ✅' : 'No activity' }
          }
        }
      }
    });
  }

  function buildAll(range) {
    currentRange = range || currentRange;
    buildXPChart(currentRange);
    buildTasksChart(currentRange);
    buildCategoryChart();
    buildStreakChart(currentRange);
    renderSummary();
  }

  function renderSummary() {
    const s = FQ.state.stats;
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val.toLocaleString(); };
    el('summaryTotal', s.totalTasksCompleted);
    el('summaryXP', s.totalXP);
    el('summaryStreak', s.bestStreak);
    el('summaryRedeemed', s.totalRewardsRedeemed);
  }

  // Time range buttons
  function initRangeButtons() {
    document.querySelectorAll('.trends-time-filter .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.trends-time-filter .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        buildAll(parseInt(btn.dataset.range));
      });
    });
  }

  return { buildAll, initRangeButtons };
})();
