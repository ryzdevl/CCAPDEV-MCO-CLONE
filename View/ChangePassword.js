function validatePasswordForm(event) {
    event.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please log in first!');
        window.location.href = '/Login-Page.html';
        return;
    }

    const currentPassword = $('#currentPassword').val();
    const newPassword = $('#newPassword').val();
    const confirmPassword = $('#confirmPassword').val();

    // Validate
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all fields!');
        return;
    }

    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters!');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    if (currentPassword === newPassword) {
        alert('New password must be different from current password!');
        return;
    }

    // Send to server
    $.ajax({
        url: `/api/users/${currentUser._id}/change-password`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword
        }),
        success: function(response) {
            if (response.success) {
                alert('Password changed successfully!');
                window.location.href = '/Profile Settings Page.html';
            } else {
                alert('Error: ' + response.error);
            }
        },
        error: function(xhr) {
            alert(xhr.responseJSON?.error || 'Failed to change password');
        }
    });
}