// ════════════════════════════════════════════════════
//  Forest Quest — forest.js
//  Forest of Progress: grows elements based on productive days
// ════════════════════════════════════════════════════

const ForestModule = (() => {

  const MILESTONES = [
    // { days, emoji, label, layer, type }
    { days: 1,   emoji: '🌱', label: 'First Sprout',     layer: 'ground', type: 'plant',  size: 1.5 },
    { days: 2,   emoji: '🌸', label: 'Cherry Blossom',   layer: 'mid',    type: 'flower', size: 2.0 },
    { days: 3,   emoji: '🌿', label: 'Lush Ferns',       layer: 'ground', type: 'plant',  size: 1.8 },
    { days: 5,   emoji: '🌳', label: 'Oak Tree',         layer: 'back',   type: 'tree',   size: 3.5 },
    { days: 7,   emoji: '🦋', label: 'Butterfly',        layer: 'mid',    type: 'animal', size: 1.8, animated: true },
    { days: 10,  emoji: '🍄', label: 'Magic Mushrooms',  layer: 'ground', type: 'plant',  size: 1.6 },
    { days: 14,  emoji: '🌲', label: 'Pine Tree',        layer: 'back',   type: 'tree',   size: 3.8 },
    { days: 20,  emoji: '🦊', label: 'Forest Fox',       layer: 'ground', type: 'animal', size: 2.0, animated: true },
    { days: 21,  emoji: '🌷', label: 'Tulip Garden',     layer: 'ground', type: 'flower', size: 1.8 },
    { days: 25,  emoji: '🐦', label: 'Songbird',         layer: 'mid',    type: 'animal', size: 1.6, animated: true },
    { days: 30,  emoji: '🌺', label: 'Hibiscus',         layer: 'mid',    type: 'flower', size: 2.2 },
    { days: 35,  emoji: '🦌', label: 'Deer Visitor',     layer: 'ground', type: 'animal', size: 2.4, animated: true },
    { days: 40,  emoji: '🍀', label: 'Lucky Clover',     layer: 'ground', type: 'plant',  size: 1.4 },
    { days: 45,  emoji: '🌴', label: 'Tropical Tree',    layer: 'back',   type: 'tree',   size: 3.2 },
    { days: 50,  emoji: '🐿️', label: 'Squirrel',        layer: 'mid',    type: 'animal', size: 1.8, animated: true },
    { days: 60,  emoji: '✨', label: 'Fairy Lights',     layer: 'mid',    type: 'magic',  size: 1.6, animated: true },
    { days: 70,  emoji: '🌙', label: 'Moon Spirit',      layer: 'sky',    type: 'magic',  size: 2.2, animated: true },
    { days: 80,  emoji: '🦉', label: 'Wise Owl',         layer: 'mid',    type: 'animal', size: 2.0, animated: true },
    { days: 90,  emoji: '🌈', label: 'Rainbow',          layer: 'sky',    type: 'magic',  size: 3.0, animated: true },
    { days: 100, emoji: '🐉', label: 'Forest Dragon',    layer: 'sky',    type: 'animal', size: 3.5, animated: true },
    { days: 120, emoji: '⭐', label: 'Star Cluster',     layer: 'sky',    type: 'magic',  size: 2.0, animated: true },
    { days: 150, emoji: '🏰', label: 'Forest Castle',    layer: 'back',   type: 'magic',  size: 4.0 },
    { days: 200, emoji: '🌟', label: 'Eternal Star',     layer: 'sky',    type: 'magic',  size: 2.5, animated: true },
    { days: 365, emoji: '🌍', label: 'World Tree',       layer: 'back',   type: 'tree',   size: 5.0 }
  ];

  let cloudInterval = null;
  let animInterval = null;

  function getUnlockedMilestones(productiveDays) {
    return MILESTONES.filter(m => productiveDays >= m.days);
  }

  function render() {
    const container = document.getElementById('forestElements');
    const scene = document.getElementById('forestScene');
    if (!container || !scene) return;

    const days = FQ.state.forestProgress.productiveDays;
    const unlocked = getUnlockedMilestones(days);

    // Clear
    container.innerHTML = '';

    if (days === 0) {
      // Show lonely empty forest hint
      container.innerHTML = `<div style="position:absolute;bottom:20%;left:50%;transform:translateX(-50%);text-align:center;color:rgba(255,255,255,.7);font-size:.9rem;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,.3)">Complete quests to grow your forest! 🌱</div>`;
      return;
    }

    // Place elements with pseudo-random but deterministic positions
    unlocked.forEach((milestone, i) => {
      const el = document.createElement('span');
      el.classList.add('forest-element');
      el.textContent = milestone.emoji;

      // Deterministic position based on index
      const seed = i * 137.508; // golden angle
      const left = 5 + ((seed * 13.7) % 85); // 5% to 90%
      let bottom;
      switch (milestone.layer) {
        case 'sky':    bottom = 65 + ((seed * 7.3) % 20); break;
        case 'back':   bottom = 42 + ((seed * 9.1) % 18); break;
        case 'mid':    bottom = 30 + ((seed * 11.3) % 18); break;
        default:       bottom = 18 + ((seed * 5.7) % 16); break;
      }

      el.style.cssText = `
        left: ${left}%;
        bottom: ${bottom}%;
        font-size: ${milestone.size}rem;
        animation-delay: ${(i * 0.15) % 3}s;
        animation-duration: ${2.5 + (i * 0.4) % 2}s;
        z-index: ${milestone.layer === 'back' ? 1 : milestone.layer === 'mid' ? 2 : milestone.layer === 'sky' ? 0 : 3};
        filter: drop-shadow(0 4px 10px rgba(0,0,0,.15));
      `;

      // Extra animations for special elements
      if (milestone.animated) {
        el.style.animationName = getAnimationForType(milestone.type, i);
      }

      container.appendChild(el);
    });

    // Render clouds (always present, more with more days)
    renderClouds(days);
  }

  function getAnimationForType(type, i) {
    const anims = {
      animal: i % 2 === 0 ? 'animalBounce' : 'elementSway',
      magic: 'magicFloat',
      flower: 'elementSway',
      tree: 'elementSway'
    };
    return anims[type] || 'elementSway';
  }

  function renderClouds(days) {
    const cloudsEl = document.getElementById('forestClouds');
    if (!cloudsEl) return;
    cloudsEl.innerHTML = '';

    const cloudCount = Math.min(6, 1 + Math.floor(days / 5));
    const cloudEmojis = ['☁️', '⛅', '🌤️', '☁️', '☁️'];
    for (let i = 0; i < cloudCount; i++) {
      const c = document.createElement('span');
      c.className = 'forest-cloud';
      c.textContent = cloudEmojis[i % cloudEmojis.length];
      const top = 5 + (i * 11) % 35;
      const speed = 25 + (i * 7) % 30;
      const delay = -(i * speed / cloudCount);
      c.style.cssText = `
        top: ${top}%;
        font-size: ${1.5 + (i * 0.2) % 0.8}rem;
        left: -5%;
        animation-duration: ${speed}s;
        animation-delay: ${delay}s;
      `;
      cloudsEl.appendChild(c);
    }
  }

  function renderLegend() {
    const container = document.getElementById('forestLegend');
    if (!container) return;
    const days = FQ.state.forestProgress.productiveDays;
    container.innerHTML = '';

    MILESTONES.forEach(m => {
      const unlocked = days >= m.days;
      const item = document.createElement('div');
      item.className = 'legend-item ' + (unlocked ? 'unlocked' : 'locked');
      item.innerHTML = `
        <span class="legend-icon">${m.emoji}</span>
        <div>
          <div class="legend-label">${m.label}</div>
          <div class="legend-req">${unlocked ? '✅ Unlocked' : `${m.days} productive days`}</div>
        </div>
      `;
      container.appendChild(item);
    });
  }

  function renderStats() {
    const days = FQ.state.forestProgress.productiveDays;
    const unlocked = getUnlockedMilestones(days);
    const trees = unlocked.filter(m => m.type === 'tree').length;
    const flowers = unlocked.filter(m => m.type === 'flower').length;
    const animals = unlocked.filter(m => m.type === 'animal').length;

    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('forestTrees', trees);
    el('forestFlowers', flowers);
    el('forestAnimals', animals);
    el('forestDays', days);
  }

  function injectKeyframes() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes animalBounce {
        0%,100%{transform:translateY(0) rotate(-1deg)}
        30%{transform:translateY(-8px) rotate(1deg)}
        60%{transform:translateY(-3px) rotate(-1deg)}
      }
      @keyframes magicFloat {
        0%,100%{transform:translateY(0) scale(1)}
        50%{transform:translateY(-12px) scale(1.08)}
      }
      @keyframes cloudDrift {
        0%{transform:translateX(0)}
        100%{transform:translateX(calc(100vw + 10%))}
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    injectKeyframes();
    render();
    renderLegend();
    renderStats();
  }

  function refresh() {
    render();
    renderLegend();
    renderStats();
  }

  return { init, refresh, MILESTONES, getUnlockedMilestones };
})();
