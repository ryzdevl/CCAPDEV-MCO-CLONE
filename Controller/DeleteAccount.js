function validateDeleteForm(event) {
    event.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const reason = $('#confirmdelete').val().trim();
    const password = $('#password').val();
    const confirmPassword = $('#passwordconfirm').val();

    if (!reason || !password || !confirmPassword) {
        alert('Please fill in all fields!');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    if (!confirm('Are you absolutely sure you want to delete your account? This cannot be undone!')) {
        return;
    }

    $.ajax({
        url: '/api/me',
        method: 'GET',
        xhrFields: { withCredentials: true },
        success: function(response) {
            if (!response.success) {
                alert('Session expired. Please log in again.');
                window.location.href = '/View/LandingPage.html';
                return;
            }

            const userId = response.data._id;

            $.ajax({
                url: `/api/users/${userId}/delete-account`,
                method: 'DELETE',
                contentType: 'application/json',
                xhrFields: { withCredentials: true },
                data: JSON.stringify({ password: password }),
                success: function(res) {
                    if (res.success) {
                        localStorage.removeItem('currentUser');
                        $('#popup').show();
                    } else {
                        alert('Error: ' + res.error);
                    }
                },
                error: function(xhr) {
                    console.error('Delete error:', xhr.status, xhr.responseText);
                    alert(xhr.responseJSON?.error || 'Failed to delete account. Please check your password.');
                }
            });
        },                                       
        error: function() {                       
            alert('Session expired. Please log in again.');
            window.location.href = '/View/LandingPage.html';
        }
    });                                            
}

function closePopup() {
    window.location.href = '/View/LandingPage.html';
}