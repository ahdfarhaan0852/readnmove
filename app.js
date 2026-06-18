/* ==========================================================================
   DUALSPHERE NOTES - APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==================== STATE MANAGEMENT ====================
  let state = {
    mentalNotes: JSON.parse(localStorage.getItem('ds_mental_notes')) || [
      { id: 'm1', title: 'Riset Desain Glassmorphism', body: 'Pelajari CSS backdrop-filter blur untuk tampilan antarmuka yang bersih.', date: new Date().toLocaleDateString() },
      { id: 'm2', title: 'Belajar Pemrograman Swift', body: 'Tonton video tutorial tentang modifier glassEffect dan transisi morphing.', date: new Date().toLocaleDateString() }
    ],
    physicalNotes: JSON.parse(localStorage.getItem('ds_physical_notes')) || [
      { id: 'p1', title: 'Target Lari Pagi', body: 'Lari keliling komplek sejauh 5 km dengan target waktu kurang dari 30 menit.', date: new Date().toLocaleDateString() },
      { id: 'p2', title: 'Latihan Push Up', body: '3 set x 15 reps push up untuk melatih otot dada dan lengan.', date: new Date().toLocaleDateString() }
    ],
    completedNotes: JSON.parse(localStorage.getItem('ds_completed_notes')) || [
      { id: 'c1', type: 'brain', title: 'Evaluasi Ide Bisnis', body: 'Menyusun analisis SWOT awal untuk ide aplikasi pencatatan.', date: new Date().toLocaleDateString() },
      { id: 'c2', type: 'sport', title: 'Berenang Sore', body: '400 meter latihan gaya dada untuk melatih pernapasan.', date: new Date().toLocaleDateString() }
    ],
    transactions: JSON.parse(localStorage.getItem('ds_transactions')) || [
      { id: 't1', description: 'Beli Sepatu Lari', amount: 450000, type: 'expense', date: new Date().toLocaleDateString() },
      { id: 't2', description: 'Gaji Bulanan', amount: 3500000, type: 'income', date: new Date().toLocaleDateString() },
      { id: 't3', description: 'Suplemen Protein', amount: 150000, type: 'expense', date: new Date().toLocaleDateString() }
    ],
    habits: JSON.parse(localStorage.getItem('ds_habits')) || [
      { id: 'h1', name: 'Olahraga (Menit)', current: 30, target: 60 },
      { id: 'h2', name: 'Konsumsi Air (Gelas)', current: 5, target: 8 },
      { id: 'h3', name: 'Membaca Buku (Halaman)', current: 10, target: 20 },
      { id: 'h4', name: 'Meditasi/Refleksi (Menit)', current: 5, target: 15 }
    ],
    currentNoteType: 'mental' // Tracks which workspace triggers the input modal
  };

  let currentArchiveFolder = 'mental'; // Tracks active folder in completed notes archive ('mental' or 'physical')

  // Helper to save state to LocalStorage
  const saveState = () => {
    localStorage.setItem('ds_mental_notes', JSON.stringify(state.mentalNotes));
    localStorage.setItem('ds_physical_notes', JSON.stringify(state.physicalNotes));
    localStorage.setItem('ds_completed_notes', JSON.stringify(state.completedNotes));
    localStorage.setItem('ds_transactions', JSON.stringify(state.transactions));
    localStorage.setItem('ds_habits', JSON.stringify(state.habits));
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
    budget: document.getElementById('tab-budget'),
    tracker: document.getElementById('tab-tracker'),
    completed: document.getElementById('tab-completed')
  };

  const btnFolderMental = document.getElementById('btn-folder-mental');
  const btnFolderPhysical = document.getElementById('btn-folder-physical');

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

  // 3. Render Budget Transactions & Totals
  const renderBudget = () => {
    let incomeTotal = 0;
    let expenseTotal = 0;
    
    transactionsList.innerHTML = '';
    
    // Sort transactions by newest first (reverse order)
    const sortedTx = [...state.transactions].reverse();
    
    sortedTx.forEach(tx => {
      const val = parseFloat(tx.amount);
      if (tx.type === 'income') {
        incomeTotal += val;
      } else {
        expenseTotal += val;
      }
      
      const item = document.createElement('div');
      item.className = 'transaction-item';
      
      const sign = tx.type === 'income' ? '+' : '-';
      const typeClass = tx.type === 'income' ? 'income' : 'expense';
      
      item.innerHTML = `
        <div class="tx-info">
          <span class="tx-desc">${escapeHTML(tx.description)}</span>
          <span class="tx-date">${tx.date}</span>
        </div>
        <span class="tx-val ${typeClass}">${sign}Rp ${formatNumber(val)}</span>
      `;
      transactionsList.appendChild(item);
    });

    const balanceTotal = incomeTotal - expenseTotal;
    
    document.getElementById('budget-total-balance').innerText = `Rp ${formatNumber(balanceTotal)}`;
    document.getElementById('budget-income-total').innerText = `+Rp ${formatNumber(incomeTotal)}`;
    document.getElementById('budget-expense-total').innerText = `-Rp ${formatNumber(expenseTotal)}`;
  };

  // 4. Render Activity Tracker (Habits)
  const renderTracker = () => {
    habitsContainer.innerHTML = '';
    
    let totalProgress = 0;
    
    state.habits.forEach(habit => {
      const percent = Math.min(Math.round((habit.current / habit.target) * 100), 100);
      totalProgress += percent;
      
      const item = document.createElement('div');
      item.className = 'habit-bar-item';
      item.innerHTML = `
        <div class="habit-meta">
          <span class="habit-name">${escapeHTML(habit.name)}</span>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="habit-progress-val">${habit.current}/${habit.target} (${percent}%)</span>
            <button class="btn-habit-plus interactive" data-id="${habit.id}" aria-label="Tambah progress">+1</button>
          </div>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${percent}%;"></div>
        </div>
      `;
      
      item.querySelector('.btn-habit-plus').addEventListener('click', () => {
        incrementHabit(habit.id);
      });
      
      habitsContainer.appendChild(item);
    });
    
    const overallScore = state.habits.length > 0 ? Math.round(totalProgress / state.habits.length) : 0;
    document.getElementById('tracking-overall-score').innerText = `${overallScore}% Selesai`;
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

  // Add Transaction Event
  document.getElementById('btn-add-transaction').addEventListener('click', () => {
    const desc = document.getElementById('tx-description').value.trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const type = document.getElementById('tx-type').value;

    if (!desc || isNaN(amount) || amount <= 0) {
      alert('Mohon isi nama deskripsi dan jumlah transaksi dengan benar.');
      return;
    }

    state.transactions.push({
      id: 'tx-' + Date.now(),
      description: desc,
      amount: amount,
      type: type,
      date: new Date().toLocaleDateString()
    });

    saveState();
    renderBudget();

    // Reset Form
    document.getElementById('tx-description').value = '';
    document.getElementById('tx-amount').value = '';
    
    // Add shimmering flash to balance card
    const balCard = document.querySelector('.balance-card');
    triggerShimmer(balCard);
  });

  // Increment Habit target progress
  const incrementHabit = (id) => {
    const habit = state.habits.find(h => h.id === id);
    if (habit) {
      if (habit.current < habit.target) {
        habit.current += 1;
        saveState();
        renderTracker();
      }
    }
  };

  // ==================== GESTURE & NAVIGATION NAVIGATION ====================

  // Switch views (Main view vs Sub-pages)
  const navigateToSubPage = (pageIndex) => {
    // Set active page title
    const titles = ["Budgeting", "Activity Tracking", "Completed Notes"];
    subPageTitle.innerText = titles[pageIndex];

    // Remove active styles from all tabs, add to selected tab
    Object.values(tabButtons).forEach(btn => btn.classList.remove('active'));
    if (pageIndex === 0) tabButtons.budget.classList.add('active');
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
  tabButtons.budget.addEventListener('click', () => navigateToSubPage(0));
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
  renderBudget();
  renderTracker();

});
