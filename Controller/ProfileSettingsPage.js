document.addEventListener('DOMContentLoaded', function() {
    // Notification toggle
    const notifToggle = document.querySelector('.switch input');
    if (notifToggle) {
        const notifEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
        notifToggle.checked = notifEnabled;
        
        notifToggle.addEventListener('change', function() {
            localStorage.setItem('notificationsEnabled', this.checked);
            alert(this.checked ? 'Notifications enabled!' : 'Notifications disabled!');
        });
    }
    
    // Custom checkboxes for notification preferences
    const checkboxes = document.querySelectorAll('.custom-checkbox input');
    checkboxes.forEach((checkbox, index) => {
        const key = `notifPref_${index}`;
        checkbox.checked = localStorage.getItem(key) !== 'false';
        checkbox.addEventListener('change', function() {
            localStorage.setItem(key, this.checked);
        });
    });
    
    // Logout function
    window.logoutMessage = function() {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('notificationsEnabled');
            alert('Successfully logged out');
            window.location.href = 'Login-Page.html';
        }
    };
    
    // Attach logout to button if exists
    const logoutBtn = document.querySelector('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.logoutMessage();
        });
    }
});