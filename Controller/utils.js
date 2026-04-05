function getCurrentUser(callback) {
    console.log("getCurrentUser: calling /api/me");
    $.ajax({
        url: '/api/me',
        method: 'GET',
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            console.log("getCurrentUser success:", response);
            if (response.success) {
                window.currentUser = response.data;
                if (callback) callback();
            } else {
                console.log("getCurrentUser: response not successful");
                window.location.href = 'Login-Page.html';
            }
        },
        error: function(xhr, status, error) {
            console.log("getCurrentUser error:", xhr.status, error);
            window.location.href = 'Login-Page.html';
        }
    });
}