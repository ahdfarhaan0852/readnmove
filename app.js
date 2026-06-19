/* ==========================================================================
   DUALSPHERE NOTES - APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Automatic migration / wipe for v2 release to clear mock data
  const APP_VERSION = '2';
  const currentSavedVersion = localStorage.getItem('ds_app_version');
  if (currentSavedVersion !== APP_VERSION) {
    localStorage.removeItem('ds_mental_notes');
    localStorage.removeItem('ds_physical_notes');
    localStorage.removeItem('ds_completed_notes');
    localStorage.removeItem('ds_water');
    localStorage.setItem('ds_app_version', APP_VERSION);
  }

  // Helper to get date string offset by N days
  const getDateOffsetString = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() - daysOffset);
    return d.toLocaleDateString();
  };

  // ==================== STATE MANAGEMENT ====================
  let state = {
    mentalNotes: JSON.parse(localStorage.getItem('ds_mental_notes')) || [],
    physicalNotes: JSON.parse(localStorage.getItem('ds_physical_notes')) || [],
    completedNotes: JSON.parse(localStorage.getItem('ds_completed_notes')) || [],
    water: JSON.parse(localStorage.getItem('ds_water')) || {
      current: 0,
      target: 2000
    },
    currentNoteType: 'mental' // Tracks which workspace triggers the input modal
  };

  let currentArchiveFolder = 'mental'; // Tracks active folder in completed notes archive ('mental' or 'physical')
  let activeChartView = 'weekly'; // 'weekly' or 'monthly' for line chart

  // Helper to save state to LocalStorage
  const saveState = () => {
    localStorage.setItem('ds_mental_notes', JSON.stringify(state.mentalNotes));
    localStorage.setItem('ds_physical_notes', JSON.stringify(state.physicalNotes));
    localStorage.setItem('ds_completed_notes', JSON.stringify(state.completedNotes));
    localStorage.setItem('ds_water', JSON.stringify(state.water));
  };

  // ==================== DOM ELEMENTS ====================
  const mentalNotesList = document.getElementById('mental-notes-list');
  const physicalNotesList = document.getElementById('physical-notes-list');
  const completedNotesList = document.getElementById('completed-notes-list');
  const transactionsList = document.getElementById('transactions-list');
  const habitsContainer = document.getElementById('habits-container');
  
  // Dialog / Modal Elements
  const noteModal = document.getElementById('note-modal');
  const modalTitle = document.getElementById('modal-title');
  const noteInputTitle = document.getElementById('note-input-title');
  const noteInputBody = document.getElementById('note-input-body');
  const btnSelectMental = document.getElementById('btn-select-mental');
  const btnSelectPhysical = document.getElementById('btn-select-physical');
  
  // Navigation Screens
  const mainHomeView = document.getElementById('main-home-view');
  const subPagesView = document.getElementById('sub-pages-view');
  const subPagesScroller = document.getElementById('sub-pages-scroller');
  const subPageTitle = document.getElementById('sub-page-title');
  const splitWorkspaces = document.getElementById('split-workspaces');
  
  // Tab Buttons
  const tabButtons = {
    water: document.getElementById('tab-water'),
    tracker: document.getElementById('tab-tracker'),
    completed: document.getElementById('tab-completed')
  };

  const btnFolderMental = document.getElementById('btn-folder-mental');
  const btnFolderPhysical = document.getElementById('btn-folder-physical');

  // Real-time Date Header
  const realtimeDateEl = document.getElementById('realtime-date');
  const updateRealTimeDate = () => {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    realtimeDateEl.innerText = now.toLocaleDateString('id-ID', options);
  };
  updateRealTimeDate();
  setInterval(updateRealTimeDate, 1000);

  // Water Tracker DOM Elements
  const waterProgressText = document.getElementById('water-progress-text');
  const waterPercentDesc = document.getElementById('water-percent-desc');
  const waterGlassFill = document.getElementById('water-glass-fill');
  const btnAdd250 = document.getElementById('btn-add-250');
  const btnAdd600 = document.getElementById('btn-add-600');
  const btnResetWater = document.getElementById('btn-reset-water');

  // Chart Toggle Switchers
  const btnToggleWeekly = document.getElementById('btn-toggle-weekly');
  const btnToggleMonthly = document.getElementById('btn-toggle-monthly');

  // ==================== RENDERING LOGIC ====================

  // 1. Render Left & Right Home Workspace Notes
  const renderHomeNotes = () => {
    // Render Mental Notes
    mentalNotesList.innerHTML = '';
    if (state.mentalNotes.length === 0) {
      mentalNotesList.innerHTML = `<div class="empty-state-text">Catatan otak kosong. Buat ide baru!</div>`;
    } else {
      state.mentalNotes.forEach(note => {
        const card = createNoteCard(note, 'mental');
        mentalNotesList.appendChild(card);
      });
    }

    // Render Physical Notes
    physicalNotesList.innerHTML = '';
    if (state.physicalNotes.length === 0) {
      physicalNotesList.innerHTML = `<div class="empty-state-text">Catatan latihan kosong. Catat perkembangan olahraga Anda!</div>`;
    } else {
      state.physicalNotes.forEach(note => {
        const card = createNoteCard(note, 'physical');
        physicalNotesList.appendChild(card);
      });
    }
  };

  // Helper to create a single Note HTML Element
  const createNoteCard = (note, type) => {
    const card = document.createElement('div');
    card.className = 'note-item-card';
    card.setAttribute('data-id', note.id);
    
    card.innerHTML = `
      <div class="note-title">${escapeHTML(note.title)}</div>
      <div class="note-body">${escapeHTML(note.body)}</div>
      <div class="note-actions">
        <button class="btn-card-action btn-complete interactive" aria-label="Selesaikan Catatan">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <button class="btn-card-action btn-delete interactive" aria-label="Hapus Catatan">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Complete Action Button
    card.querySelector('.btn-complete').addEventListener('click', (e) => {
      e.stopPropagation();
      completeNote(note.id, type);
    });

    // Delete Action Button
    card.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNote(note.id, type);
    });

    // Add visual interactive active states
    setupInteractiveScale(card);

    return card;
  };

  // 2. Render Completed Notes Archive
  const renderCompletedNotes = () => {
    completedNotesList.innerHTML = '';
    
    // Filter completed notes by active archive folder
    const filteredNotes = state.completedNotes.filter(note => {
      if (currentArchiveFolder === 'mental') return note.type === 'brain';
      return note.type === 'sport';
    });

    document.getElementById('completed-notes-count').innerText = `${filteredNotes.length} Catatan`;
    
    if (filteredNotes.length === 0) {
      completedNotesList.innerHTML = `<div class="empty-state-text" style="color: white; opacity: 0.6;">Belum ada catatan selesai di folder ini.</div>`;
      return;
    }

    filteredNotes.forEach((note, index) => {
      const card = document.createElement('div');
      card.className = 'completed-item-card';
      
      const badgeClass = note.type === 'brain' ? 'brain' : 'sport';
      const badgeText = note.type === 'brain' ? 'Olah Otak' : 'Olahraga';
      
      card.innerHTML = `
        <svg class="checkmark-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <div class="completed-card-main">
          <span class="badge-type ${badgeClass}">${badgeText}</span>
          <div class="note-title">${escapeHTML(note.title)}</div>
          <div class="note-body">${escapeHTML(note.body)}</div>
        </div>
      `;

      // Apply random fly-in transition with staggered delay
      const anims = ['randomFlyIn1', 'randomFlyIn2', 'randomFlyIn3', 'randomFlyIn4'];
      const randomAnim = anims[Math.floor(Math.random() * anims.length)];
      card.style.animation = `${randomAnim} 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.1) ${index * 0.05}s both`;

      completedNotesList.appendChild(card);
    });
  };

  // 3. Render Water Hydration Tracker
  const renderWater = () => {
    waterProgressText.innerText = `${state.water.current} / ${state.water.target} ml`;
    
    const percent = Math.min(Math.round((state.water.current / state.water.target) * 100), 100);
    
    if (state.water.current >= state.water.target) {
      waterPercentDesc.innerHTML = `Selamat! Target asupan air harian Anda terpenuhi (${percent}%).`;
      waterPercentDesc.style.color = '#82C99B';
    } else {
      waterPercentDesc.innerHTML = `Tercapai ${percent}% dari target harian Anda. Tetap terhidrasi!`;
      waterPercentDesc.style.color = '';
    }
    
    // Update liquid level container height
    waterGlassFill.style.height = `${percent}%`;
  };

  // Tooltip Logic for Line Chart
  let tooltipEl = document.getElementById('chart-tooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chart-tooltip';
    tooltipEl.className = 'chart-tooltip-bubble';
    document.body.appendChild(tooltipEl);
  }

  const showChartTooltip = (e, label, count) => {
    tooltipEl.innerHTML = `<strong>${label}</strong><br/>${count} Catatan Selesai`;
    tooltipEl.style.display = 'block';
    moveChartTooltip(e);
  };

  const moveChartTooltip = (e) => {
    tooltipEl.style.left = `${e.pageX}px`;
    tooltipEl.style.top = `${e.pageY}px`;
  };

  const hideChartTooltip = () => {
    tooltipEl.style.display = 'none';
  };

  // Weekly progress percentage distribution render
  const renderWeeklyBreakdown = (days) => {
    const listEl = document.getElementById('weekly-percentages-list');
    listEl.innerHTML = '';
    
    // Group 28 days into 4 weeks
    const weeks = [
      { name: 'Minggu 4 (Terbaru)', startIdx: 21, endIdx: 27 },
      { name: 'Minggu 3', startIdx: 14, endIdx: 20 },
      { name: 'Minggu 2', startIdx: 7, endIdx: 13 },
      { name: 'Minggu 1', startIdx: 0, endIdx: 6 }
    ];
    
    weeks.forEach(wk => {
      let wkSum = 0;
      for (let i = wk.startIdx; i <= wk.endIdx; i++) {
        if (days[i]) wkSum += days[i].count;
      }
      
      const target = 10;
      const percent = Math.min(Math.round((wkSum / target) * 100), 100);
      
      const item = document.createElement('div');
      item.className = 'weekly-progress-item';
      item.innerHTML = `
        <div class="weekly-meta">
          <span class="weekly-name">${wk.name}</span>
          <span class="weekly-percent">${wkSum}/${target} (${percent}%)</span>
        </div>
        <div class="mini-bar-track">
          <div class="mini-bar-fill" style="width: ${percent}%;"></div>
        </div>
      `;
      listEl.appendChild(item);
    });
  };

  // 4. Render SVG Line Chart (7-Day / 30-Day Note Activity History)
  const renderTracker = () => {
    const activitySvg = document.getElementById('activity-svg');
    const countDays = activeChartView === 'weekly' ? 7 : 30;
    
    // 1. Generate past N days labels and date references
    const days = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    for (let i = countDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toLocaleDateString(),
        dayLabel: dayNames[d.getDay()],
        shortLabel: d.getDate() + ' ' + d.toLocaleDateString('id-ID', { month: 'short' }),
        count: 0
      });
    }

    // 2. Count completed notes matching each date
    state.completedNotes.forEach(note => {
      const day = days.find(d => d.dateStr === note.date);
      if (day) {
        day.count++;
      }
    });

    const totalNotes = days.reduce((sum, d) => sum + d.count, 0);
    document.getElementById('tracking-overall-score').innerText = `${totalNotes} Catatan Selesai`;

    // 3. Compute SVG coordinates
    const counts = days.map(d => d.count);
    let maxCount = Math.max(...counts);
    if (maxCount === 0) maxCount = 5; // Scaling default
    
    const xPadding = 25;
    const yPadding = 25;
    const chartW = 300;
    const chartH = 150;
    
    const points = days.map((day, idx) => {
      const x = xPadding + idx * ((chartW - 2 * xPadding) / (countDays - 1));
      const y = (chartH - yPadding) - (day.count / maxCount) * (chartH - 2 * yPadding);
      return { x, y, day };
    });

    // 4. Clear SVG contents (except defs)
    const elementsToRemove = activitySvg.querySelectorAll(':not(defs)');
    elementsToRemove.forEach(el => el.remove());

    // 5. Draw SVG linear gradient definition if missing
    let defs = activitySvg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      activitySvg.appendChild(defs);
    }
    defs.innerHTML = `
      <linearGradient id="chart-fill-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#78AFFF" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#78AFFF" stop-opacity="0.0"/>
      </linearGradient>
    `;

    // 6. Draw Grid lines (Top, middle, base)
    const gridY = [yPadding, yPadding + (chartH - 2 * yPadding) / 2, chartH - yPadding];
    const gridVal = [maxCount, Math.round(maxCount / 2), 0];
    
    gridY.forEach((y, idx) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', xPadding);
      line.setAttribute('y1', y);
      line.setAttribute('x2', chartW - xPadding);
      line.setAttribute('y2', y);
      line.setAttribute('class', 'chart-grid-line');
      activitySvg.appendChild(line);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', xPadding - 5);
      text.setAttribute('y', y + 3);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('class', 'chart-grid-text');
      text.textContent = gridVal[idx];
      activitySvg.appendChild(text);
    });

    // 7. Draw Area gradient fill
    let dFill = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      dFill += ` L ${points[i].x} ${points[i].y}`;
    }
    const dStroke = dFill;
    dFill += ` L ${points[points.length - 1].x} ${chartH - yPadding} L ${points[0].x} ${chartH - yPadding} Z`;

    const pathFill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathFill.setAttribute('d', dFill);
    pathFill.setAttribute('class', 'chart-line-fill');
    activitySvg.appendChild(pathFill);

    // 8. Draw Line stroke path
    const pathStroke = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathStroke.setAttribute('d', dStroke);
    pathStroke.setAttribute('class', 'chart-line-stroke');
    activitySvg.appendChild(pathStroke);

    // 9. Draw Point Dots
    const dotRadius = activeChartView === 'weekly' ? 4.5 : 2;
    points.forEach((pt, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', dotRadius);
      circle.setAttribute('class', 'chart-point-dot');

      // Tooltip triggers
      circle.addEventListener('mouseenter', (e) => {
        showChartTooltip(e, pt.day.shortLabel, pt.day.count);
      });
      circle.addEventListener('mousemove', (e) => {
        moveChartTooltip(e);
      });
      circle.addEventListener('mouseleave', () => {
        hideChartTooltip();
      });
      circle.addEventListener('touchstart', (e) => {
        showChartTooltip(e.touches[0], pt.day.shortLabel, pt.day.count);
      }, { passive: true });

      activitySvg.appendChild(circle);
    });

    // 10. Draw X-axis day labels
    points.forEach((pt, idx) => {
      let showLabel = false;
      if (activeChartView === 'weekly') {
        showLabel = true;
      } else {
        if (idx === 0 || idx === 10 || idx === 20 || idx === 29) {
          showLabel = true;
        }
      }

      if (showLabel) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', pt.x);
        text.setAttribute('y', chartH - 8);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'chart-label-text');
        text.textContent = activeChartView === 'weekly' ? pt.day.dayLabel : pt.day.shortLabel.split(' ')[0];
        activitySvg.appendChild(text);
      }
    });

    // 11. Render Weekly breakdown card if monthly chart
    if (activeChartView === 'monthly') {
      renderWeeklyBreakdown(days);
    }
  };

  // ==================== APP FUNCTIONS ====================

  // Note Action: Check off note (Archive it)
  const completeNote = (id, type) => {
    const list = type === 'mental' ? state.mentalNotes : state.physicalNotes;
    const index = list.findIndex(n => n.id === id);
    if (index !== -1) {
      const note = list.splice(index, 1)[0];
      
      // Add to completed list
      state.completedNotes.unshift({
        id: note.id,
        type: type === 'mental' ? 'brain' : 'sport',
        title: note.title,
        body: note.body,
        date: new Date().toLocaleDateString()
      });
      
      saveState();
      renderHomeNotes();
      renderCompletedNotes();
    }
  };

  // Note Action: Delete note entirely
  const deleteNote = (id, type) => {
    const list = type === 'mental' ? state.mentalNotes : state.physicalNotes;
    const index = list.findIndex(n => n.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      saveState();
      renderHomeNotes();
    }
  };

  // Water Tracker Quick Add Listeners
  btnAdd250.addEventListener('click', () => {
    state.water.current = Math.min(state.water.current + 250, 5000);
    saveState();
    renderWater();
    triggerShimmer(document.querySelector('.water-summary-card'));
  });

  btnAdd600.addEventListener('click', () => {
    state.water.current = Math.min(state.water.current + 600, 5000);
    saveState();
    renderWater();
    triggerShimmer(document.querySelector('.water-summary-card'));
  });

  btnResetWater.addEventListener('click', () => {
    state.water.current = 0;
    saveState();
    renderWater();
  });

  // Chart Timeframe Switchers Toggle Listeners
  btnToggleWeekly.addEventListener('click', () => {
    activeChartView = 'weekly';
    btnToggleWeekly.classList.add('active');
    btnToggleMonthly.classList.remove('active');
    document.getElementById('weekly-distribution-section').style.display = 'none';
    renderTracker();
  });

  btnToggleMonthly.addEventListener('click', () => {
    activeChartView = 'monthly';
    btnToggleMonthly.classList.add('active');
    btnToggleWeekly.classList.remove('active');
    document.getElementById('weekly-distribution-section').style.display = 'block';
    renderTracker();
  });

  // ==================== GESTURE & NAVIGATION NAVIGATION ====================

  // Switch views (Main view vs Sub-pages)
  const navigateToSubPage = (pageIndex) => {
    // Set active page title
    const titles = ["Hidrasi Air", "Activity Tracking", "Completed Notes"];
    subPageTitle.innerText = titles[pageIndex];

    // Remove active styles from all tabs, add to selected tab
    Object.values(tabButtons).forEach(btn => btn.classList.remove('active'));
    if (pageIndex === 0) tabButtons.water.classList.add('active');
    if (pageIndex === 1) tabButtons.tracker.classList.add('active');
    if (pageIndex === 2) tabButtons.completed.classList.add('active');

    // Slide page scroller to correct tab
    subPagesScroller.className = '';
    subPagesScroller.classList.add(`page-${pageIndex}`);

    // Slide Sub-page view in from right
    subPagesView.classList.add('active');
    mainHomeView.classList.remove('active');
  };

  const navigateBackToHome = () => {
    subPagesView.classList.remove('active');
    mainHomeView.classList.add('active');
    Object.values(tabButtons).forEach(btn => btn.classList.remove('active'));
  };

  // Set event listeners for Bottom Tab buttons
  tabButtons.water.addEventListener('click', () => navigateToSubPage(0));
  tabButtons.tracker.addEventListener('click', () => navigateToSubPage(1));
  tabButtons.completed.addEventListener('click', () => navigateToSubPage(2));

  // Back Button arrow click trigger
  document.getElementById('btn-back-to-home').addEventListener('click', navigateBackToHome);

  // Archive Folder navigation tab buttons
  btnFolderMental.addEventListener('click', () => {
    currentArchiveFolder = 'mental';
    btnFolderMental.classList.add('active');
    btnFolderPhysical.classList.remove('active');
    renderCompletedNotes();
  });

  btnFolderPhysical.addEventListener('click', () => {
    currentArchiveFolder = 'physical';
    btnFolderPhysical.classList.add('active');
    btnFolderMental.classList.remove('active');
    renderCompletedNotes();
  });



  // ==================== SUB-PAGES SWIPE BACK GESTURES ====================
  let subTouchStartX = 0;
  let subTouchStartY = 0;

  subPagesView.addEventListener('touchstart', (e) => {
    subTouchStartX = e.touches[0].clientX;
    subTouchStartY = e.touches[0].clientY;
  }, { passive: true });

  subPagesView.addEventListener('touchend', (e) => {
    const diffX = e.changedTouches[0].clientX - subTouchStartX;
    const diffY = e.changedTouches[0].clientY - subTouchStartY;

    // Swipe right (left to right) -> Go back to home
    if (diffX > 80 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      navigateBackToHome();
    }
  }, { passive: true });

  // Support Mouse swipe back on sub-pages
  let subMouseStartX = 0;
  let subMouseStartY = 0;
  let isSubMouseDown = false;

  subPagesView.addEventListener('mousedown', (e) => {
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'button' || tag === 'textarea' || e.target.closest('button')) {
      return;
    }
    subMouseStartX = e.clientX;
    subMouseStartY = e.clientY;
    isSubMouseDown = true;
  });

  subPagesView.addEventListener('mouseup', (e) => {
    if (!isSubMouseDown) return;
    isSubMouseDown = false;
    const diffX = e.clientX - subMouseStartX;
    const diffY = e.clientY - subMouseStartY;

    if (diffX > 80 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      navigateBackToHome();
    }
  });

  // ==================== MODAL DIALOG NOTE CREATION ====================
  const openNoteModal = () => {
    // Default choice is mental (Olah Otak)
    state.currentNoteType = 'mental';
    btnSelectMental.classList.add('active');
    btnSelectPhysical.classList.remove('active');
    modalTitle.innerText = 'Catatan Baru';
    noteInputTitle.value = '';
    noteInputBody.value = '';
    noteModal.showModal();
  };

  const closeNoteModal = () => {
    noteModal.close();
  };

  // Category Selector toggle actions inside Modal
  btnSelectMental.addEventListener('click', () => {
    state.currentNoteType = 'mental';
    btnSelectMental.classList.add('active');
    btnSelectPhysical.classList.remove('active');
  });

  btnSelectPhysical.addEventListener('click', () => {
    state.currentNoteType = 'physical';
    btnSelectPhysical.classList.add('active');
    btnSelectMental.classList.remove('active');
  });

  document.getElementById('btn-modal-cancel').addEventListener('click', closeNoteModal);

  document.getElementById('btn-modal-save').addEventListener('click', () => {
    const title = noteInputTitle.value.trim();
    const body = noteInputBody.value.trim();

    if (!title || !body) {
      alert('Mohon isi judul dan deskripsi catatan.');
      return;
    }

    const newNote = {
      id: 'note-' + Date.now(),
      title: title,
      body: body,
      date: new Date().toLocaleDateString()
    };

    if (state.currentNoteType === 'mental') {
      state.mentalNotes.push(newNote);
    } else {
      state.physicalNotes.push(newNote);
    }

    saveState();
    renderHomeNotes();
    closeNoteModal();
  });

  // ==================== MICRO-INTERACTION GLOW/SCALE ====================

  // Helper to add micro scaling on tap/click (interactive class)
  function setupInteractiveScale(element) {
    element.classList.add('interactive');
    element.addEventListener('mousedown', () => {
      element.style.transform = 'scale(0.95)';
    });
    element.addEventListener('mouseup', () => {
      element.style.transform = '';
    });
    element.addEventListener('mouseleave', () => {
      element.style.transform = '';
    });
  }

  // Trigger a shimming light overlay effect on an element
  const triggerShimmer = (element) => {
    element.classList.add('shimmer-active');
    setTimeout(() => {
      element.classList.remove('shimmer-active');
    }, 1200);
  };

  // Apply interactive listeners to existing items
  document.querySelectorAll('.interactive').forEach(setupInteractiveScale);

  // Animate the Deadpool divider on double click or tap just for fun
  // ==================== WORKSPACE SPLIT DIVIDER DRAG & TAP LOGIC ====================
  const centerDivider = document.getElementById('center-divider');
  const deadpoolBadge = document.getElementById('deadpool-badge');
  const mentalWorkspace = document.getElementById('mental-workspace');
  const physicalWorkspace = document.getElementById('physical-workspace');
  
  let isDraggingDivider = false;
  let dragStartX = 0;
  let dragStartPercent = 50;
  let dragStartTime = 0;
  let maxDragDistance = 0;

  const startDividerDrag = (clientX) => {
    isDraggingDivider = true;
    dragStartX = clientX;
    dragStartTime = Date.now();
    maxDragDistance = 0;

    // Get current percent from CSS custom property, default to 50
    const currentPercentStr = splitWorkspaces.style.getPropertyValue('--split-percent') || '50';
    dragStartPercent = parseFloat(currentPercentStr) || 50;

    splitWorkspaces.classList.add('dragging-active');

    // Instantly remove classes to allow workspaces to follow dragging pointer coordinates smoothly
    mentalWorkspace.classList.remove('expanded', 'collapsed');
    physicalWorkspace.classList.remove('expanded', 'collapsed');
  };

  const moveDividerDrag = (clientX) => {
    if (!isDraggingDivider) return;
    
    const deltaX = clientX - dragStartX;
    maxDragDistance = Math.max(maxDragDistance, Math.abs(deltaX));

    const containerWidth = splitWorkspaces.getBoundingClientRect().width;

    // Safety check: if the user drags to the very edges, auto-end the drag to prevent stuck states
    if (clientX <= 5 || clientX >= containerWidth - 5) {
      const edgePercent = clientX <= 5 ? 0 : 100;
      splitWorkspaces.style.setProperty('--split-percent', edgePercent);
      
      // End drag and apply snapped layout states directly
      isDraggingDivider = false;
      splitWorkspaces.classList.remove('dragging-active');
      
      if (edgePercent === 0) {
        physicalWorkspace.classList.add('expanded');
        physicalWorkspace.classList.remove('collapsed');
        mentalWorkspace.classList.add('collapsed');
        mentalWorkspace.classList.remove('expanded');
      } else {
        mentalWorkspace.classList.add('expanded');
        mentalWorkspace.classList.remove('collapsed');
        physicalWorkspace.classList.add('collapsed');
        physicalWorkspace.classList.remove('expanded');
      }
      return;
    }

    const deltaPercent = (deltaX / containerWidth) * 100;
    let newPercent = dragStartPercent + deltaPercent;
    
    // Constrain percent between 0% and 100% for the half-icon edge format
    newPercent = Math.max(0, Math.min(newPercent, 100));

    // Update CSS custom property in real-time
    splitWorkspaces.style.setProperty('--split-percent', newPercent);
  };

  const endDividerDrag = () => {
    if (!isDraggingDivider) return;
    isDraggingDivider = false;
    splitWorkspaces.classList.remove('dragging-active');

    // Get final percent to calculate snap positions
    const currentPercentStr = splitWorkspaces.style.getPropertyValue('--split-percent') || '50';
    let finalPercent = parseFloat(currentPercentStr) || 50;

    // Check if it was a quick tap/click instead of a drag
    const duration = Date.now() - dragStartTime;
    if (maxDragDistance < 6 && duration < 250) {
      // It's a click! Trigger shimmer and open note modal
      triggerShimmer(deadpoolBadge);
      
      // Flash workspaces visual feedback
      mentalWorkspace.style.backgroundColor = 'rgba(10, 25, 47, 0.6)';
      physicalWorkspace.style.backgroundColor = 'rgba(226, 241, 255, 0.4)';
      setTimeout(() => {
        mentalWorkspace.style.backgroundColor = '';
        physicalWorkspace.style.backgroundColor = '';
      }, 400);

      setTimeout(() => {
        openNoteModal();
      }, 150);
      return;
    }

    // Calculate net drag distance and direction to support velocity/intent based snapping
    const dragDistance = finalPercent - dragStartPercent;

    // Snapping Logic
    // Case A: Drag started from the center (50%)
    if (dragStartPercent === 50) {
      if (dragDistance < -10) {
        finalPercent = 0; // Swipe left -> snap to Olahraga full
      } else if (dragDistance > 10) {
        finalPercent = 100; // Swipe right -> snap to Olah Otak full
      } else {
        finalPercent = 50; // Micro-drag -> stay at center
      }
    }
    // Case B: Drag started from the left edge (0% - Olahraga full)
    else if (dragStartPercent === 0) {
      if (dragDistance > 15) {
        finalPercent = 50; // Drag right significantly -> return to center
      } else {
        finalPercent = 0; // Micro-drag or return -> stay at left edge
      }
    }
    // Case C: Drag started from the right edge (100% - Olah Otak full)
    else if (dragStartPercent === 100) {
      if (dragDistance < -15) {
        finalPercent = 50; // Drag left significantly -> return to center
      } else {
        finalPercent = 100; // Micro-drag or return -> stay at right edge
      }
    }
    // Case D: Fallback safety snapping based on final position
    else {
      if (finalPercent < 35) {
        finalPercent = 0;
      } else if (finalPercent > 65) {
        finalPercent = 100;
      } else {
        finalPercent = 50;
      }
    }

    // Apply classes based on snapped position
    if (finalPercent === 50) {
      mentalWorkspace.classList.remove('expanded', 'collapsed');
      physicalWorkspace.classList.remove('expanded', 'collapsed');
    } else if (finalPercent === 0) {
      physicalWorkspace.classList.add('expanded');
      physicalWorkspace.classList.remove('collapsed');
      mentalWorkspace.classList.add('collapsed');
      mentalWorkspace.classList.remove('expanded');
    } else if (finalPercent === 100) {
      mentalWorkspace.classList.add('expanded');
      mentalWorkspace.classList.remove('collapsed');
      physicalWorkspace.classList.add('collapsed');
      physicalWorkspace.classList.remove('expanded');
    }

    // Apply snap percent
    splitWorkspaces.style.setProperty('--split-percent', finalPercent);
  };

  // Bind Mouse events on center-divider (including Deadpool badge)
  centerDivider.addEventListener('mousedown', (e) => {
    startDividerDrag(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingDivider) {
      // If primary mouse button was released outside the window, end the drag
      if (e.buttons === 0) {
        endDividerDrag();
        return;
      }
      moveDividerDrag(e.clientX);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingDivider) {
      endDividerDrag();
    }
  });

  // Bind Touch events on center-divider (including Deadpool badge)
  centerDivider.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Lock browser native gestures instantly
    startDividerDrag(e.touches[0].clientX);
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (isDraggingDivider) {
      if (!e.touches || e.touches.length === 0) {
        endDividerDrag();
        return;
      }
      e.preventDefault(); // Lock browser swipe-back and scroll bounces
      moveDividerDrag(e.touches[0].clientX);
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    if (isDraggingDivider) {
      endDividerDrag();
    }
  });

  window.addEventListener('touchcancel', () => {
    if (isDraggingDivider) {
      endDividerDrag();
    }
  });

  // If a new touch starts on the screen but not on the divider, immediately end any stuck drag
  window.addEventListener('touchstart', (e) => {
    if (isDraggingDivider && !e.target.closest('#center-divider')) {
      endDividerDrag();
    }
  }, { passive: true });

  // Extra safety handlers to release stuck drag states
  window.addEventListener('blur', () => {
    if (isDraggingDivider) {
      endDividerDrag();
    }
  });

  document.addEventListener('mouseleave', () => {
    if (isDraggingDivider) {
      endDividerDrag();
    }
  });

  // ==================== UTILITY FUNCTIONS ====================

  // Escape HTML to prevent XSS injection
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Format currencies / numbers with thousands separator
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // ==================== INITIAL STARTUP RENDERING ====================
  renderHomeNotes();
  renderCompletedNotes();
  renderWater();
  renderTracker();

});
