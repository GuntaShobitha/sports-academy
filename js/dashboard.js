/**
 * STACKLY SPORTS ACADEMY - COMPREHENSIVE DASHBOARD CONTROLLER
 * Zero Frameworks, Vanilla JavaScript, Material Icons Only, No Emojis
 * Strict localStorage persistence, Exact Email preservation, Real-time Profile Synchronization
 * 100% Authentically Sports Academy Themed
 */

const STORAGE_CURRENT_USER_KEY = 'stackly_current_user';
const STORAGE_USERS_KEY = 'stackly_academy_users';
const STORAGE_BOOKINGS_KEY = 'stackly_user_bookings';
const STORAGE_EVENTS_KEY = 'stackly_events';
const STORAGE_SERVICES_KEY = 'stackly_services';
const STORAGE_SCHEDULES_KEY = 'stackly_schedules';

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = checkAuth();
  if (!currentUser) return;

  syncProfiles(currentUser);
  initSidebarNavigation();
  initMobileSidebar();
  initGlobalSearch();
  initLogout();
  initSettingsForm(currentUser);
  initNotificationBadge();

  // User Dashboard Specific Inits
  if (document.getElementById('bookSessionForm')) {
    initSessionBooking(currentUser);
    initBookingsTable(currentUser);
    initFacilityBookingShortcut();
  }

  // Admin Dashboard Specific Inits
  if (document.getElementById('adminUsersTableBody')) {
    initAdminUsers();
    initAdminEvents();
    initAdminServices();
    initAdminSchedules();
  }

  // Replayable section entrance animations (fires again on every tab open)
  initReplayAnimations();
});

/* ==========================================================================
   REPLAYABLE SECTION ENTRANCE ANIMATIONS (data-anim system)
   Mirrors initReplayAnimations in main.js. Elements marked with data-anim
   play their entrance animation every time the tab/section becomes visible.
   ========================================================================== */
function initReplayAnimations() {
  const animated = document.querySelectorAll('[data-anim]');
  if (!animated.length) return;

  const showAll = () => animated.forEach(el => el.classList.add('anim-in'));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('anim-in');
      } else {
        entry.target.classList.remove('anim-in');
      }
    });
  }, { threshold: 0.12 });

  animated.forEach(el => observer.observe(el));
}

/* ==========================================================================
   AUTHENTICATION GUARD & INITIALIZATION
   ========================================================================== */
function checkAuth() {
  let userJson = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
  let user = null;

  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      user = null;
    }
  }

  const isUserDash = window.location.pathname.includes('user-dashboard.html');
  const isAdminDash = window.location.pathname.includes('admin-dashboard.html');

  if (!user) {
    // If opened directly without logging in, provide default demo session
    if (isAdminDash) {
      user = {
        name: 'Coach Marcus Stone',
        email: 'admin@stackly.com',
        role: 'admin',
        phone: '+1 (555) 987-6543'
      };
    } else {
      user = {
        name: 'Alexander Vance',
        email: 'alexander.vance@elite.com',
        role: 'user',
        phone: '+1 (555) 234-8901'
      };
    }
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  }

  // Role validation & isolation
  if (isAdminDash && user.role !== 'admin') {
    alert('Access restricted: Administrator / Head Coach permissions required.');
    window.location.href = 'user-dashboard.html';
    return null;
  }

  return user;
}

/* ==========================================================================
   PERSISTENT PROFILE SYNCHRONIZATION
   CRITICAL: Keep exact email (do NOT strip anything after @)
   Keep Top Right Profile & Sidebar Profile synchronized
   ========================================================================== */
function syncProfiles(user) {
  const exactEmail = user.email; // Exact email intact
  const fullName = user.name;
  const roleDisplay = (user.role === 'admin') ? 'ADMIN' : 'MEMBER';

  // Sidebar profile targets
  const sidebarName = document.getElementById('sidebarUserName');
  const sidebarEmail = document.getElementById('sidebarUserEmail');
  const sidebarRole = document.getElementById('sidebarUserRole');

  if (sidebarName) sidebarName.textContent = fullName;
  if (sidebarEmail) sidebarEmail.textContent = exactEmail;
  if (sidebarRole) {
    sidebarRole.textContent = roleDisplay;
    sidebarRole.className = `dash-user-role-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}`;
  }

  // Topbar profile targets
  const topbarName = document.getElementById('topbarUserName');
  if (topbarName) topbarName.textContent = fullName;

  // Profile View Tab (if present)
  const profileCardName = document.getElementById('profileCardName');
  const profileCardEmail = document.getElementById('profileCardEmail');
  const profileCardPhone = document.getElementById('profileCardPhone');
  const profileCardRole = document.getElementById('profileCardRole');

  if (profileCardName) profileCardName.textContent = fullName;
  if (profileCardEmail) profileCardEmail.textContent = exactEmail;
  if (profileCardPhone) profileCardPhone.textContent = user.phone || '+1 (555) 234-8901';
  if (profileCardRole) profileCardRole.textContent = roleDisplay;

  // Settings form input targets
  const settingsName = document.getElementById('settingsName');
  const settingsEmail = document.getElementById('settingsEmail');
  const settingsPhone = document.getElementById('settingsPhone');

  if (settingsName) settingsName.value = fullName;
  if (settingsEmail) settingsEmail.value = exactEmail;
  if (settingsPhone) settingsPhone.value = user.phone || '';
}

/* ==========================================================================
   SIDEBAR TAB NAVIGATION (Zero Dead Links)
   ========================================================================== */
function initSidebarNavigation() {
  const navItems = document.querySelectorAll('.dash-nav-item[data-tab]');
  const tabs = document.querySelectorAll('.dash-view-tab');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.getAttribute('data-tab');

      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      tabs.forEach(tab => {
        if (tab.id === `tab-${targetTab}`) {
          tab.classList.add('active-tab');
        } else {
          tab.classList.remove('active-tab');
        }
      });

      // Close mobile drawer if open
      const sidebar = document.querySelector('.dash-sidebar');
      const overlay = document.querySelector('.dash-sidebar-overlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.classList.remove('menu-open');
    });
  });

  // Handle Quick Action jump buttons (e.g. data-jump-tab="book-session")
  document.querySelectorAll('[data-jump-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = btn.getAttribute('data-jump-tab');
      const matchingNav = document.querySelector(`.dash-nav-item[data-tab="${tabName}"]`);
      if (matchingNav) matchingNav.click();
    });
  });
}

/* ==========================================================================
   MOBILE SIDEBAR DRAWER & BODY SCROLL LOCK
   ========================================================================== */
function initMobileSidebar() {
  const toggleBtn = document.querySelector('.dash-menu-toggle');
  const sidebar = document.querySelector('.dash-sidebar');
  const closeBtn = document.querySelector('.dash-sidebar-close');

  let overlay = document.querySelector('.dash-sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'dash-sidebar-overlay';
    document.body.appendChild(overlay);
  }

  const openSidebar = () => {
    if (sidebar) sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('menu-open');
  };

  const closeSidebar = () => {
    if (sidebar) sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('menu-open');
  };

  if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });
}

/* ==========================================================================
   SETTINGS FORM & REAL-TIME SYNCHRONIZATION
   ========================================================================== */
function initSettingsForm(currentUser) {
  const settingsForm = document.getElementById('dashSettingsForm');
  if (!settingsForm) return;

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('settingsName')?.value.trim();
    const phone = document.getElementById('settingsPhone')?.value.trim();
    const newPass = document.getElementById('settingsNewPass')?.value;
    const confirmPass = document.getElementById('settingsConfirmPass')?.value;

    if (!name || name.length < 2) {
      showToast('Please provide a valid full name', 'error');
      return;
    }

    if (newPass && newPass.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (newPass && newPass !== confirmPass) {
      showToast('Passwords do not match', 'error');
      return;
    }

    // Update active user in localStorage
    currentUser.name = name;
    currentUser.phone = phone;
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(currentUser));

    // Update global users roster
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
    const idx = users.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
    if (idx !== -1) {
      users[idx].name = name;
      users[idx].phone = phone;
      if (newPass) users[idx].password = newPass;
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    }

    // Real-time synchronization without page reload
    syncProfiles(currentUser);

    // Reset password fields
    if (document.getElementById('settingsNewPass')) document.getElementById('settingsNewPass').value = '';
    if (document.getElementById('settingsConfirmPass')) document.getElementById('settingsConfirmPass').value = '';

    showToast('Profile & Settings updated successfully!', 'success');
  });
}

/* ==========================================================================
   LOGOUT HANDLING
   Clears session and redirects to login.html
   Multiple fallback selectors to ensure the button always works
   ========================================================================== */
function initLogout() {
  function performLogout(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove session data from localStorage
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    
    // Show logout message and redirect
    showToast('Logging out...', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  }

  // Primary: class-based selectors - look for ALL logout buttons
  const logoutButtons = document.querySelectorAll('.dash-logout-btn');
  
  logoutButtons.forEach(btn => {
    // Remove any existing listeners by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', performLogout);
  });

  // If no buttons found by class, try fallback by icon content
  if (logoutButtons.length === 0) {
    document.querySelectorAll('button').forEach(btn => {
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon && icon.textContent.trim() === 'logout') {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', performLogout);
      }
    });
  }
}

/* ==========================================================================
   GLOBAL SEARCH FILTERING
   Filters rows in currently active table
   ========================================================================== */
function initGlobalSearch() {
  const searchInput = document.querySelector('.dash-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const activeTab = document.querySelector('.dash-view-tab.active-tab');
    if (!activeTab) return;

    const rows = activeTab.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });

    // Also filter facility cards or notif cards
    const cards = activeTab.querySelectorAll('.route-card, .notif-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

/* ==========================================================================
   NOTIFICATIONS TAB & BADGE
   ========================================================================== */
function initNotificationBadge() {
  const notifBtn = document.querySelector('.dash-topbar-btn[data-action="notifications"]');
  const markReadBtn = document.getElementById('markAllNotifsRead');

  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      const notifNav = document.querySelector('.dash-nav-item[data-tab="notifications"]');
      if (notifNav) notifNav.click();
    });
  }

  if (markReadBtn) {
    markReadBtn.addEventListener('click', () => {
      document.querySelectorAll('.notif-card.unread').forEach(el => el.classList.remove('unread'));
      const notifDot = document.querySelector('.dash-notif-dot');
      if (notifDot) notifDot.style.display = 'none';
      const badge = document.getElementById('sidebarBookingCount') || document.querySelector('.dash-nav-badge');
      if (badge && badge.classList.contains('notif-badge')) badge.textContent = '0';
      showToast('All notifications marked as read', 'info');
    });
  }
}

/* ==========================================================================
   USER DASHBOARD: SPORTS SESSION BOOKING SYSTEM
   ========================================================================== */
function initSessionBooking(currentUser) {
  const bookForm = document.getElementById('bookSessionForm');
  if (!bookForm) return;

  // Set minimum date to today
  const dateInput = document.getElementById('sessionDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    if (!dateInput.value) dateInput.value = today;
  }

  // Live fee calculation
  const programSelect = document.getElementById('sessionProgram');
  const tierSelect = document.getElementById('sessionTier');
  const coachSelect = document.getElementById('sessionCoach');
  const feeDisplay = document.getElementById('sessionCalculatedFee');

  const updateFee = () => {
    if (!feeDisplay) return;
    const baseFee = 45;
    const tierMultiplier = tierSelect?.value === '1on1' ? 2.2 : tierSelect?.value === 'elite' ? 1.5 : 1.0;
    const total = (baseFee * tierMultiplier).toFixed(2);
    feeDisplay.textContent = `$${total}`;
  };

  [programSelect, tierSelect, coachSelect].forEach(el => {
    if (el) el.addEventListener('change', updateFee);
  });
  updateFee();

  // Form Submission
  bookForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const program = programSelect?.value;
    const arena = document.getElementById('sessionArena')?.value;
    const date = dateInput?.value;
    const timeSlot = document.getElementById('sessionTime')?.value || '08:30 AM';
    const tier = tierSelect?.value || 'Standard';
    const coach = coachSelect?.value || 'Coach Marcus Stone';

    if (!program || !arena || !date) {
      showToast('Please select training program, arena, and date', 'error');
      return;
    }

    const calculatedFee = feeDisplay ? feeDisplay.textContent : '$45.00';
    const sessionId = `STK-SES-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = {
      id: sessionId,
      program,
      arena,
      date,
      time: timeSlot,
      tier: tier.toUpperCase(),
      coach,
      fee: calculatedFee,
      status: 'Confirmed',
      athleteName: currentUser.name,
      athleteEmail: currentUser.email,
      bookedAt: new Date().toISOString()
    };

    const bookings = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
    bookings.unshift(newBooking);
    localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));

    showToast(`Training Slot Reserved! Session ID: ${sessionId}`, 'success');
    bookForm.reset();
    updateFee();

    // Re-render table and switch to My Bookings tab
    initBookingsTable(currentUser);
    const myBookingsNav = document.querySelector('.dash-nav-item[data-tab="my-bookings"]');
    if (myBookingsNav) myBookingsNav.click();
  });
}

/* ==========================================================================
   USER DASHBOARD: MY BOOKINGS TABLE & ATHLETE PASS MODAL
   ========================================================================== */
function initBookingsTable(currentUser) {
  const tableBody = document.getElementById('myBookingsTableBody');
  const recentTableBody = document.getElementById('recentBookingsTableBody');
  const activeCountBadge = document.getElementById('metricActiveSessions');
  const sidebarCount = document.getElementById('sidebarBookingCount');

  let bookings = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');

  // Seed default training bookings if empty
  if (bookings.length === 0) {
    bookings = [
      {
        id: 'STK-SES-7102',
        program: 'Elite Football Striker Masterclass',
        arena: 'FIFA Arena A (Main Turf)',
        date: '2026-09-15',
        time: '08:30 AM',
        tier: 'ELITE SQUAD',
        coach: 'Head Coach Marcus Stone',
        fee: '$67.50',
        status: 'Confirmed',
        athleteName: currentUser.name,
        athleteEmail: currentUser.email
      },
      {
        id: 'STK-SES-6420',
        program: 'Olympic Strength & Velocity Conditioning',
        arena: 'Olympic Gym Zone B',
        date: '2026-09-18',
        time: '04:00 PM',
        tier: '1-ON-1 MASTER',
        coach: 'Coach Elena Rostova',
        fee: '$99.00',
        status: 'Confirmed',
        athleteName: currentUser.name,
        athleteEmail: currentUser.email
      },
      {
        id: 'STK-SES-5198',
        program: 'Speed Lab Kinetic Sprint Mechanics',
        arena: 'Olympic Track B',
        date: '2026-08-30',
        time: '09:00 AM',
        tier: 'STANDARD',
        coach: 'David Vance',
        fee: '$45.00',
        status: 'Completed',
        athleteName: currentUser.name,
        athleteEmail: currentUser.email
      }
    ];
    localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
  }

  // Filter for current user
  const userBookings = bookings.filter(b => !b.athleteEmail || b.athleteEmail.toLowerCase() === currentUser.email.toLowerCase());

  const activeOnes = userBookings.filter(b => b.status === 'Confirmed');
  if (activeCountBadge) activeCountBadge.textContent = `${activeOnes.length} Active`;
  if (sidebarCount) sidebarCount.textContent = activeOnes.length.toString();

  const renderRows = (tbody, items, isCompact = false) => {
    if (!tbody) return;
    tbody.innerHTML = '';

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${isCompact ? 5 : 7}" style="text-align:center; padding:2rem; color:var(--text-muted);">No sessions booked yet. Reserve your training slot above!</td></tr>`;
      return;
    }

    items.forEach((item) => {
      const tr = document.createElement('tr');
      const statusClass = item.status.toLowerCase();

      if (isCompact) {
        tr.innerHTML = `
          <td><strong style="color:var(--accent-volt);">${item.id}</strong></td>
          <td>
            <div style="font-weight:700; color:var(--text-pure);">${item.program}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${item.arena}</div>
          </td>
          <td>${item.date} (${item.time})</td>
          <td><span class="status-badge ${statusClass}">${item.status}</span></td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="window.location.href='./404.html'"   data-id="${item.id}" style="padding:0.25rem 0.6rem; font-size:0.75rem;">
              View Pass
            </button>
          </td>
        `;
      } else {
        tr.innerHTML = `
          <td><strong style="color:var(--accent-volt);">${item.id}</strong></td>
          <td>
            <div style="font-weight:700; color:var(--text-pure);">${item.program}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${item.arena}</div>
          </td>
          <td>${item.date} <span style="font-size:0.75rem; color:var(--text-secondary);">(${item.time})</span></td>
          <td>${item.coach}</td>
          <td><strong style="color:var(--accent-volt);">${item.fee}</strong></td>
          <td><span class="status-badge ${statusClass}">${item.status}</span></td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-outline btn-sm view-pass-btn" data-id="${item.id}" style="padding:0.25rem 0.6rem; font-size:0.75rem;">
                Pass
              </button>
              ${item.status === 'Confirmed' ? `
                <button class="btn btn-outline btn-sm" onclick="window.location.href='./404.html'" data-id="${item.id}" style="padding:0.25rem 0.6rem; font-size:0.75rem; border-color:rgba(239,68,68,0.3); color:var(--accent-red);">
                  Cancel
                </button>
              ` : ''}
            </div>
          </td>
        `;
      }
      tbody.appendChild(tr);
    });

    // Attach actions
    tbody.querySelectorAll('.view-pass-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const target = userBookings.find(b => b.id === id);
        if (target) showAthletePassModal(target, currentUser);
      });
    });

    tbody.querySelectorAll('.cancel-booking-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Cancel training session ${id}?`)) {
          const allBookings = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
          const target = allBookings.find(b => b.id === id);
          if (target) {
            target.status = 'Cancelled';
            localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(allBookings));
            initBookingsTable(currentUser);
            showToast(`Training session ${id} cancelled.`, 'info');
          }
        }
      });
    });
  };

  renderRows(tableBody, userBookings, false);
  renderRows(recentTableBody, userBookings.slice(0, 4), true);
}

/* ==========================================================================
   ATHLETE TRAINING PASS MODAL
   Displays full details, exact email, barcode
   ========================================================================== */
function showAthletePassModal(booking, currentUser) {
  let modal = document.getElementById('athletePassModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'athletePassModal';
    modal.className = 'eticket-modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="eticket-pass-card">
      <div class="eticket-pass-header">
        <div>
          <div class="eticket-brand">STACKLY ATHLETE PASS</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">Official Academy Biometric Training Clearance</div>
        </div>
        <div class="eticket-pnr">${booking.id}</div>
      </div>
      <div class="eticket-pass-body">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <div>
            <div style="font-family:var(--font-heading); font-size:1.6rem; color:var(--text-pure);">${booking.program}</div>
            <div style="font-size:0.85rem; color:var(--accent-volt);">${booking.arena}</div>
          </div>
          <span class="fixture-status-pill status-live">CLEARED</span>
        </div>

        <div class="eticket-grid">
          <div>
            <div class="eticket-detail-label">Athlete Name</div>
            <div class="eticket-detail-val">${booking.athleteName || currentUser.name}</div>
          </div>
          <div>
            <div class="eticket-detail-label">Exact Email</div>
            <div class="eticket-detail-val" style="word-break:break-all; font-size:0.8rem;">${booking.athleteEmail || currentUser.email}</div>
          </div>
          <div>
            <div class="eticket-detail-label">Session Date & Time</div>
            <div class="eticket-detail-val">${booking.date} (${booking.time})</div>
          </div>
          <div>
            <div class="eticket-detail-label">Assigned Coach</div>
            <div class="eticket-detail-val">${booking.coach}</div>
          </div>
          <div>
            <div class="eticket-detail-label">Training Tier</div>
            <div class="eticket-detail-val">${booking.tier || 'STANDARD'}</div>
          </div>
          <div>
            <div class="eticket-detail-label">Fee Settled</div>
            <div class="eticket-detail-val" style="color:var(--accent-volt);">${booking.fee}</div>
          </div>
        </div>

        <div class="eticket-barcode-section">
          <div>
            <div style="font-weight:700; font-size:0.85rem; color:var(--text-pure);">SECTOR GATE 02 • LOCKER POD 14</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Check-in 10 minutes prior for heart-rate telemetry</div>
          </div>
          <div class="eticket-barcode-lines"></div>
        </div>
      </div>
      <div class="eticket-footer">
        <button class="btn btn-outline btn-sm close-modal-btn">Close</button>
        <button class="btn btn-primary btn-sm" onclick="window.print();">
          <span class="material-symbols-outlined" style="font-size:16px;">print</span>
          <span>Print Session Pass</span>
        </button>
      </div>
    </div>
  `;

  modal.classList.add('open');

  modal.querySelector('.close-modal-btn').addEventListener('click', () => {
    modal.classList.remove('open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });
}

/* ==========================================================================
   FACILITIES PRE-FILL SHORTCUT
   ========================================================================== */
function initFacilityBookingShortcut() {
  const facilityBtns = document.querySelectorAll('.book-facility-btn');
  facilityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const arenaName = btn.getAttribute('data-arena');
      const arenaSelect = document.getElementById('sessionArena');

      if (arenaSelect && arenaName) {
        arenaSelect.value = arenaName;
      }

      // Jump to Book Session tab
      const bookTabNav = document.querySelector('.dash-nav-item[data-tab="book-session"]');
      if (bookTabNav) bookTabNav.click();

      showToast(`Selected Facility: ${arenaName}`, 'info');
    });
  });
}

/* ==========================================================================
   ADMIN DASHBOARD: MANAGE USERS / ATHLETES
   ========================================================================== */
function initAdminUsers() {
  const tbody = document.getElementById('adminUsersTableBody');
  const addUserForm = document.getElementById('adminAddUserForm');
  const totalUsersMetric = document.getElementById('metricAdminTotalUsers');

  const loadUsers = () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
    if (totalUsersMetric) totalUsersMetric.textContent = users.length.toString();

    if (!tbody) return;
    tbody.innerHTML = '';

    users.forEach((user, index) => {
      const tr = document.createElement('tr');
      const roleBadgeClass = user.role === 'admin' ? 'role-admin' : 'role-user';
      tr.innerHTML = `
        <td><strong style="color:var(--text-muted);">#ATH-${101 + index}</strong></td>
        <td>
          <div style="font-weight:700; color:var(--text-pure);">${user.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${user.phone || 'No phone recorded'}</div>
        </td>
        <!-- Exact email displayed -->
        <td style="word-break:break-all; font-family:monospace; font-size:0.85rem;">${user.email}</td>
        <td><span class="dash-user-role-badge ${roleBadgeClass}">${user.role.toUpperCase()}</span></td>
        <td><span class="status-badge active">Active</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="window.location.href='./404.html'" data-index="${index}" style="padding:0.25rem 0.55rem; font-size:0.75rem; color:var(--accent-red); border-color:rgba(239,68,68,0.3);">
            Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
        if (users[idx].role === 'admin' && users[idx].email === 'admin@stackly.com') {
          showToast('Cannot delete default Head Coach Admin account', 'error');
          return;
        }
        if (confirm(`Remove athlete ${users[idx].name}?`)) {
          users.splice(idx, 1);
          localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
          loadUsers();
          showToast('Athlete removed successfully', 'info');
        }
      });
    });
  };

  loadUsers();

  if (addUserForm) {
    addUserForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('newUserName')?.value.trim();
      const email = document.getElementById('newUserEmail')?.value.trim();
      const role = document.getElementById('newUserRole')?.value || 'user';
      const phone = document.getElementById('newUserPhone')?.value.trim();

      if (!name || !email) {
        showToast('Name and Email are required', 'error');
        return;
      }

      const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        showToast('An account with this email address already exists', 'error');
        return;
      }

      users.push({
        name,
        email,
        role,
        phone,
        password: 'Password123!'
      });

      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
      loadUsers();
      addUserForm.reset();
      showToast(`Athlete ${name} enrolled successfully!`, 'success');
    });
  }
}

/* ==========================================================================
   ADMIN DASHBOARD: TOURNAMENTS & EVENTS MANAGEMENT
   ========================================================================== */
function initAdminEvents() {
  const tbody = document.getElementById('adminEventsTableBody');
  const addEventForm = document.getElementById('adminAddEventForm');

  const defaultEvents = [
    { id: 'EVT-401', name: 'UEFA Youth Champions Invitational', date: '2026-10-15', venue: 'FIFA Arena A', capacity: '500/500', status: 'Live' },
    { id: 'EVT-402', name: 'National Track & Speed Showcase', date: '2026-10-22', venue: 'Olympic Track B', capacity: '320/400', status: 'Scheduled' },
    { id: 'EVT-403', name: 'Elite Weightlifting Invitational', date: '2026-11-05', venue: 'Strength Lab', capacity: '180/200', status: 'Scheduled' },
    { id: 'EVT-404', name: 'Pro Academy Scout Showcase', date: '2026-11-12', venue: 'Turf Pitch 1', capacity: '450/450', status: 'Scheduled' }
  ];

  let events = JSON.parse(localStorage.getItem(STORAGE_EVENTS_KEY) || '[]');
  if (events.length === 0) {
    events = defaultEvents;
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
  }

  const loadEvents = () => {
    if (!tbody) return;
    tbody.innerHTML = '';

    events.forEach((evt, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color:var(--accent-volt);">${evt.id}</strong></td>
        <td><div style="font-weight:700; color:var(--text-pure);">${evt.name}</div></td>
        <td>${evt.date}</td>
        <td>${evt.venue}</td>
        <td><span style="font-size:0.85rem; font-weight:700;">${evt.capacity}</span></td>
        <td><span class="status-badge ${evt.status === 'Live' ? 'ontime' : 'confirmed'}">${evt.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="window.location.href='./404.html'" data-index="${idx}" style="padding:0.25rem 0.55rem; font-size:0.75rem; color:var(--accent-red); border-color:rgba(239,68,68,0.3);">
            Cancel
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.delete-event-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        events.splice(idx, 1);
        localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
        loadEvents();
        showToast('Tournament removed from calendar', 'info');
      });
    });
  };

  loadEvents();

  if (addEventForm) {
    addEventForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('newEventName')?.value.trim();
      const date = document.getElementById('newEventDate')?.value;
      const venue = document.getElementById('newEventVenue')?.value.trim();
      const capacity = document.getElementById('newEventCapacity')?.value.trim();

      if (!name || !date || !venue) {
        showToast('Please fill all event details', 'error');
        return;
      }

      events.unshift({
        id: `EVT-${Math.floor(100 + Math.random() * 900)}`,
        name,
        date,
        venue,
        capacity: `0/${capacity || '300'}`,
        status: 'Scheduled'
      });

      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
      loadEvents();
      addEventForm.reset();
      showToast(`Tournament "${name}" scheduled successfully!`, 'success');
    });
  }
}

/* ==========================================================================
   ADMIN DASHBOARD: SERVICES MANAGEMENT
   ========================================================================== */
function initAdminServices() {
  const tbody = document.getElementById('adminServicesTableBody');
  if (!tbody) return;

  const defaultServices = [
    { name: 'FIFA Turf Pitch Rental', category: 'Pitch Booking', lead: 'Coach Marcus Stone', fee: '$120 / Hr', status: 'Active' },
    { name: 'Olympic Biometrics & Strength Lab', category: 'Conditioning', lead: 'Elena Rostova', fee: '$80 / Mo', status: 'Active' },
    { name: 'Sports Medicine & Cryotherapy', category: 'Recovery', lead: 'Dr. Sarah Jenkins', fee: '$95 / Session', status: 'Active' },
    { name: 'Scouting Video Analysis & AI Tracking', category: 'Analytics', lead: 'David Vance', fee: '$150 / Match', status: 'Active' },
    { name: 'Kinetic Sprint Laboratory Access', category: 'Track & Field', lead: 'Speed Staff', fee: '$60 / Session', status: 'Active' }
  ];

  let services = JSON.parse(localStorage.getItem(STORAGE_SERVICES_KEY) || '[]');
  if (services.length === 0) {
    services = defaultServices;
    localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(services));
  }

  const loadServices = () => {
    tbody.innerHTML = '';
    services.forEach((srv, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color:var(--text-pure);">${srv.name}</strong></td>
        <td><span style="color:var(--text-secondary);">${srv.category}</span></td>
        <td>${srv.lead}</td>
        <td><strong style="color:var(--accent-volt);">${srv.fee}</strong></td>
        <td><span class="status-badge ${srv.status === 'Active' ? 'active' : 'inactive'}">${srv.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm toggle-srv-btn" data-index="${idx}" style="padding:0.25rem 0.55rem; font-size:0.75rem;">
            Toggle Status
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.toggle-srv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        services[idx].status = services[idx].status === 'Active' ? 'Inactive' : 'Active';
        localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(services));
        loadServices();
        showToast(`Status updated for ${services[idx].name}`, 'info');
      });
    });
  };

  loadServices();
}

/* ==========================================================================
   ADMIN DASHBOARD: TRAINING SCHEDULES MANAGEMENT
   ========================================================================== */
function initAdminSchedules() {
  const tbody = document.getElementById('adminSchedulesTableBody');
  if (!tbody) return;

  const defaultSchedules = [
    { id: 'SCH-801', drill: 'Varsity Striker Drills', arena: 'FIFA Arena A', dep: '07:00 AM', arr: '08:45 AM', coach: 'Coach Marcus', status: 'On Schedule' },
    { id: 'SCH-802', drill: 'Olympic Clean & Jerk Workshop', arena: 'Strength Lab Zone B', dep: '09:00 AM', arr: '10:30 AM', coach: 'Elena Rostova', status: 'On Schedule' },
    { id: 'SCH-803', drill: 'Hydro Recovery & Ice Baths', arena: 'Aquatic Recovery Spa', dep: '11:00 AM', arr: '12:00 PM', coach: 'Dr. Jenkins', status: 'On Schedule' },
    { id: 'SCH-804', drill: 'Sprint Velocity Biomechanics', arena: 'Olympic Track B', dep: '03:30 PM', arr: '05:00 PM', coach: 'David Vance', status: 'On Schedule' }
  ];

  let schedules = JSON.parse(localStorage.getItem(STORAGE_SCHEDULES_KEY) || '[]');
  if (schedules.length === 0) {
    schedules = defaultSchedules;
    localStorage.setItem(STORAGE_SCHEDULES_KEY, JSON.stringify(schedules));
  }

  const loadSchedules = () => {
    tbody.innerHTML = '';
    schedules.forEach((sch, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color:var(--accent-volt);">${sch.id}</strong></td>
        <td><div style="font-weight:700; color:var(--text-pure);">${sch.drill}</div></td>
        <td>${sch.arena}</td>
        <td>${sch.dep} &rarr; ${sch.arr}</td>
        <td><span style="font-weight:600; color:var(--text-pure);">${sch.coach}</span></td>
        <td><span class="status-badge ontime">${sch.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm toggle-delay-btn" data-index="${idx}" style="padding:0.25rem 0.55rem; font-size:0.75rem;">
            Update Status
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.toggle-delay-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        sch = schedules[idx];
        sch.status = sch.status === 'On Schedule' ? 'In Progress' : 'On Schedule';
        localStorage.setItem(STORAGE_SCHEDULES_KEY, JSON.stringify(schedules));
        loadSchedules();
        showToast(`Schedule ${schedules[idx].id} status updated.`, 'info');
      });
    });
  };

  loadSchedules();
}

/* --- Global Toast Utility --- */
function showToast(message, type = 'info') {
  if (window.showToast) {
    window.showToast(message, type);
    return;
  }

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check_circle';
  if (type === 'error') iconName = 'error';

  toast.innerHTML = `
    <span class="material-symbols-outlined">${iconName}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}



const broadcastForm = document.getElementById("broadcastForm");

const broadcastTitle = document.getElementById("broadcastTitle");
const broadcastAudience = document.getElementById("broadcastAudience");
const broadcastPriority = document.getElementById("broadcastPriority");
const broadcastMessage = document.getElementById("broadcastMessage");

const broadcastTitleError = document.getElementById("broadcastTitleError");
const broadcastAudienceError = document.getElementById("broadcastAudienceError");
const broadcastPriorityError = document.getElementById("broadcastPriorityError");
const broadcastMessageError = document.getElementById("broadcastMessageError");


broadcastForm.addEventListener("submit", function (event) {

  // Stop normal form submission
  event.preventDefault();

  let isValid = true;


  // Clear previous errors
  clearError(broadcastTitle, broadcastTitleError);
  clearError(broadcastAudience, broadcastAudienceError);
  clearError(broadcastPriority, broadcastPriorityError);
  clearError(broadcastMessage, broadcastMessageError);


  // Announcement Title
  if (broadcastTitle.value.trim() === "") {

    showError(
      broadcastTitle,
      broadcastTitleError,
      "Please enter an announcement title."
    );

    isValid = false;
  }


  // Target Audience
  if (broadcastAudience.value === "") {

    showError(
      broadcastAudience,
      broadcastAudienceError,
      "Please select a target audience."
    );

    isValid = false;
  }


  // Alert Priority
  if (broadcastPriority.value === "") {

    showError(
      broadcastPriority,
      broadcastPriorityError,
      "Please select alert priority."
    );

    isValid = false;
  }


  // Message
  if (broadcastMessage.value.trim() === "") {

    showError(
      broadcastMessage,
      broadcastMessageError,
      "Please enter the message content."
    );

    isValid = false;
  }


  // Stop here if validation failed
  if (!isValid) {
    return;
  }


  // Success
  window.location.href='./404.html'

  broadcastForm.reset();
});


function showError(input, errorElement, message) {

  errorElement.textContent = message;
  errorElement.style.display = "block";

  input.classList.add("input-error");
}


function clearError(input, errorElement) {

  errorElement.textContent = "";
  errorElement.style.display = "none";

  input.classList.remove("input-error");
}