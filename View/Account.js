// for testing
console.log("Account.js loaded - login function ready");

// ===== REGISTER FUNCTION =====
function register(event) {
    event.preventDefault();
    
    // Get form values
    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;
    const birthday = document.querySelector('input[type="date"]').value;
    const username = document.querySelector('input[placeholder="Username"]').value;
    
    // Simple validation
    if (!email || !password || !birthday || !username) {
        alert("Please fill in all fields!");
        return;
    }
    
    // Send to server
    fetch('/api/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            password: password,
            birthday: birthday,
            username: username
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Account created successfully! Please login.");
            window.location.href = "Login-Page.html";
        } else {
            alert("Error: " + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Failed to create account. Please try again.");
    });
}

// ===== LOGIN FUNCTION =====
function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log("Username entered:", username);
    
    if (!username || !password) {
        alert("Please enter username and password!");
        return;
    }
    
    fetch('/api/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => {
        console.log("Response status:", response.status);
        return response.json();
    })
    .then(data => {
        console.log("Login response data:", data);
        if (data.success) {
            console.log("Login successful, redirecting...");
            alert("Login successful!");
            window.location.href = "UserPage.html";
        } else {
            console.log("Login failed:", data.error);
            alert("Error: " + data.error);
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        alert("Login failed. Please try again.");
    });
}

// ===== CHECK IF USER IS LOGGED IN =====
// This now checks with server instead of localStorage
function getCurrentUser(callback) {
    fetch('/api/me', {
        method: 'GET',
        credentials: 'include'  // sends cookies
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.currentUser = data.data;
            if (callback) callback();
        } else {
            window.location.href = "Login-Page.html";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        window.location.href = "Login-Page.html";
    });
}

// ===== LOGOUT =====
function logoutUser() {
    fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(() => {
        window.location.href = "Home-Page.html";
    });
}