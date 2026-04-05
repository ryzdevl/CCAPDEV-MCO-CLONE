$(document).ready(function () {
    getCurrentUser(function() {
        // Get userId from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const galleryUserId = urlParams.get('userId') || window.currentUser._id;
        console.log('Gallery for user ID:', galleryUserId);

        // Store the gallery user data
        let galleryUser = null;

        // Load the gallery user's profile data first
        loadGalleryUserProfile();

        function loadGalleryUserProfile() {
            $.ajax({
                url: `/api/users/${galleryUserId}`,
                method: 'GET',
                success: function(response) {
                    if (response.success && response.data) {
                        galleryUser = response.data;
                        updateProfile(galleryUser);
                        loadGallery();
                    } else {
                        console.error('Failed to load user profile');
                    }
                },
                error: function(error) {
                    console.error('Error loading user profile:', error);
                }
            });
        }
        
        // Listen for cover photo updates from profile edit
        window.addEventListener('message', function(event) {
            if (event.data.type === 'coverPhotoUpdated') {
                console.log('Cover photo update received:', event.data.coverPic);
                $('.gallerycard').css('background-image', 
                    'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("' + event.data.coverPic + '")'
                );
                if (galleryUser) {
                    galleryUser.coverPic = event.data.coverPic;
                }
            }
        });


        // Hide upload button if viewing someone else's gallery
        if (galleryUserId !== window.currentUser._id) {
            $('#uploadgalleryimg').hide();
        }
        
        // step 1 — button opens file picker
        $('#uploadgalleryimg').click(function () {
            $('#fileInput').click();
        });

        // step 2 — file selected, show title input
        $('#fileInput').change(function (e) {
            const file = e.target.files[0];
            if (!file) return;
            $('#upload-form').show(); 
        });

        // step 3 — confirm button clicked, now upload with title
        $('#confirmUpload').click(function () {
            const file = $('#fileInput')[0].files[0];
            const title = $('#imageTitle').val().trim() || 'Untitled';
            if (!file) return;

            const formData = new FormData();
            formData.append('galleryPic', file);
            formData.append('title', title); 

            $.ajax({
                url: '/api/users/' + galleryUserId + '/gallery-pic',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    console.log('Server response:', response);
                    if (response.success) {
                        appendImageToGallery(response.galleryPic, response.title); 
                        $('#upload-form').hide();
                        $('#imageTitle').val('');
                        $('#fileInput').val('');
                    } else {
                        alert('Error: ' + response.error);
                    }
                },
                error: function (xhr) {
                    console.log('Upload failed:', xhr.status, xhr.responseText);
                    alert('Failed to upload image.');
                }
            });
        });

        // cancel button — hide form and reset
        $('#cancelUpload').click(function () {
            $('#upload-form').hide();
            $('#imageTitle').val('');
            $('#fileInput').val('');
        });

        // Update profile with the gallery user's data (NOT current user)
        function updateProfile(user) {
            $('#gallery-dn').text(user.displayName || user.username);
            $('#gallery-un').text('@' + user.username);
            $('#gallery-img').attr('src', user.profilePic || '/assets/defaultuser.jpg');
            $('#gallery-bio').text(user.bio || 'This is my user bio!!!!');
            
            // Update tags
            const tagsList = $('#gallery-tags');
            tagsList.empty();
            if (user.tags && user.tags.length > 0) {
                let tagsText = '';
                user.tags.forEach(tag => {
                    tagsText += '#' + tag + ' ';
                });
                tagsList.text(tagsText);
            } else {
                tagsList.text('#NewUser');
            }

            if (user.coverPic) {
                $('.gallerycard').css('background-image', 
                    'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("' + user.coverPic + '")'
                );
            } else {
                $('.gallerycard').css('background-image', 
                    'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("../assets/defaultcover.jpg")'
                );
            }
        }

        // load existing gallery images on page load
        function loadGallery() {
            $.get('/api/users/' + galleryUserId + '/gallery', function (response) {
                if (response.success) {
                    response.gallery.forEach(function (item) {
                        appendImageToGallery(item.path, item.title); 
                    });
                }
            });
        }

        // appends a single image card into .galleryimg
        function appendImageToGallery(imgPath, title) {
            const today = new Date();
            const date = today.toLocaleDateString('en-GB').replaceAll('/', ' | ');

            const newItem = `
                <div class="gallery-item">
                    <img src="${imgPath}" onclick="openLightbox('${imgPath}')">
                    <p class="artwork-title">"${title || 'Untitled'}"</p>
                    <p class="date">${date}</p>
                </div>
            `;
            $(newItem).appendTo('.galleryimg');
        }

        // open lightbox and store current image path
        let currentLightboxImg = null;

        window.openLightbox = function (imgPath) {
            console.log('openLightbox called with:', imgPath);
            currentLightboxImg = imgPath;

            const img = new Image();
            img.src = imgPath;

            img.onload = function () {
                $('#lightbox-img').attr('src', imgPath);
                $('#lightbox-dimensions').text(img.naturalWidth + ' x ' + img.naturalHeight + ' px');
                
                // Only show delete button if viewing own gallery
                if (galleryUserId === window.currentUser._id) {
                    $('#lightbox-delete-btn').show();
                } else {
                    $('#lightbox-delete-btn').hide();
                }
                
                $('#lightbox-confirm-delete').hide();
                $('#lightbox').addClass('active');
            };

            img.onerror = function () {
                console.log('Image failed to load:', imgPath);
            };
        };

        window.closeLightbox = function () {
            $('#lightbox').removeClass('active');
            $('#lightbox-img').attr('src', '');
            $('#lightbox-dimensions').text('');
            $('#lightbox-confirm-delete').hide();
            currentLightboxImg = null;
        };

        window.promptDelete = function () {
            $('#lightbox-confirm-delete').show();
        };

        window.confirmDelete = function () {
            if (!currentLightboxImg) return;

            $.ajax({
                url: '/api/users/' + galleryUserId + '/gallery-pic',
                method: 'DELETE',
                contentType: 'application/json',
                data: JSON.stringify({ imgPath: currentLightboxImg }),
                success: function (response) {
                    if (response.success) {
                        $('.gallery-item img[src="' + currentLightboxImg + '"]')
                            .closest('.gallery-item')
                            .remove();
                        closeLightbox();
                    } else {
                        alert('Error: ' + response.error);
                    }
                },
                error: function () {
                    alert('Failed to delete image.');
                }
            });
        };

        window.cancelDelete = function () {
            $('#lightbox-confirm-delete').hide();
        };
    });
});