function validateDeleteForm(event) {
    event.preventDefault();

    const reason = $('#confirmdelete').val().trim();
    const password = $('#password').val();
    const confirmPassword = $('#passwordconfirm').val();

    // Validate
    if (!reason || !password || !confirmPassword) {
        alert('Please fill in all fields!');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    // Extra confirmation
    if (!confirm('Are you absolutely sure you want to delete your account? This cannot be undone!')) {
        return;
    }

    $.ajax({
        url: `/api/users/${currentUser._id}/delete-account`,
        method: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify({ password: password }),
        success: function(response) {
            if (response.success) {
                // Clear localStorage and cookie
                localStorage.removeItem('currentUser');
                // Show popup then redirect
                $('#popup').show();
            } else {
                alert('Error: ' + response.error);
            }
        },
        error: function(xhr) {
            alert(xhr.responseJSON?.error || 'Failed to delete account. Please check your password.');
        }
    });
}

// When user clicks OK on the popup, redirect to home
function closePopup() {
    window.location.href = '/View/LandingPage.html';
}
