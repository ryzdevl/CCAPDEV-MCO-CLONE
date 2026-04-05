 const TYPE_META = {
        like:    { icon: '♥', label: 'liked your post',       badgeCls: 'badge-like'    },
        dislike: { icon: '↓', label: 'disliked your post',    badgeCls: 'badge-dislike' },
        share:   { icon: '↗', label: 'shared your post',      badgeCls: 'badge-share'   },
        follow:  { icon: '✦', label: 'started following you', badgeCls: 'badge-follow'  },
        reply:   { icon: '↩', label: 'replied to your post',  badgeCls: 'badge-reply'   },
        mention: { icon: '@', label: 'mentioned you',          badgeCls: 'badge-mention' }
    };

    let allNotifications = [];
    let activeFilter = 'all';
    let notificationsLoaded = false;

    // Sidebar profile 
    function loadProfile() {
        if (typeof getCurrentUser !== 'function') return;
        getCurrentUser(function () {
            const u = window.currentUser;
            if (!u) return;
            document.getElementById('disp-name').textContent = u.displayName || u.username;
            document.getElementById('username').textContent  = '@' + u.username;
            document.getElementById('bio').textContent       = u.bio || '';
            const pfp = document.querySelector('#toprofile img');
            if (pfp) pfp.src = u.profilePic || '../assets/defaultuser.png';
            document.getElementById('profile-link').href = `UserPage.html?userId=${u._id}`;
            initSearch();
        });
    }

    // Time helpers 
    function timeAgo(dateStr) {
        const diff = (Date.now() - new Date(dateStr)) / 1000;
        if (diff < 60)     return 'just now';
        if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function dayLabel(dateStr) {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString())     return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    // Build card
    function buildCard(n, delay) {
        const meta        = TYPE_META[n.type] || { icon: '•', label: 'interacted with you', badgeCls: 'badge-mention' };
        const sender      = n.sender || {};
        const displayName = sender.displayName || sender.username || 'Someone';
        const profilePic  = sender.profilePic  || '../assets/defaultuser.png';

        const card = document.createElement('div');
        card.className = `notif-item${n.read ? '' : ' unread'}`;
        card.dataset.id   = n._id;
        card.dataset.type = n.type;
        card.style.animationDelay = `${delay}ms`;

        const preview = n.post?.content
            ? `<div class="notif-preview">"${n.post.content.slice(0, 80)}${n.post.content.length > 80 ? '…' : ''}"</div>`
            : '';

        card.innerHTML = `
            <div class="notif-avatar-wrap">
                <img class="notif-avatar" src="${profilePic}" alt="${displayName}" onerror="this.src='../assets/defaultuser.png'">
                <div class="notif-type-badge ${meta.badgeCls}">${meta.icon}</div>
            </div>
            <div class="notif-body">
                <div class="notif-text">
                    <span class="sender-name">${displayName}</span>
                    <span class="action-desc"> ${meta.label}</span>
                </div>
                ${preview}
                <div class="notif-time">
                    ${!n.read ? '<span class="unread-pip"></span>' : ''}
                    ${timeAgo(n.createdAt)}
                </div>
            </div>
            <button class="notif-dismiss" title="Dismiss">×</button>
        `;

        card.addEventListener('click', async (e) => {
            if (e.target.closest('.notif-dismiss')) return;
            if (!n.read) {
                await fetch(`/api/notifications/${n._id}/read`, { method: 'PUT' });
                card.classList.remove('unread');
                card.querySelector('.unread-pip')?.remove();
                n.read = true;
                updateUnreadBanner();
            }
        });

        card.querySelector('.notif-dismiss').addEventListener('click', async (e) => {
            e.stopPropagation();
            await fetch(`/api/notifications/${n._id}`, { method: 'DELETE' });
            card.style.transition = 'opacity 0.2s, transform 0.2s';
            card.style.opacity    = '0';
            card.style.transform  = 'translateX(16px)';
            setTimeout(() => {
                card.remove();
                allNotifications = allNotifications.filter(x => x._id !== n._id);
                updateUnreadBanner();
                updateStats();
                checkEmpty();
            }, 200);
        });

        return card;
    }

    // Render 
    function renderList() {
        const list = document.getElementById('notif-list');
        list.innerHTML = '';

        const filtered = activeFilter === 'all'
            ? allNotifications
            : allNotifications.filter(n => n.type === activeFilter);

        if (filtered.length === 0) { checkEmpty(true); return; }
        checkEmpty(false);

        let lastDay = null;
        filtered.forEach((n, i) => {
            const day = dayLabel(n.createdAt);
            if (day !== lastDay) {
                const lbl = document.createElement('div');
                lbl.className   = 'date-label';
                lbl.textContent = day;
                list.appendChild(lbl);
                lastDay = day;
            }
            list.appendChild(buildCard(n, i * 25));
        });
    }

    function updateUnreadBanner() {
        const unread = allNotifications.filter(n => !n.read).length;
        const banner = document.getElementById('unreadBanner');
        const text   = document.getElementById('unreadText');
        if (unread > 0) {
            banner.classList.remove('hidden');
            text.textContent = `${unread} unread notification${unread !== 1 ? 's' : ''}`;
        } else {
            banner.classList.add('hidden');
        }
    }

    function updateStats() {
        const counts = { like: 0, dislike: 0, share: 0, follow: 0, reply: 0 };
        allNotifications.forEach(n => { if (counts[n.type] !== undefined) counts[n.type]++; });
        Object.entries(counts).forEach(([type, count]) => {
            const el = document.getElementById(`stat-${type}`);
            if (el) el.textContent = count;
        });
    }

    function checkEmpty(force) {
        const list  = document.getElementById('notif-list');
        const empty = document.getElementById('emptyState');
        empty.classList.toggle('visible', force || list.children.length === 0);
    }

    // ── Load notifications (same pattern as working version) ─
    async function loadNotifications() {
        try {
            const res  = await fetch('/api/notifications');
            const json = await res.json();

            // Remove skeletons by ID (same as working version)
            ['sk1', 'sk2', 'sk3'].forEach(id => document.getElementById(id)?.remove());

            notificationsLoaded = true;

            if (!json.success) {
                console.error('Notification fetch failed:', json.error);
                checkEmpty(true);
                return;
            }

            allNotifications = json.data || [];
            updateUnreadBanner();
            updateStats();
            renderList();
        } catch (err) {
            console.error('Notification load error:', err);
            ['sk1', 'sk2', 'sk3'].forEach(id => document.getElementById(id)?.remove());
            notificationsLoaded = true;
            checkEmpty(true);
        }
    }

    // Filter tabs 
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderList();
        });
    });

    document.getElementById('markAllReadBtn').addEventListener('click', async () => {
        await fetch('/api/notifications/mark-read', { method: 'PUT' });
        allNotifications.forEach(n => n.read = true);
        updateUnreadBanner();
        document.querySelectorAll('.notif-item.unread').forEach(el => {
            el.classList.remove('unread');
            el.querySelector('.unread-pip')?.remove();
        });
    });

    document.getElementById('clearAllBtn').addEventListener('click', async () => {
        if (!confirm('Clear all notifications?')) return;
        await fetch('/api/notifications', { method: 'DELETE' });
        allNotifications = [];
        document.getElementById('notif-list').innerHTML = '';
        updateUnreadBanner();
        updateStats();
        checkEmpty(true);
    });

    // Search
    function initSearch() {
        const searchInput   = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        let timer;

        searchInput.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            const query = searchInput.value.trim();
            if (!query) return;
            searchResults.style.display = 'none';
            window.location.href = `main timeline.html?q=${encodeURIComponent(query)}`;
        });

        searchInput.addEventListener('keyup', () => {
            clearTimeout(timer);
            timer = setTimeout(async () => {
                const query = searchInput.value.trim();
                if (!query) { searchResults.innerHTML = ''; searchResults.style.display = 'none'; return; }
                try {
                    const res    = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    const result = await res.json();
                    searchResults.innerHTML = '';
                    if (!result.success) return;
                    result.data.users.forEach(user => {
                        const d = document.createElement('div');
                        d.className = 'search-user';
                        d.innerHTML = `<img src="${user.profilePic || '../assets/defaultuser.png'}" width="30"><span>${user.username}</span>`;
                        d.addEventListener('click', () => { window.location.href = `/UserPage.html?userId=${user._id}`; });
                        searchResults.appendChild(d);
                    });
                    if (!result.data.users.length) searchResults.innerHTML = "<div class='no-results'>No users found</div>";
                    searchResults.style.display = 'block';
                } catch (err) { console.error('Search error:', err); }
            }, 300);
        });
    }

    // Boot — both run independently 
    loadProfile();
    loadNotifications();

    // Fallback: if fetch never completed after 3s, clear skeletons
    setTimeout(() => {
        if (!notificationsLoaded) {
            ['sk1', 'sk2', 'sk3'].forEach(id => document.getElementById(id)?.remove());
            checkEmpty(true);
        }
    }, 3000);