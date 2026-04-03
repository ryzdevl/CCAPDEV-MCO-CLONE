// This is for account registration and login

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
            // Redirect to login page
            window.location.href = "/Login-Page.html";
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
    
    // Get form values
    const username = document.querySelector('input[placeholder="Username"]').value;
    const password = document.querySelector('input[type="password"]').value;
    
    if (!username || !password) {
        alert("Please enter username and password!");
        return;
    }
    
    // Send to server
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
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Save user data to session/local storage
            localStorage.setItem('currentUser', JSON.stringify(data.data));
            
            alert("Login successful!");
            // Redirect to home page or user page
            window.location.href = "/UserPage.html";
        } else {
            alert("Error: " + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Login failed. Please try again.");
    });
}

// ===== CHECK IF USER IS LOGGED IN =====
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        return JSON.parse(userStr);
    }
    return null;
}

// ===== LOGOUT =====
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = "/Home-Page.html";
}
