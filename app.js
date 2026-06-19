/* ==========================================================================
   DUALSPHERE NOTES - APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Force a complete wipe of all legacy/mock data once for v3 release
  if (localStorage.getItem('ds_wiped_v3') !== 'true') {
    localStorage.clear();
    localStorage.setItem('ds_wiped_v3', 'true');
  }

  // Helper to get date string offset by N days
  const getDateOffsetString = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() - daysOffset);
    return d.toLocaleDateString();
  };

  // ==================== WEB AUDIO API SOUND SYNTHESIZER ====================
  let audioCtx = null;

  const playMicroSound = (type) => {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } 
      else if (type === 'bubble') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.15);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } 
      else if (type === 'complete') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.25);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);

        const osc2 = audioCtx.createOscillator();
        const gainNode2 = audioCtx.createGain();
        osc2.connect(gainNode2);
        gainNode2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.05);
        gainNode2.gain.setValueAtTime(0.08, now + 0.05);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.3);
      }
    } catch (err) {
      console.warn('AudioContext blocked or unsupported:', err);
    }
  };

  // ==================== THEME MANAGEMENT ====================
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIconSvg = document.getElementById('theme-icon-svg');
  
  const moonIcon = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
  const sunIcon = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="18.36" x2="5.64" y2="19.78"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line>`;

  const applyTheme = (theme) => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      themeIconSvg.innerHTML = sunIcon;
    } else {
      document.body.classList.remove('light-theme');
      themeIconSvg.innerHTML = moonIcon;
    }
  };

  let currentTheme = localStorage.getItem('ds_theme') || 'dark';
  applyTheme(currentTheme);

  btnThemeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('ds_theme', currentTheme);
    applyTheme(currentTheme);
    playMicroSound('click');
  });

  // ==================== STATE MANAGEMENT ====================
  let state = {
    mentalNotes: JSON.parse(localStorage.getItem('ds_mental_notes')) || [],
    physicalNotes: JSON.parse(localStorage.getItem('ds_physical_notes')) || [],
    completedNotes: JSON.parse(localStorage.getItem('ds_completed_notes')) || [],
    water: JSON.parse(localStorage.getItem('ds_water')) || {
      current: 0,
      target: 2000,
      customPreset: 500
    },
    waterHistory: JSON.parse(localStorage.getItem('ds_water_history')) || {},
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
    localStorage.setItem('ds_water_history', JSON.stringify(state.waterHistory));
    updateAppBadge();
  };

  // Helper to update PWA home screen app badge
  const updateAppBadge = () => {
    if ('setAppBadge' in navigator) {
      const count = state.mentalNotes.length + state.physicalNotes.length;
      if (count > 0) {
        navigator.setAppBadge(count).catch(err => console.warn('App Badging failed:', err));
      } else {
        navigator.clearAppBadge().catch(err => console.warn('App Badging failed:', err));
      }
    }
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
  const btnAddCustom = document.getElementById('btn-add-custom');
  const btnEditWaterTarget = document.getElementById('btn-edit-water-target');
  const btnResetWater = document.getElementById('btn-reset-water');

  // Chart Toggle Switchers
  const btnToggleWeekly = document.getElementById('btn-toggle-weekly');
  const btnToggleMonthly = document.getElementById('btn-toggle-monthly');

  // ==================== RENDERING LOGIC ====================

  // ==================== RENDERING LOGIC ====================

  const swapNotesInState = (type, idx1, idx2) => {
    const list = type === 'mental' ? state.mentalNotes : state.physicalNotes;
    if (idx1 >= 0 && idx1 < list.length && idx2 >= 0 && idx2 < list.length) {
      const temp = list[idx1];
      list[idx1] = list[idx2];
      list[idx2] = temp;
    }
  };

  const togglePinNote = (id, type) => {
    const list = type === 'mental' ? state.mentalNotes : state.physicalNotes;
    const note = list.find(n => n.id === id);
    if (note) {
      note.pinned = !note.pinned;
      saveState();
      renderHomeNotes();
      playMicroSound('click');
    }
  };

  // 1. Render Left & Right Home Workspace Notes
  const renderHomeNotes = () => {
    const searchMental = (document.getElementById('search-mental')?.value || '').toLowerCase().trim();
    const searchPhysical = (document.getElementById('search-physical')?.value || '').toLowerCase().trim();

    // Render Mental Notes
    mentalNotesList.innerHTML = '';
    let filteredMental = state.mentalNotes.filter(note => 
      note.title.toLowerCase().includes(searchMental) || 
      note.body.toLowerCase().includes(searchMental) ||
      (note.tag && note.tag.toLowerCase().includes(searchMental))
    );
    // Sort pinned to top
    filteredMental.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    if (filteredMental.length === 0) {
      mentalNotesList.innerHTML = `<div class="empty-state-text">Catatan otak kosong. Buat ide baru!</div>`;
    } else {
      filteredMental.forEach(note => {
        const card = createNoteCard(note, 'mental');
        mentalNotesList.appendChild(card);
      });
    }

    // Render Physical Notes
    physicalNotesList.innerHTML = '';
    let filteredPhysical = state.physicalNotes.filter(note => 
      note.title.toLowerCase().includes(searchPhysical) || 
      note.body.toLowerCase().includes(searchPhysical) ||
      (note.tag && note.tag.toLowerCase().includes(searchPhysical))
    );
    // Sort pinned to top
    filteredPhysical.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    if (filteredPhysical.length === 0) {
      physicalNotesList.innerHTML = `<div class="empty-state-text">Catatan latihan kosong. Catat perkembangan olahraga Anda!</div>`;
    } else {
      filteredPhysical.forEach(note => {
        const card = createNoteCard(note, 'physical');
        physicalNotesList.appendChild(card);
      });
    }
  };

  // Helper to create a single Note HTML Element
  const createNoteCard = (note, type) => {
    const card = document.createElement('div');
    card.className = 'note-item-card';
    if (note.pinned) {
      card.classList.add('pinned');
    }
    card.setAttribute('data-id', note.id);
    
    card.innerHTML = `
      <div class="note-card-content" style="cursor: pointer; width: 100%;">
        <div class="note-title">${escapeHTML(note.title)}</div>
        <div class="note-body">${escapeHTML(note.body)}</div>
        ${note.tag ? `<div class="note-tag-badge">${escapeHTML(note.tag)}</div>` : ''}
      </div>
      <div class="note-actions">
        <button class="btn-card-action btn-pin ${note.pinned ? 'active' : ''} interactive" aria-label="Sematkan Catatan">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v3.26a2 2 0 0 1-.78 1.24l-2.78 3.5a2 2 0 0 0-.44 1.24Z"></path>
          </svg>
        </button>
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

    // Pin Action Button
    card.querySelector('.btn-pin').addEventListener('click', (e) => {
      e.stopPropagation();
      togglePinNote(note.id, type);
    });

    // Edit note modal trigger on clicking note content
    card.querySelector('.note-card-content').addEventListener('click', (e) => {
      editNote(note, type);
    });

    // Drag and Drop (Pointer Events) for vertical sorting
    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let initialIndex = -1;
    let siblings = [];
    let listContainer = type === 'mental' ? mentalNotesList : physicalNotesList;

    card.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.btn-card-action')) return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      isDragging = true;
      startY = e.clientY;
      card.classList.add('dragging');
      card.setPointerCapture(e.pointerId);

      const notes = type === 'mental' ? state.mentalNotes : state.physicalNotes;
      initialIndex = notes.findIndex(n => n.id === note.id);

      siblings = [...listContainer.querySelectorAll('.note-item-card:not(.dragging)')];
      playMicroSound('click');
    });

    card.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      currentY = e.clientY;
      const deltaY = currentY - startY;
      card.style.transform = `translateY(${deltaY}px) scale(0.98)`;

      const cardRect = card.getBoundingClientRect();
      const cardCenterY = cardRect.top + cardRect.height / 2;

      for (let i = 0; i < siblings.length; i++) {
        const sib = siblings[i];
        const sibRect = sib.getBoundingClientRect();
        const sibCenterY = sibRect.top + sibRect.height / 2;

        if (deltaY > 0 && cardCenterY > sibCenterY && card.nextElementSibling === sib) {
          listContainer.insertBefore(sib, card);
          swapNotesInState(type, initialIndex, initialIndex + 1);
          initialIndex += 1;
          siblings = [...listContainer.querySelectorAll('.note-item-card:not(.dragging)')];
          break;
        } else if (deltaY < 0 && cardCenterY < sibCenterY && card.previousElementSibling === sib) {
          listContainer.insertBefore(card, sib);
          swapNotesInState(type, initialIndex, initialIndex - 1);
          initialIndex -= 1;
          siblings = [...listContainer.querySelectorAll('.note-item-card:not(.dragging)')];
          break;
        }
      }
    });

    card.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      card.classList.remove('dragging');
      card.style.transform = '';
      card.releasePointerCapture(e.pointerId);

      saveState();
      renderHomeNotes();
      playMicroSound('click');
    });

    card.addEventListener('pointercancel', (e) => {
      if (!isDragging) return;
      isDragging = false;
      card.classList.remove('dragging');
      card.style.transform = '';
      card.releasePointerCapture(e.pointerId);
      renderHomeNotes();
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
    if (!state.water.customPreset) {
      state.water.customPreset = 500;
    }

    waterProgressText.innerText = `${state.water.current} / ${state.water.target} ml`;
    document.getElementById('btn-add-custom-text').innerText = `+ ${state.water.customPreset} ml`;
    
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

    // Draw historical line chart for water
    renderWaterHistoryChart();
  };

  const renderWaterHistoryChart = () => {
    const svg = document.getElementById('water-history-svg');
    if (!svg) return;

    // 1. Generate past 7 days references
    const days = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString();
      let currentIntake = 0;
      if (i === 0) {
        currentIntake = state.water.current;
      } else {
        currentIntake = state.waterHistory[dateStr] || 0;
      }

      days.push({
        dateStr,
        dayLabel: dayNames[d.getDay()],
        shortLabel: d.getDate() + '/' + (d.getMonth() + 1),
        count: currentIntake
      });
    }

    // 2. Compute SVG math
    const intakes = days.map(d => d.count);
    let maxVal = Math.max(...intakes, state.water.target);
    if (maxVal === 0) maxVal = 2000;

    const xPadding = 25;
    const yPadding = 20;
    const chartW = 300;
    const chartH = 120;

    const points = days.map((day, idx) => {
      const x = xPadding + idx * ((chartW - 2 * xPadding) / 6);
      const y = (chartH - yPadding) - (day.count / maxVal) * (chartH - 2 * yPadding);
      return { x, y, day };
    });

    // 3. Clear SVG contents
    const els = svg.querySelectorAll(':not(defs)');
    els.forEach(el => el.remove());

    // 4. Draw horizontal target line (as a dashed line)
    const targetY = (chartH - yPadding) - (state.water.target / maxVal) * (chartH - 2 * yPadding);
    const targetLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    targetLine.setAttribute('x1', xPadding);
    targetLine.setAttribute('y1', targetY);
    targetLine.setAttribute('x2', chartW - xPadding);
    targetLine.setAttribute('y2', targetY);
    targetLine.setAttribute('stroke', 'rgba(120, 175, 255, 0.4)');
    targetLine.setAttribute('stroke-width', '1.5');
    targetLine.setAttribute('stroke-dasharray', '4,4');
    svg.appendChild(targetLine);

    // Target label
    const targetText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    targetText.setAttribute('x', chartW - xPadding);
    targetText.setAttribute('y', targetY - 4);
    targetText.setAttribute('text-anchor', 'end');
    targetText.setAttribute('fill', 'rgba(120, 175, 255, 0.6)');
    targetText.setAttribute('font-size', '7px');
    targetText.setAttribute('font-weight', 'bold');
    targetText.textContent = `Target: ${state.water.target} ml`;
    svg.appendChild(targetText);

    // 5. Draw path line stroke
    let dStroke = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      dStroke += ` L ${points[i].x} ${points[i].y}`;
    }
    
    // Gradient area path
    let dFill = dStroke + ` L ${points[points.length - 1].x} ${chartH - yPadding} L ${points[0].x} ${chartH - yPadding} Z`;

    const pathFill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathFill.setAttribute('d', dFill);
    pathFill.setAttribute('fill', 'url(#chart-fill-gradient)');
    svg.appendChild(pathFill);

    const pathStroke = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathStroke.setAttribute('d', dStroke);
    pathStroke.setAttribute('stroke', '#78AFFF');
    pathStroke.setAttribute('stroke-width', '2.5');
    pathStroke.setAttribute('fill', 'none');
    pathStroke.setAttribute('stroke-linecap', 'round');
    pathStroke.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(pathStroke);

    // 6. Draw dots & X labels
    points.forEach((pt, idx) => {
      // Circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', '#ffffff');
      circle.setAttribute('stroke', '#5C9CFF');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('cursor', 'pointer');
      
      circle.addEventListener('mouseenter', (e) => {
        showChartTooltip(e, pt.day.shortLabel, `${pt.day.count} ml`);
      });
      circle.addEventListener('mousemove', (e) => {
        moveChartTooltip(e);
      });
      circle.addEventListener('mouseleave', () => {
        hideChartTooltip();
      });

      svg.appendChild(circle);

      // Label X
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pt.x);
      text.setAttribute('y', chartH - 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'rgba(255, 255, 255, 0.45)');
      text.setAttribute('font-size', '8px');
      text.setAttribute('font-family', 'var(--font-title)');
      text.setAttribute('font-weight', '600');
      text.textContent = pt.day.dayLabel;
      svg.appendChild(text);
    });
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

  // ==================== ANALYTICS & GAMIFICATION PIPELINE ====================
  const updateAnalytics = () => {
    // 1. Calculate Balance Ratio
    const completed = state.completedNotes;
    const brainCount = completed.filter(n => n.type === 'brain').length;
    const sportCount = completed.filter(n => n.type === 'sport').length;
    const totalCount = brainCount + sportCount;

    let balanceRatio = 50; 
    let balanceTitle = "Seimbang";
    let balanceDesc = "Buat catatan olah otak & olahraga harian Anda.";

    if (totalCount > 0) {
      balanceRatio = Math.round((brainCount / totalCount) * 100);
      
      if (balanceRatio > 55) {
        balanceTitle = "Olah Otak Dominan";
        balanceDesc = `Olah Otak ${balanceRatio}% vs Olahraga ${100 - balanceRatio}%. Perbanyak latihan fisik!`;
      } else if (balanceRatio < 45) {
        balanceTitle = "Olahraga Dominan";
        balanceDesc = `Olahraga ${100 - balanceRatio}% vs Olah Otak ${balanceRatio}%. Ayo asah kreativitas otak Anda!`;
      } else {
        balanceTitle = "Keseimbangan Sempurna";
        balanceDesc = "Hebat! Porsi latihan mental dan fisik Anda seimbang 50/50.";
      }
    }

    const fillEl = document.getElementById('balance-circle-fill');
    const percentEl = document.getElementById('balance-percent-text');
    const titleEl = document.getElementById('balance-title-text');
    const descEl = document.getElementById('balance-desc-text');
    if (fillEl) {
      fillEl.setAttribute('stroke-dasharray', `${balanceRatio}, 100`);
      if (balanceRatio >= 45 && balanceRatio <= 55) {
        fillEl.setAttribute('stroke', '#82C99B'); 
      } else {
        fillEl.setAttribute('stroke', '#007AFF'); 
      }
    }
    if (percentEl) percentEl.innerText = `${balanceRatio}%`;
    if (titleEl) titleEl.innerText = balanceTitle;
    if (descEl) descEl.innerText = balanceDesc;

    // 2. Calculate Daily Streak
    let currentStreak = 0;
    
    const isDayActive = (date) => {
      const dateStr = date.toLocaleDateString();
      let waterMet = false;
      if (dateStr === new Date().toLocaleDateString()) {
        waterMet = state.water.current >= state.water.target;
      } else {
        waterMet = (state.waterHistory[dateStr] || 0) >= state.water.target;
      }
      const noteMet = state.completedNotes.some(n => n.date === dateStr);
      return waterMet && noteMet;
    };

    let checkDate = new Date();
    const todayActive = isDayActive(checkDate);
    if (todayActive) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
      while (isDayActive(checkDate)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      if (isDayActive(checkDate)) {
        currentStreak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
        while (isDayActive(checkDate)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }

    const bestStreak = Math.max(currentStreak, parseInt(localStorage.getItem('ds_best_streak') || '0'));
    localStorage.setItem('ds_best_streak', bestStreak.toString());

    const streakEl = document.getElementById('streak-score-text');
    if (streakEl) {
      streakEl.innerText = `${currentStreak} Hari Beruntun (Rekor: ${bestStreak})`;
    }

    // 3. Unlock Badges/Achievements
    const badges = {
      hydration: currentStreak >= 3,
      thinker: brainCount >= 5,
      beast: sportCount >= 5,
      balance: totalCount >= 4 && balanceRatio >= 45 && balanceRatio <= 55
    };

    Object.keys(badges).forEach(key => {
      const el = document.getElementById(`badge-${key}`);
      if (el) {
        if (badges[key]) {
          el.classList.remove('locked');
          el.classList.add('unlocked');
          el.querySelector('.badge-icon').style.filter = 'none';
          el.querySelector('.badge-icon').style.opacity = '1';
        } else {
          el.classList.remove('unlocked');
          el.classList.add('locked');
          el.querySelector('.badge-icon').style.filter = 'grayscale(1)';
          el.querySelector('.badge-icon').style.opacity = '0.4';
        }
      }
    });

    // 4. Calculate Weekly Stats Details
    let waterSum = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString();
      if (i === 0) {
        waterSum += state.water.current;
      } else {
        waterSum += state.waterHistory[dateStr] || 0;
      }
    }
    const avgWater = Math.round(waterSum / 7);

    const dayCounts = { 'Min': 0, 'Sen': 0, 'Sel': 0, 'Rab': 0, 'Kam': 0, 'Jum': 0, 'Sab': 0 };
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    state.completedNotes.forEach(note => {
      // Safely parse date and increment day counts
      const parts = note.date.split('/');
      let d = new Date(note.date);
      if (parts.length === 3) {
        // Handle format d/m/y correctly if construction fails
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        d = new Date(year, month, day);
      }
      if (!isNaN(d.getTime())) {
        const dayLabel = dayNames[d.getDay()];
        dayCounts[dayLabel] = (dayCounts[dayLabel] || 0) + 1;
      }
    });
    let activeDay = "Min";
    let maxDayCount = -1;
    Object.keys(dayCounts).forEach(day => {
      if (dayCounts[day] > maxDayCount) {
        maxDayCount = dayCounts[day];
        activeDay = day;
      }
    });

    let dominantType = "Seimbang";
    if (brainCount > sportCount) {
      dominantType = "Olah Otak 🧠";
    } else if (sportCount > brainCount) {
      dominantType = "Olahraga 🏃";
    }

    const avgWaterEl = document.getElementById('stat-avg-water');
    const activeDayEl = document.getElementById('stat-active-day');
    const dominantTypeEl = document.getElementById('stat-dominant-type');
    if (avgWaterEl) avgWaterEl.innerText = `${avgWater} ml`;
    if (activeDayEl) activeDayEl.innerText = activeDay;
    if (dominantTypeEl) dominantTypeEl.innerText = dominantType;
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

    // Update circular gauge, streaks, achievements, and weekly stats
    updateAnalytics();
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
    playMicroSound('bubble');
  });

  btnAdd600.addEventListener('click', () => {
    state.water.current = Math.min(state.water.current + 600, 5000);
    saveState();
    renderWater();
    triggerShimmer(document.querySelector('.water-summary-card'));
    playMicroSound('bubble');
  });

  btnAddCustom.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-subtext') || e.target.innerText.includes('⚙️')) {
      const newPreset = prompt("Masukkan ukuran wadah kustom Anda (ml):", state.water.customPreset);
      const val = parseInt(newPreset);
      if (!isNaN(val) && val > 0 && val <= 2000) {
        state.water.customPreset = val;
        saveState();
        renderWater();
        playMicroSound('click');
      }
    } else {
      state.water.current = Math.min(state.water.current + state.water.customPreset, 5000);
      saveState();
      renderWater();
      triggerShimmer(document.querySelector('.water-summary-card'));
      playMicroSound('bubble');
    }
  });

  btnEditWaterTarget.addEventListener('click', () => {
    const newTarget = prompt("Masukkan target air minum harian Anda (ml):", state.water.target);
    const val = parseInt(newTarget);
    if (!isNaN(val) && val >= 1000 && val <= 5000) {
      state.water.target = val;
      saveState();
      renderWater();
      playMicroSound('click');
    }
  });

  btnResetWater.addEventListener('click', () => {
    state.water.current = 0;
    saveState();
    renderWater();
    playMicroSound('click');
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

  // ==================== BACKUP & RESTORE DATA LOGIC ====================
  const btnExportData = document.getElementById('btn-export-data');
  const btnImportData = document.getElementById('btn-import-data');
  const importFileInput = document.getElementById('import-file-input');

  const exportData = () => {
    const backupObj = {
      app: 'dualsphere-notes',
      version: 'v4',
      timestamp: Date.now(),
      theme: localStorage.getItem('ds_theme') || 'dark',
      bestStreak: parseInt(localStorage.getItem('ds_best_streak') || '0', 10),
      state: state
    };
    
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      
      const d = new Date();
      const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      downloadAnchor.setAttribute("download", `rnm_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      playMicroSound('complete');
    } catch (err) {
      console.error('Backup export failed:', err);
      alert('Gagal mengekspor file cadangan.');
    }
  };

  const importData = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (backup.app !== 'dualsphere-notes' || !backup.state) {
          alert('Format file cadangan tidak valid.');
          return;
        }
        
        // Load into State
        state.mentalNotes = backup.state.mentalNotes || [];
        state.physicalNotes = backup.state.physicalNotes || [];
        state.completedNotes = backup.state.completedNotes || [];
        state.water = backup.state.water || { current: 0, target: 2000, customPreset: 500 };
        state.waterHistory = backup.state.waterHistory || {};
        
        // Load additional configurations
        currentTheme = backup.theme || 'dark';
        localStorage.setItem('ds_theme', currentTheme);
        localStorage.setItem('ds_best_streak', (backup.bestStreak || 0).toString());
        
        saveState();
        
        // Re-render whole application state
        applyTheme(currentTheme);
        renderHomeNotes();
        renderCompletedNotes();
        renderWater();
        renderTracker();
        updateAppBadge();
        
        playMicroSound('complete');
        alert('Data berhasil dipulihkan!');
      } catch (err) {
        console.error('Error parsing JSON backup file:', err);
        alert('Gagal membaca file cadangan. Pastikan file valid.');
      }
    };
    reader.readAsText(file);
  };

  if (btnExportData && btnImportData && importFileInput) {
    btnExportData.addEventListener('click', () => {
      exportData();
    });
    
    btnImportData.addEventListener('click', () => {
      importFileInput.click();
      playMicroSound('click');
    });
    
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        importData(file);
      }
      importFileInput.value = ''; // Reset file input
    });
  }



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
  // ==================== MODAL DIALOG NOTE CREATION & EDITS ====================
  // Selected tag state
  state.selectedTag = "#jurnal"; 
  state.editingNoteId = null; 

  const tagPills = document.querySelectorAll('.btn-tag-pill');
  tagPills.forEach(pill => {
    pill.addEventListener('click', () => {
      tagPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.selectedTag = pill.getAttribute('data-tag');
      playMicroSound('click');
    });
  });

  const openNoteModal = (isEdit = false) => {
    if (!isEdit) {
      state.editingNoteId = null;
      modalTitle.innerText = 'Catatan Baru';
      noteInputTitle.value = '';
      noteInputBody.value = '';
      state.selectedTag = "#jurnal";
      tagPills.forEach(p => {
        if (p.getAttribute('data-tag') === '#jurnal') p.classList.add('active');
        else p.classList.remove('active');
      });
    }
    noteModal.showModal();
  };

  const editNote = (note, type) => {
    state.editingNoteId = note.id;
    state.currentNoteType = type;
    modalTitle.innerText = 'Edit Catatan';
    noteInputTitle.value = note.title;
    noteInputBody.value = note.body;
    
    if (type === 'mental') {
      btnSelectMental.classList.add('active');
      btnSelectPhysical.classList.remove('active');
    } else {
      btnSelectPhysical.classList.add('active');
      btnSelectMental.classList.remove('active');
    }

    state.selectedTag = note.tag || "#jurnal";
    tagPills.forEach(p => {
      if (p.getAttribute('data-tag') === state.selectedTag) p.classList.add('active');
      else p.classList.remove('active');
    });

    openNoteModal(true);
  };

  const closeNoteModal = () => {
    noteModal.close();
    playMicroSound('click');
  };

  // Category Selector toggle actions inside Modal
  btnSelectMental.addEventListener('click', () => {
    state.currentNoteType = 'mental';
    btnSelectMental.classList.add('active');
    btnSelectPhysical.classList.remove('active');
    playMicroSound('click');
  });

  btnSelectPhysical.addEventListener('click', () => {
    state.currentNoteType = 'physical';
    btnSelectPhysical.classList.add('active');
    btnSelectMental.classList.remove('active');
    playMicroSound('click');
  });

  document.getElementById('btn-modal-cancel').addEventListener('click', closeNoteModal);

  document.getElementById('btn-modal-save').addEventListener('click', () => {
    const title = noteInputTitle.value.trim();
    const body = noteInputBody.value.trim();

    if (!title || !body) {
      alert('Mohon isi judul dan deskripsi catatan.');
      return;
    }

    if (state.editingNoteId) {
      // Edit mode
      const type = state.currentNoteType;
      const list = type === 'mental' ? state.mentalNotes : state.physicalNotes;
      const note = list.find(n => n.id === state.editingNoteId);
      if (note) {
        note.title = title;
        note.body = body;
        note.tag = state.selectedTag;
      }
      state.editingNoteId = null;
      playMicroSound('complete');
    } else {
      // Create mode
      const newNote = {
        id: 'note-' + Date.now(),
        title: title,
        body: body,
        tag: state.selectedTag,
        pinned: false,
        date: new Date().toLocaleDateString()
      };

      if (state.currentNoteType === 'mental') {
        state.mentalNotes.push(newNote);
      } else {
        state.physicalNotes.push(newNote);
      }
      playMicroSound('complete');
    }

    saveState();
    renderHomeNotes();
    noteModal.close();
  });

  // Bind Search input event listeners to dynamically filter notes
  document.getElementById('search-mental').addEventListener('input', renderHomeNotes);
  document.getElementById('search-physical').addEventListener('input', renderHomeNotes);

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

  const checkWaterDayRollover = () => {
    const today = new Date().toLocaleDateString();
    const lastActiveDate = localStorage.getItem('ds_water_last_date');
    if (lastActiveDate !== today) {
      if (lastActiveDate && state.water.current > 0) {
        state.waterHistory[lastActiveDate] = state.water.current;
      }
      state.water.current = 0;
      localStorage.setItem('ds_water_last_date', today);
      saveState();
    }
  };

  // ==================== INITIAL STARTUP RENDERING ====================
  checkWaterDayRollover();
  renderHomeNotes();
  renderCompletedNotes();
  renderWater();
  renderTracker();
  updateAppBadge();

});
