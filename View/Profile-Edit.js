// View/js/Profile-Edit.js
$(document).ready(function() {

    // Get current user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    let currentUser = null;
    
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        console.log("Edit profile for:", currentUser);
        loadUserData(currentUser._id);
    } else {
        alert("Please log in first!");
        return;
    }
    
    // Load current user data into form
    function loadUserData(userId) {
        $.ajax({
            url: '/api/users/' + userId,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data && response.data.user) {
                    const user = response.data.user;
                    
                    // Populate display name
                    if (user.displayName) {
                        $('input[name="displayname"]').val(user.displayName);
                    } else {
                        $('input[name="displayname"]').val('');
                    }
                    
                    // Populate username with @ - FIXED: Added username field
                    if (user.username) {
                        $('input[name="username"]').val('@' + user.username);
                    } else {
                        $('input[name="username"]').val('@username');
                    }
                    
                    // Populate bio
                    if (user.bio) {
                        $('textarea[name="bio"]').val(user.bio);
                    } else {
                        $('textarea[name="bio"]').val('');
                    }
                    
                    // Populate location
                    if (user.location) {
                        $('input[name="location"]').val(user.location);
                    } else {
                        $('input[name="location"]').val('');
                    }
                    
                    // Populate tags
                    if (user.tags && user.tags.length > 0) {
                        $('input[name="tags"]').val(user.tags.join(', '));
                    } else {
                        $('input[name="tags"]').val('');
                    }
                    
                    // Populate website
                    if (user.website) {
                        $('input[name="website"]').val(user.website);
                    } else {
                        $('input[name="website"]').val('');
                    }
                    
                    // Update profile picture preview
                    if (user.profilePic) {
                        $('#profilePreview').attr('src', user.profilePic);
                    }
                    
                    // Update cover picture preview - FIXED: Added cover pic loading
                    if (user.coverPic) {
                        $('#coverPreview').attr('src', user.coverPic);
                    }
                    
                    // Load existing contact links
                    if (user.contactLinks && user.contactLinks.length > 0) {
                        $('#contact-links-container').empty();
                        for (var i = 0; i < user.contactLinks.length; i++) {
                            var link = user.contactLinks[i];
                            var linkHtml = `
                                <div class="contact-link-item" style="margin-bottom: 10px;">
                                    <input type="text" name="contact-platform[]" placeholder="Platform (e.g. Discord, GitHub)" value="${link.platform}" style="width: 40%; margin-right: 5px;">
                                    <input type="url" name="contact-url[]" placeholder="URL (https://...)" value="${link.url}" style="width: 50%; margin-right: 5px;">
                                    <button type="button" class="remove-link" style="width: 30px; height: 30px; border-radius: 50%; background: #ff4444; color: white; border: none; cursor: pointer;">×</button>
                                </div>
                            `;
                            $('#contact-links-container').append(linkHtml);
                        }
                    }
                }
            },
            error: function(error) {
                console.error('Error loading user data:', error);
            }
        });
    }
    
    // actual replacement of profile picture
    $('#profilePic').change(function() {
        var file = this.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                $('#profilePreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
            
            // Upload to server
            uploadProfilePic(file);
        }
    });

    // actual replacement of profile picture
    function uploadProfilePic(file) {
        var formData = new FormData();
        formData.append('profilePic', file);
        
        $.ajax({
            url: '/api/users/' + currentUser._id + '/profile-pic',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    // Update currentUser in localStorage
                    if (response.profilePic) {
                        currentUser.profilePic = response.profilePic;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    }
                    
                    // Update parent page if possible
                    if (window.parent) {
                        if (window.parent.updateProfile) {
                            window.parent.updateProfile();
                        }
                    }
                    
                    alert('Profile picture updated!');
                }
            },
            error: function(error) {
                console.error('Error uploading profile pic:', error);
                alert('Failed to upload profile picture');
            }
        });
    }
    
    // cover photo upload preview - FIXED: Added cover photo update
    $('#coverPic').change(function() {
        var file = this.files[0];
        if (file) {
            // Preview
            var reader = new FileReader();
            reader.onload = function(e) {
                $('#coverPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
            
            // Upload to server
            uploadCoverPic(file);
        }
    });
    
    // cover photo upload real
    function uploadCoverPic(file) {
        var formData = new FormData();
        formData.append('coverPic', file);
        
        $.ajax({
            url: '/api/users/' + currentUser._id + '/cover-pic',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    // Update currentUser in localStorage - FIXED: Added this
                    if (response.coverPic) {
                        currentUser.coverPic = response.coverPic;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    }
                    
                    // Update parent page if possible - FIXED: Added this
                    if (window.parent) {
                        if (window.parent.updateProfile) {
                            window.parent.updateProfile();
                        }
                    }
                    
                    alert('Cover photo updated!');
                }
            },
            error: function(error) {
                console.error('Error uploading cover pic:', error);
                alert('Failed to upload cover photo');
            }
        });
    }
    
    // Add contact link
    $('#add-contact-link').click(function() {
        var linkHtml = `
            <div class="contact-link-item" style="margin-bottom: 10px;">
                <input type="text" name="contact-platform[]" placeholder="Platform (e.g. Discord, GitHub)" style="width: 40%; margin-right: 5px;">
                <input type="url" name="contact-url[]" placeholder="URL (https://...)" style="width: 50%; margin-right: 5px;">
                <button type="button" class="remove-link" style="width: 30px; height: 30px; border-radius: 50%; background: #ff4444; color: white; border: none; cursor: pointer;">×</button>
            </div>
        `;
        $('#contact-links-container').append(linkHtml);
    });
    
    // remove contact link 
    $(document).on('click', '.remove-link', function() {
        $(this).closest('.contact-link-item').remove();
    });
    
    // save all profile changes
    $('#save-profile-btn').click(function(e) {
        e.preventDefault();
        
        var displayName = $('input[name="displayname"]').val();
        var username = $('input[name="username"]').val(); // FIXED: Added username
        var bio = $('textarea[name="bio"]').val();
        var location = $('input[name="location"]').val();
        var website = $('input[name="website"]').val();
        var tagsInput = $('input[name="tags"]').val();
        
        var formData = {};
        
        if (displayName) {
            formData.displayName = displayName;
        }
        
        // FIXED: Added username handling
        if (username) {
            // Remove @ if present
            if (username.startsWith('@')) {
                formData.username = username.substring(1);
            } else {
                formData.username = username;
            }
        }
        
        if (bio) {
            formData.bio = bio;
        }
        
        if (location) {
            formData.location = location;
        }
        
        if (website) {
            formData.website = website;
        }
        
        // Handle tags
        if (tagsInput) {
            var tagsArray = tagsInput.split(',');
            var cleanedTags = [];
            
            for (var i = 0; i < tagsArray.length; i++) {
                var tag = tagsArray[i].trim();
                if (tag) {
                    // Remove # if present
                    if (tag.startsWith('#')) {
                        tag = tag.substring(1);
                    }
                    if (tag) {
                        cleanedTags.push(tag);
                    }
                }
            }
            
            if (cleanedTags.length > 0) {
                formData.tags = cleanedTags;
            }
        }
        
        // collect ALL contact links from the form
        var contactLinks = [];
        var platforms = $('input[name="contact-platform[]"]');
        var urls = $('input[name="contact-url[]"]');
        
        for (var i = 0; i < platforms.length; i++) {
            var platform = $(platforms[i]).val().trim();
            var url = $(urls[i]).val().trim();
            
            if (platform && url) {
                contactLinks.push({
                    platform: platform,
                    url: url
                });
            }
        }
        
        // ONLY send contactLinks if there are any in the form
        if (contactLinks.length > 0) {
            formData.contactLinks = contactLinks;
        }
        // If no contact links in form, DON'T send the field at all
        // This preserves existing ones on the server
        
        $.ajax({
            url: '/api/users/' + currentUser._id,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    // Update localStorage with new values
                    if (formData.displayName) {
                        currentUser.displayName = formData.displayName;
                    }
                    
                    // FIXED: Added username update
                    if (formData.username) {
                        currentUser.username = formData.username;
                    }
                    
                    if (formData.bio) {
                        currentUser.bio = formData.bio;
                    }
                    
                    if (formData.location) {
                        currentUser.location = formData.location;
                    }
                    
                    if (formData.website) {
                        currentUser.website = formData.website;
                    }
                    
                    if (formData.tags) {
                        currentUser.tags = formData.tags;
                    }
                    
                    if (formData.contactLinks) {
                        currentUser.contactLinks = formData.contactLinks;
                    }
                    
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    alert('Profile updated successfully!');
                    
                    // Close modal and refresh parent
                    if (window.parent) {
                        window.parent.$("#profile-settings-modal").fadeOut(300);
                        
                        // reload entire site with changes
                        if (window.parent.updateProfile) {
                            window.parent.updateProfile();
                        }
                        
                        // reload post data
                        if (window.parent.refreshPosts) {
                            window.parent.refreshPosts();
                        }

                        window.parent.location.reload();
                    }
                }
            },
            error: function(error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile');
            }
        });
    });
    
    // Add Tag button
    $('.addbtn').click(function() {
        if ($(this).attr('id') !== 'add-contact-link') {
            alert('Type tags in the input field separated by commas');
        }
    });
    
    // Clear button
    $("#clearChanges").click(function() {
        if (confirm("Discard all changes?")) {
            loadUserData(currentUser._id);
        }
    });
});