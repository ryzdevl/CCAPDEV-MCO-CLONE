$(document).ready(function() {
    getCurrentUser(function() {
        let currentUser = window.currentUser;
        console.log("Edit profile for:", currentUser);

        let currentTags = [];

        function renderTags() {
            $('#tags-container').empty();
            currentTags.forEach(function(tag, index) {
                $('#tags-container').append(`
                    <span style="background:var(--tertiary); color:var(--main); padding:4px 10px; border-radius:20px; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
                        #${tag}
                        <span class="remove-tag" data-index="${index}" style="cursor:pointer; font-weight:bold; font-size:15px; line-height:1;">&times;</span>
                    </span>
                `);
            });
        }

        $('#add-tag-btn').click(function() {
            let val = $('#tag-input').val().trim().replace(/^#+/, '');
            if (!val) return;
            if (currentTags.includes(val)) {
                alert('Tag already added!');
                return;
            }
            currentTags.push(val);
            renderTags();
            $('#tag-input').val('').focus();
        });

        $(document).on('click', '.remove-tag', function() {
            currentTags.splice($(this).data('index'), 1);
            renderTags();
        });

        loadUserData(currentUser._id);
        
        function loadUserData(userId) {
            $.ajax({
                url: '/api/users/' + userId,
                method: 'GET',
                success: function(response) {
                    if (response.success && response.data) {
                        const user = response.data;
                        
                        if (user.coverPic) currentUser.coverPic = user.coverPic;
                        if (user.profilePic) currentUser.profilePic = user.profilePic;
                        
                        $('input[name="displayname"]').val(user.displayName || '');
                        $('input[name="username"]').val('@' + (user.username || 'username'));
                        $('textarea[name="bio"]').val(user.bio || '');
                        $('input[name="location"]').val(user.location || '');
                        $('input[name="website"]').val(user.website || '');
                        
                        currentTags = user.tags || [];
                        renderTags();
                        
                        if (user.profilePic) {
                            $('#profilePreview').attr('src', user.profilePic);
                        }
                        
                        if (user.coverPic) {
                            $('#coverPreview').attr('src', user.coverPic);
                        }
                        
                        if (user.contactLinks && user.contactLinks.length > 0) {
                            $('#contact-links-container').empty();
                            for (var i = 0; i < user.contactLinks.length; i++) {
                                var link = user.contactLinks[i];
                                var linkHtml = `
                                    <div class="contact-link-item" style="margin-bottom: 10px;">
                                        <input type="text" name="contact-platform[]" placeholder="Platform" value="${link.platform}" style="width: 40%; margin-right: 5px;">
                                        <input type="url" name="contact-url[]" placeholder="URL" value="${link.url}" style="width: 50%; margin-right: 5px;">
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
        
        $('#profilePic').change(function() {
            var file = this.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    $('#profilePreview').attr('src', e.target.result);
                };
                reader.readAsDataURL(file);
                uploadProfilePic(file);
            }
        });

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
                        currentUser.profilePic = response.profilePic;
                        if (window.parent) {
                            window.parent.$('#profile-img').attr('src', response.profilePic);
                            if (window.parent.currentUser) {
                                window.parent.currentUser.profilePic = response.profilePic;
                            }
                        }
                    }
                },
                error: function(error) {
                    console.error('Error uploading profile pic:', error);
                    alert('Failed to upload profile picture');
                }
            });
        }
        
        $('#coverPic').change(function() {
            var file = this.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    $('#coverPreview').attr('src', e.target.result);
                };
                reader.readAsDataURL(file);
                uploadCoverPic(file);
            }
        });
        
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
                        currentUser.coverPic = response.coverPic;
                        window.parent.postMessage({
                            type: 'coverPhotoUpdated',
                            coverPic: response.coverPic
                        }, '*');
                    }
                },
                error: function(error) {
                    console.error('Error uploading cover pic:', error);
                    alert('Failed to upload cover photo');
                }
            });
        }
        
        $('#add-contact-link').click(function() {
            var linkHtml = `
                <div class="contact-link-item" style="margin-bottom: 10px;">
                    <input type="text" name="contact-platform[]" placeholder="Platform" style="width: 40%; margin-right: 5px;">
                    <input type="url" name="contact-url[]" placeholder="URL" style="width: 50%; margin-right: 5px;">
                    <button type="button" class="remove-link" style="width: 30px; height: 30px; border-radius: 50%; background: #ff4444; color: white; border: none; cursor: pointer;">×</button>
                </div>
            `;
            $('#contact-links-container').append(linkHtml);
        });
        
        $(document).on('click', '.remove-link', function() {
            $(this).closest('.contact-link-item').remove();
        });
        
        $('#save-profile-btn').click(function(e) {
            e.preventDefault();
            
            console.log('currentUser.coverPic at save time:', currentUser.coverPic);
            console.log('currentUser.profilePic at save time:', currentUser.profilePic);

            var displayName = $('input[name="displayname"]').val();
            var username = $('input[name="username"]').val();
            var bio = $('textarea[name="bio"]').val();
            var location = $('input[name="location"]').val();
            var website = $('input[name="website"]').val();
            
            var formData = {};
            
            if (displayName) formData.displayName = displayName;
            if (username) {
                if (username.startsWith('@')) {
                    formData.username = username.substring(1);
                } else {
                    formData.username = username;
                }
            }
            if (bio) formData.bio = bio;
            if (location) formData.location = location;
            if (website) formData.website = website;
            if (currentUser.coverPic) formData.coverPic = currentUser.coverPic;
            if (currentUser.profilePic) formData.profilePic = currentUser.profilePic;
            
            if (currentTags.length > 0) formData.tags = currentTags;
            
            var contactLinks = [];
            var platforms = $('input[name="contact-platform[]"]');
            var urls = $('input[name="contact-url[]"]');
            
            for (var i = 0; i < platforms.length; i++) {
                var platform = $(platforms[i]).val().trim();
                var url = $(urls[i]).val().trim();
                if (platform && url) {
                    contactLinks.push({ platform: platform, url: url });
                }
            }
            
            if (contactLinks.length > 0) formData.contactLinks = contactLinks;
            
            $.ajax({
                url: '/api/users/' + currentUser._id,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function(response) {
                     if (response.success) {
                        const updatedUser = response.data;
                        updatedUser.tags = currentTags; // always force it
                        window.parent.postMessage({
                            type: 'profileUpdated',
                            user: updatedUser
                        }, '*');
                    }
                },
                error: function(error) {
                    console.error('Error updating profile:', error);
                    alert('Failed to update profile');
                }
            });
        });
        
        $('.addbtn').click(function() {
            if ($(this).attr('id') !== 'add-contact-link' && $(this).attr('id') !== 'add-tag-btn') {
                alert('Type tags in the input field separated by commas');
            }
        });
        
        $("#clearChanges").click(function() {
            if (confirm("Discard all changes?")) {
                loadUserData(currentUser._id);
            }
        });
    });
});