$(document).ready(function() {
    
    // Check if user is logged in
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
        alert("Please log in first!");
        window.location.href = "Login-Page.html";
        return;
    }
    
    const currentUser = JSON.parse(storedUser);
    console.log("Editing profile for:", currentUser);
    
    // ===== LOAD CURRENT USER DATA INTO FORM =====
    function loadUserData() {
        // You can pre-fill form fields with current user data if needed
        // This would require a GET /api/users/:id endpoint
        $.ajax({
            url: '/api/users/' + currentUser._id,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    const user = response.data;
                    // Pre-fill form fields if they exist
                    $('input[name="newdisplayname"]').val(user.displayName || '');
                    $('input[name="newbio"]').val(user.bio || '');
                    $('input[name="firstname"]').val(user.firstName || '');
                    $('input[name="lastname"]').val(user.lastName || '');
                    
                    // Update preview images
                    if (user.profilePic) {
                        $('#profilePreview').attr('src', user.profilePic);
                    }
                    if (user.coverPic) {
                        $('#coverPreview').attr('src', user.coverPic);
                    }
                }
            }
        });
    }
    
    // ===== SAVE PROFILE CHANGES =====
    $('.setting a.btn:contains("Save Changes")').click(function(e) {
        e.preventDefault();
        
        // Collect all form data
        const updateData = {
            displayName: $('input[name="newdisplayname"]').val(),
            bio: $('input[name="newbio"]').val(),
            tags: $('input[name="newbio"]').val(), // You might want a separate field for tags
            location: $('input[name="newdisplayname"]').val(), // Second "newdisplayname" field
            website: $('input[name="website"]').val(),
            firstName: $('input[name="firstname"]').val(),
            lastName: $('input[name="lastname"]').val(),
            showFullName: $('input[name="displayname"]').is(':checked')
        };
        
        // Remove empty fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === '') delete updateData[key];
        });
        
        console.log("Saving profile updates:", updateData);
        
        // Send to server
        $.ajax({
            url: '/api/users/' + currentUser._id,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updateData),
            success: function(response) {
                if (response.success) {
                    // Update localStorage with new user data
                    const updatedUser = { ...currentUser, ...response.data };
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    
                    alert("Profile updated successfully!");
                    
                    // Optionally redirect back to user page
                    // window.location.href = "UserPage.html";
                } else {
                    alert("Error: " + response.error);
                }
            },
            error: function(error) {
                console.error('Error updating profile:', error);
                alert("Failed to update profile. Please try again.");
            }
        });
    });
    
    // ===== PROFILE PICTURE UPLOAD =====
    $('#profilePic').change(function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Preview image
        const reader = new FileReader();
        reader.onload = function(e) {
            $('#profilePreview').attr('src', e.target.result);
        };
        reader.readAsDataURL(file);
        
        // Upload to server
        const formData = new FormData();
        formData.append('profilePic', file);
        
        $.ajax({
            url: '/api/users/' + currentUser._id + '/profile-pic',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    // Update localStorage with new profile pic
                    currentUser.profilePic = response.profilePic;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    alert("Profile picture updated!");
                } else {
                    alert("Error: " + response.error);
                }
            },
            error: function(error) {
                console.error('Error uploading profile pic:', error);
                alert("Failed to upload image.");
            }
        });
    });
    
    // ===== COVER PICTURE UPLOAD =====
    $('#coverPic').change(function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Preview image
        const reader = new FileReader();
        reader.onload = function(e) {
            $('#coverPreview').attr('src', e.target.result);
        };
        reader.readAsDataURL(file);
        
        // Upload to server
        const formData = new FormData();
        formData.append('coverPic', file);
        
        $.ajax({
            url: '/api/users/' + currentUser._id + '/cover-pic',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    // Update localStorage with new cover pic
                    currentUser.coverPic = response.coverPic;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    alert("Cover picture updated!");
                } else {
                    alert("Error: " + response.error);
                }
            },
            error: function(error) {
                console.error('Error uploading cover pic:', error);
                alert("Failed to upload image.");
            }
        });
    });
    
    // ===== GO BACK BUTTON =====
    $('.btn.back:first').click(function(e) {
        e.preventDefault();
        window.history.back();
    });
    
    // Load existing user data (optional)
    // loadUserData();
});