# 🌲 Forest Quest

> **A cozy, gamified habit tracker and reward system with a magical forest that grows as you do.**

Forest Quest transforms your daily habits into a whimsical life-management game, inspired by the soft, dreamlike atmosphere of Studio Ghibli. Complete quests to earn XP and coins, redeem rewards you love, unlock achievement badges, and watch your personal forest bloom with every productive day.

---

## ✨ Features

### 🏡 Dashboard
- Live level display with animated XP progress bar
- Coin balance, day streak counter, and total XP
- Today's quest checklist — click any task to complete it
- 28-day streak calendar showing your activity at a glance
- Recent badge showcase

### ✨ Quests
- Create unlimited custom quests with name, category, XP reward, coin reward, and repeat type (daily / weekly / one-time)
- Filter by 8 categories: Health, Learning, Chores, Fitness, Creativity, Social, Mindfulness, Other
- Instant completion with satisfying animations and toast notifications
- Edit or delete quests at any time

### 🛍️ Rewards Shop
- Build a personal reward shelf — candy, gaming sessions, movie nights, reading time, or anything you love
- Configure coin costs for each reward
- Redeem with one click when you can afford it
- Full redemption history

### 🏅 Achievements (28 badges)
- First task, streak milestones (3, 7, 14, 30, 100 days)
- Level milestones, XP milestones, coin milestones
- Forest growth badges, reward redemption badges
- Progress bar showing total badges earned

### 🌿 Forest of Progress
- Your forest grows with every productive day
- 24 unlockable elements: sprouts, flowers, trees, animals, magical creatures
- Animated forest scene with drifting clouds and swaying elements
- Unlock butterflies at day 7, foxes at day 20, deer at day 35, dragons at day 100, and more
- Milestone legend showing what's unlocked and what's coming next

### 📊 Trends & Analytics
- XP Earned over time (line chart)
- Tasks Completed per day (bar chart)
- Category Breakdown (doughnut chart)
- Streak History (bar chart)
- Switch between 7-day, 30-day, and 90-day views
- All-time summary statistics

### ⚙️ Settings
- Custom name and avatar (10 options)
- Export data as JSON backup
- Import data from backup
- Reset all data

---

## 🚀 Deploy to GitHub Pages

### Method 1: Upload ZIP (Quickest)

1. **Download** the ZIP file and extract it
2. **Create a new repository** at [github.com/new](https://github.com/new)
   - Name it `forest-quest` (or anything you like)
   - Set it to **Public**
3. **Upload files**: On your new repo page, click **"uploading an existing file"**
   - Drag all extracted files into the upload area
   - Commit with message: `Initial commit: Forest Quest`
4. **Enable GitHub Pages**:
   - Go to your repo → **Settings** → **Pages**
   - Under "Source", select **Deploy from a branch**
   - Branch: `main`, Folder: `/ (root)`
   - Click **Save**
5. Your site will be live at: `https://YOUR-USERNAME.github.io/forest-quest`

*(It may take 1–2 minutes for the first deployment.)*

---

### Method 2: Git CLI

```bash
# 1. Create and navigate to a new directory
mkdir forest-quest && cd forest-quest

# 2. Extract files here, then initialize git
git init
git add .
git commit -m "Initial commit: Forest Quest"

# 3. Create repo on GitHub (via browser or gh CLI)
gh repo create forest-quest --public --push --source=.
# OR if you already created the repo:
git remote add origin https://github.com/YOUR-USERNAME/forest-quest.git
git push -u origin main

# 4. Enable Pages in repo Settings → Pages
```

---

## 🗂️ Project Structure

```
forest-quest/
├── index.html          # Main HTML — all tabs, modals, layout
├── css/
│   └── styles.css      # All styles — tokens, components, responsive
├── js/
│   ├── data.js         # LocalStorage layer, all state management
│   ├── forest.js       # Forest of Progress scene rendering
│   ├── achievements.js # 28 achievement badges + checking logic
│   ├── charts.js       # Chart.js trend charts
│   └── app.js          # Main controller — UI, events, interactions
└── README.md
```

---

## 🛠️ Local Development

No build tools required! Just open `index.html` in any modern browser:

```bash
# Option A: Python (built-in)
python3 -m http.server 3000
# then visit http://localhost:3000

# Option B: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"

# Option C: Just open the file
open index.html   # macOS
start index.html  # Windows
```

---

## 💾 Data Storage

All data is saved in your browser's **LocalStorage** under the key `forestQuestData_v2`. This means:

- ✅ Data persists across sessions automatically
- ✅ No account or server needed
- ⚠️ Data is browser-specific (different browsers = different saves)
- ⚠️ Clearing browser data / cookies will erase your progress

**To back up your data**: Settings ⚙️ → Export Data  
**To restore**: Settings ⚙️ → Import Data

---

## 🎨 Design

Forest Quest uses a pastel palette inspired by soft, hand-painted Ghibli environments:

| Name        | Hex       | Usage |
|-------------|-----------|-------|
| Sage Green  | `#8fad88` | Primary buttons, streaks, nature |
| Dusty Pink  | `#e8b4b8` | Accents, streak badges |
| Cream       | `#fdf8f2` | Background, cards |
| Lavender    | `#c5b8e3` | XP bar, achievements |
| Sky Blue    | `#a8d4e6` | Charts, sky elements |
| Gold        | `#e8c97a` | Coins, rewards, level cards |

Typography: **Quicksand** (UI) + **Crimson Pro** (headings)

---

## 📋 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Firefox 90+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Mobile browsers | ✅ Responsive |

---

## 📄 License

MIT — free to use, modify, and share.

---

*Happy questing! May your forest grow tall and your streak burn bright. 🌲✨*
