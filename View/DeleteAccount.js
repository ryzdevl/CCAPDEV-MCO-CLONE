function deleteAccount(event) {
    event.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please log in first!');
        window.location.href = '/Login-Page.html';
        return;
    }

    const password = $('#deletePassword').val();
    const confirmed = $('#confirmCheck').prop('checked');

    if (!password) {
        alert('Please enter your password!');
        return;
    }

    if (!confirmed) {
        alert('Please confirm you understand this action is permanent!');
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
                // Clear localStorage
                localStorage.removeItem('currentUser');
                alert('Your account has been deleted. We\'re sorry to see you go!');
                window.location.href = '/Home-Page.html';
            } else {
                alert('Error: ' + response.error);
            }
        },
        error: function(xhr) {
            alert(xhr.responseJSON?.error || 'Failed to delete account');
        }
    });
}