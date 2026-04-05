$(document).ready(function() {
    getCurrentUser(function() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewedUserId = urlParams.get('userId');
        const isOwnProfile = !viewedUserId || viewedUserId === window.currentUser._id;
        
        if (!isOwnProfile) {
            console.log("Viewing other user's profile:", viewedUserId);
            loadOtherUserProfile(viewedUserId);
        } else {
            console.log("Viewing own profile");
            loadMyProfile();
        }

        function loadMyProfile() {
            updateProfile(window.currentUser);
            
            $('#post-modal').show();
            $('#profile-settings').show();
            $('#toggle-contact').show();
            $('#follow-btn').hide();
            
            TLPostLayout.init().then(function(){
                console.log("TLPostLayout initialized, loading posts...");
                loadUserPosts();
            }).catch(function(error){
                console.error("Failed to initialize TLPostLayout:", error);
            });
        }

        function loadOtherUserProfile(userId) {
            if (!TLPostLayout.template) {
                TLPostLayout.init().then(function() {
                    loadOtherUserProfile(userId);
                });
                return;
            }
            
            $.ajax({
                url: `/api/users/${userId}`,
                method: 'GET',
                success: function(response) {
                    if (response.success && response.data) {
                        const otherUser = response.data;
                        window.viewedUser = otherUser;

                        const userPosts = otherUser.posts || [];

                        updateProfile(otherUser);
                        displayPosts(userPosts);
                        loadOtherUserHighlights(userId);
                        
                        $('#post-modal').hide();
                        $('#profile-settings').hide();
                        
                        setupFollowButton(otherUser);
                    } else {
                        console.error('Failed to load user:', response);
                        alert('User not found');
                        window.location.href = 'main timeline.html';
                    }
                },
                error: function(error) {
                    console.error('Error loading user:', error);
                    alert('Error loading user profile');
                    window.location.href = 'main timeline.html';
                }
            });
        }

        function loadOtherUserHighlights(userId) {
            $.ajax({
                url: `/api/users/${userId}/highlights`,
                method: 'GET',
                success: function(response) {
                    if (response.success) {
                        displayHighlights(response.data);
                    }
                },
                error: function(error) {
                    console.error('Error loading highlights:', error);
                }
            });
        }

        function setupFollowButton(otherUser) {
            const followBtn = $('#follow-btn');
            followBtn.show();
            
            if (!window.currentUser.following) {
                window.currentUser.following = [];
            }
            if (!window.currentUser.followers) {
                window.currentUser.followers = [];
            }
            
            const isFollowing = window.currentUser.following.includes(otherUser._id);
            
            followBtn.text(isFollowing ? 'Following' : 'Follow');
            if (isFollowing) {
                followBtn.addClass('following');
            } else {
                followBtn.removeClass('following');
            }
            
            followBtn.off('click').click(function(e) {
                e.preventDefault();
                
                $.ajax({
                    url: `/api/users/${otherUser._id}/follow`,
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ currentUserId: window.currentUser._id }),
                    success: function(response) {
                        if (response.success) {
                            if (!window.currentUser.following) {
                                window.currentUser.following = [];
                            }
                            
                            followBtn.text(response.following ? 'Following' : 'Follow');
                            if (response.following) {
                                followBtn.addClass('following');
                                if (!window.currentUser.following.includes(otherUser._id)) {
                                    window.currentUser.following.push(otherUser._id);
                                }
                            } else {
                                followBtn.removeClass('following');
                                window.currentUser.following = window.currentUser.following.filter(function(id) {
                                    return id !== otherUser._id;
                                });
                            }
                            
                            $('#followers-count').text(response.followerCount + ' Followers');
                            
                            if (isOwnProfile) {
                                var followingCount = window.currentUser.following.length;
                                var followersCount = window.currentUser.followers.length;
                                $('#profile-stats').html(
                                    '<span id="followers-count" style="cursor:pointer">' + followersCount + ' Followers</span> | ' +
                                    '<span id="following-count" style="cursor:pointer">' + followingCount + ' Following</span>'
                                );
                            } else if (window.viewedUser) {
                                if (response.following) {
                                    if (!window.viewedUser.followers) {
                                        window.viewedUser.followers = [];
                                    }
                                    if (!window.viewedUser.followers.includes(window.currentUser._id)) {
                                        window.viewedUser.followers.push(window.currentUser._id);
                                    }
                                } else {
                                    if (window.viewedUser.followers) {
                                        window.viewedUser.followers = window.viewedUser.followers.filter(function(id) {
                                            return id !== window.currentUser._id;
                                        });
                                    }
                                }
                                var followingCount = window.viewedUser.following ? window.viewedUser.following.length : 0;
                                $('#profile-stats').html(
                                    '<span id="followers-count" style="cursor:pointer">' + response.followerCount + ' Followers</span> | ' +
                                    '<span id="following-count" style="cursor:pointer">' + followingCount + ' Following</span>'
                                );
                            }
                        }
                    },
                    error: function(error) {
                        console.error('Follow error:', error);
                        alert('Failed to follow/unfollow');
                    }
                });
            });
        }

        function updateProfile(user){

            $('#profile-dn').text(user.displayName || user.username);
            $('#profile-uid').text('@' + user.username);
            $('#profile-img').attr('src', user.profilePic || '/assets/defaultuser.jpg');

            if (user.coverPic) {
                $('#user-part').css('background-image', 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("' + user.coverPic + '")');
            } else {
                $('#user-part').css('background-image', 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("../assets/defaultcover.jpg")');
            }

            const followersCount = user.followers?.length || 0;
            const followingCount = user.following?.length || 0;
            
            $('#profile-stats').html(`
                <span id="followers-count" style="cursor:pointer">${followersCount} Followers</span> |
                <span id="following-count" style="cursor:pointer">${followingCount} Following</span>
            `);
            
            const profileUserId = user._id;
            
            $('#followers-count').off('click').click(() => {
                $.get(`/api/users/${profileUserId}/list/followers`, (res) => {
                    if(res.success){
                        showUserListModal('Followers', res.users);
                    }
                });
            });

            $('#following-count').off('click').click(() => {
                $.get(`/api/users/${profileUserId}/list/following`, (res) => {
                    if(res.success){
                        showUserListModal('Following', res.users);
                    }
                });
            });
            
            $('#profile-bio').text(user.bio || 'This is my user bio!!!!');
            
            var contactList = $('.contact-links ul');
            if (contactList.length > 0) {
                contactList.empty();
                
                if (user.contactLinks && user.contactLinks.length > 0) {
                    for (var i = 0; i < user.contactLinks.length; i++) {
                        var link = user.contactLinks[i];
                        var listItem = '<li><a href="' + link.url + '" target="_blank">' + link.platform + '</a></li>';
                        contactList.append(listItem);
                    }
                } else {
                    contactList.append('<li>No contact links added yet</li>');
                }
            }
            
            var tagsList = $('.profile-hashtags');
            console.log('rendering tags: ', user.tags);
            if (tagsList.length > 0) {
                tagsList.empty();
                
                if (user.tags && user.tags.length > 0) {
                    for (var i = 0; i < user.tags.length; i++) {
                        var tag = user.tags[i];
                        tagsList.append('<li>#' + tag + '</li>');
                    }
                } else {
                    tagsList.append('<li>#NewUser</li>');
                }
            }
        }

        window.updateProfile = updateProfile;

        function showUserListModal(title, users) {
            const modal = $('#followers-modal');
            const list = $('#followers-list');

            $('#modal-title').text(title);
            list.empty();

            if (users && users.length > 0) {
                users.forEach(u => {
                    const li = $('<li>').text(`@${u.username}`).css('cursor', 'pointer');
                    li.click(() => {
                        window.location.href = `/UserPage.html?userId=${u._id}`;
                    });
                    list.append(li);
                });
            } else {
                list.append('<li>No users found</li>');
            }

            modal.fadeIn(200);
        }

        $(document).on('click', '.delete-post-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!window.currentUser) {
                alert('Please log in!');
                return;
            }
            
            const postId = $(this).data('postId');
            const $post = $(this).closest('.post');
            const postUserId = $post.data('userId');
            
            if (postUserId !== window.currentUser._id) {
                alert('You can only delete your own posts!');
                return;
            }
            
            if (!confirm('Delete this post? This cannot be undone.')) return;

            $.ajax({
                url: `/api/posts/${postId}`,
                method: 'DELETE',
                contentType: 'application/json',
                data: JSON.stringify({ userId: window.currentUser._id }),
                success: function(response) {
                    if (response.success) {
                        $post.fadeOut(300, function() { 
                            $(this).remove(); 
                            if (window.refreshHighlights) window.refreshHighlights();
                        });
                    } else {
                        alert(response.error || 'Could not delete post');
                    }
                },
                error: function(xhr) {
                    alert(xhr.responseJSON?.error || 'Failed to delete post');
                }
            });
        });

        $(document).on('click', '.edit-post-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!window.currentUser) {
                alert('Please log in!');
                return;
            }
            
            const postId = $(this).data('postId');
            const $post = $(this).closest('.post');
            const postUserId = $post.data('userId');
            
            if (postUserId !== window.currentUser._id) {
                alert('You can only edit your own posts!');
                return;
            }
            
            const currentContent = $post.find('.post-text').text();
            const currentImages = [];

            $post.find('.post-attachment').each(function() {
                const src = $(this).attr('src') || $(this).data('src');
                if (src) currentImages.push(src);
            });

            $('#edit-post-content').val(currentContent);
            $('#edit-attachments-preview').empty();

            currentImages.forEach(function(src) {
                $('#edit-attachments-preview').append(`
                    <div class="edit-img-item" data-src="${src}">
                        <img src="${src}" style="width:60px; height:60px; object-fit:cover; border-radius:6px;">
                        <button class="remove-edit-img" data-src="${src}">✕</button>
                    </div>
                `);
            });

            $('#edit-post-modal').data('postId', postId).css('display', 'flex');
        });

        $(document).on('click', '.remove-edit-img', function() {
            $(this).closest('.edit-img-item').remove();
        });

        $('#edit-save-btn').off('click').on('click', function() {
            const postId = $('#edit-post-modal').data('postId');
            if (!postId) {
                alert('No post ID found');
                return;
            }
            
            const content = $('#edit-post-content').val().trim();
            const newFiles = $('#edit-new-files')[0].files;
            const keepAttachments = [];

            $('#edit-attachments-preview .edit-img-item').each(function() {
                keepAttachments.push($(this).data('src'));
            });

            const formData = new FormData();
            formData.append('content', content);
            formData.append('userId', window.currentUser._id);
            formData.append('keepAttachments', JSON.stringify(keepAttachments));

            for (let i = 0; i < newFiles.length; i++) {
                formData.append('attachments', newFiles[i]);
            }

            $.ajax({
                url: `/api/posts/${postId}`,
                method: 'PUT',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        $('#edit-post-modal').hide();
                        $('#edit-new-files').val('');
                        if (window.refreshPosts) window.refreshPosts();
                        if (window.refreshHighlights) window.refreshHighlights();
                    } else {
                        alert(response.error || 'Could not save changes');
                    }
                },
                error: function(xhr) {
                    alert(xhr.responseJSON?.error || 'Failed to save changes');
                }
            });
        });

        $('#edit-cancel-btn').off('click').on('click', function() {
            $('#edit-post-modal').hide();
            $('#edit-new-files').val('');
        });

        $(window).click(function(e) {
            if ($(e.target).is('#edit-post-modal')) {
                $('#edit-post-modal').hide();
                $('#edit-new-files').val('');
            }
        });

        $(document).on("click", "#followers-count", function () {
            const userId = isOwnProfile ? window.currentUser._id : window.viewedUser._id;
            $.get(`/api/users/${userId}/list/followers`, function(res){
                const users = res.success ? res.users : [];
                showUserListModal('Followers', users);
            }).fail(() => showUserListModal('Followers', []));
        });

        $(document).on("click", "#following-count", function () {
            const userId = isOwnProfile ? window.currentUser._id : window.viewedUser._id;
            $.get(`/api/users/${userId}/list/following`, function(res){
                const users = res.success ? res.users : [];
                showUserListModal('Following', users);
            }).fail(() => showUserListModal('Following', []));
        });

        $('.close-followers').click(() => $('#followers-modal').fadeOut(200));
        $(window).click(function(e){
            if(e.target == $('#followers-modal')[0]){
                $('#followers-modal').fadeOut(200);
            }
        });

        $(".user-contact").hide();

        let currentHighlightedPosts = [];

        function displayHighlights(highlights) {
            console.log('displayHighlights called, highlights:', highlights);
            console.log('highlights-section element exists:', $('.highlights-section').length);
            
            const highlightsContainer = $('.highlights-section');
            highlightsContainer.html('<h3>Highlights!</h3>');
            
            if (!highlights || highlights.length === 0) {
                console.log('No highlights to display');
                highlightsContainer.append('<p class="no-highlights">No highlighted posts yet. Star your own posts to add them here!</p>');
                return;
            }
            
            console.log('Rendering', highlights.length, 'highlights');
            highlightsContainer.find('.highlighted-post').remove();
            
            for (var i = 0; i < highlights.length; i++) {
                var post = highlights[i];
                var user = post.user || {};
                
                var displayName = user.displayName || user.username || 'Unknown';
                var username = user.username ? '@' + user.username : '@unknown';
                
                var postContent = post.content || '';
                if (postContent.length > 100) {
                    postContent = postContent.substring(0, 100) + '...';
                }
                
                var hasImages = post.attachments && post.attachments.some(att => 
                    att.mimetype && att.mimetype.startsWith('image/')
                );
                var imageIndicator = hasImages ? ' 📷' : '';
                
                var postDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown date';
                
                var highlightHtml = `
                    <div class="highlighted-post" data-post-id="${post._id}">
                        <div class="highlight-header">
                            <span class="highlight-displayname">${displayName}</span>
                            <span class="highlight-username">${username}</span>
                        </div>
                        <div class="highlight-content">
                            <p>${postContent}${imageIndicator}</p>
                        </div>
                        <div class="highlight-footer">
                            <span class="highlight-date">${postDate}</span>
                        </div>
                    </div>
                `;
                highlightsContainer.append(highlightHtml);
            }
            
            console.log('Finished rendering highlights');
        }
        
        function loadHighlights() {
            console.log('loadHighlights started');
            const userId = window.currentUser._id;
            
            $.ajax({
                url: `/api/users/${userId}/highlights`,
                method: 'GET',
                success: function(response) {
                    if (response.success) {
                        displayHighlights(response.data);
                    } else {
                        console.error('Failed to load highlights:', response);
                    }
                },
                error: function(error) {
                    console.error('Error loading highlights:', error);
                }
            });
        }

        window.refreshHighlights = function() {
            console.log('refreshHighlights called');
            if (isOwnProfile) {
                loadHighlights();
            }
        };
        
        function loadUserPosts() {
            $.ajax({
                url: '/api/posts',
                method: 'GET',
                success: function(response) {
                    console.log('Posts response:', response);
                    
                    if(response.success && response.data) {
                        const userPosts = response.data.filter(post => 
                            post.user && post.user._id === window.currentUser._id && !post.commentReply
                        );
                        console.log(`Found ${userPosts.length} posts for this user`);
                        displayPosts(userPosts);
                        loadHighlights();
                    } else {
                        console.error('Failed to load posts:', response);
                    }
                },
                error: function(error) {
                    console.error('Error loading posts:', error);
                }
            });
        }

        $(document).on('click', '.highlighted-post', function() {
            const postId = $(this).data('post-id');
            const targetPost = $(`.post[data-post-id="${postId}"]`);
            if (targetPost.length) {
                $('.posts-section').animate({
                    scrollTop: targetPost.offset().top - $('.posts-section').offset().top + $('.posts-section').scrollTop()
                }, 500);
            }
        });

        function displayPosts(posts) {
            const postsContainer = $('.posts-section');
                
            if (!posts || posts.length === 0) {
                postsContainer.append('<p class="no-posts">No posts yet.</p>');
                return;
            }
            
            for(var i = 0; i < posts.length; i++) {
                var post = posts[i];
                var postHtml = TLPostLayout.render(post);
                postsContainer.append(postHtml);
            }
            
            var allPosts = $('.post');
            for(var j = 0; j < allPosts.length; j++) {
                TLPostLayout.dootInteractions(allPosts[j]);
            }
        }

        $("#toggle-contact").click(function(e){
            e.preventDefault();
            
            var isContactVisible = $(".user-contact").is(":visible");
            
            if(isContactVisible){  
                $(".user-posts").fadeIn(200);
                $(".user-contact").fadeOut(200);
                $(this).text("Contact me!");
            } else {
                $(".user-posts").fadeOut(200);
                $(".user-contact").fadeIn(200);
                $(this).text("Back to Posts");
            }
        });

        $("#faq-section").hide();
        $("#contact-section-form").show();
        $(".contact-tab").addClass("active");
        
        $(".contact-tab").click(function(e){
            e.preventDefault();
            $("#contact-section-form").fadeIn(200);
            $("#faq-section").fadeOut(200);
            $(this).addClass("active");
            $(".faq-tab").removeClass("active");
        });
        
        $(".faq-tab").click(function(e){
            e.preventDefault();
            $("#faq-section").fadeIn(200);
            $("#contact-section-form").fadeOut(200);
            $(this).addClass("active");
            $(".contact-tab").removeClass("active");
        });

        $("#open-report-modal").click(function(){
            $("#report-modal").fadeIn(300);
        });

        $(".close-modal").click(function(){
            $("#report-modal").fadeOut(300);
        });

        $(window).click(function(e){
            if(e.target == $("#report-modal")[0]) {
                $("#report-modal").fadeOut(300);
            }
        });

        $("#post-modal").click(function(e){
            if (!isOwnProfile) {
                alert('You can only post on your own profile!');
                return;
            }
            e.preventDefault();

            var userData = {
                _id: window.currentUser._id,
                username: window.currentUser.username,
                displayName: window.currentUser.displayName || window.currentUser.username
            };
            
            const userParam = encodeURIComponent(JSON.stringify(userData));

            $("#post-iframe").attr("src", "PostModal.html?user=" + userParam);
            $("#post-composer-modal").css("display", "flex").fadeIn(300);
        });

        window.refreshPosts = function() {
            if (isOwnProfile) {
                loadUserPosts();
            }
        };

        $(".close-post-modal").click(function() {
            $("#post-composer-modal").fadeOut(300);
            setTimeout(function() {
                $("#post-iframe").attr("src", "");
            }, 300);
        });

        $(window).click(function(e){
            if(e.target == $("#post-composer-modal")[0]) {
                $("#post-composer-modal").fadeOut(300);
                setTimeout(function() {
                    $("#post-iframe").attr("src", "");
                }, 300);
            }
        });

        $("#profile-settings").click(function(e){
            if (!isOwnProfile) {
                alert('You can only edit your own profile!');
                return;
            }
            e.preventDefault();
            $("#profile-iframe").attr("src", "Profile-Edit.html");
            $("#profile-settings-modal").fadeIn(300);
        });

        $(".close-profile-modal").click(function(){    
            $("#profile-settings-modal").fadeOut(300); 
            $("#profile-iframe").attr("src", "");
        });

        $(window).click(function(e){
            if(e.target == $("#profile-settings-modal")[0]) {  
                $("#profile-settings-modal").fadeOut(300);
                $("#profile-iframe").attr("src", "");
            }
        });

        function updateLogo() {
            const headerLogo = document.getElementById("header-logo");
            if (headerLogo) {
                if(document.body.classList.contains("lightmode")) {
                    headerLogo.src = "assets/logo-lightmode.png";
                } else {
                    headerLogo.src = "assets/logo-darkmode.png";
                }
            }
        }

        $("#gallery-modal-btn").click(function(e){
            e.preventDefault();
            const galleryUserId = isOwnProfile ? window.currentUser._id : window.viewedUser._id;
            
            $("#gallery-iframe").attr("src", `UserGallery.html?userId=${galleryUserId}`);
            $("#gallery-modal").fadeIn(300);
        });

        $(".close-gallery-modal").click(function() {
            $("#gallery-modal").fadeOut(300);
            setTimeout(function() {
                $("#gallery-iframe").attr("src", "");
            }, 300);
        });

        $(window).click(function(e){
            if(e.target == $("#gallery-modal")[0]) {
                $("#gallery-modal").fadeOut(300);
                setTimeout(function() {
                    $("#gallery-iframe").attr("src", "");
                }, 300);
            }
        });
        
        setTimeout(updateLogo, 10);
        
        $("#theme-switch").click(function() {
            setTimeout(updateLogo, 50);
        });
        
        $(".user-contact").hide();

        function loadThreadModal() {
            $.ajax({
                url: 'threadmodal.html',
                method: 'GET',
                success: function(html) {
                    $('body').append(html);
                    console.log('Thread modal loaded successfully');
                },
                error: function(error) {
                    console.error('Failed to load thread modal:', error);
                }
            });
        }

        loadThreadModal();
    });
});

window.addEventListener('message', function(event) {
    console.log('Message received in userpage:', event.data);

    if (event.data.type === 'coverPhotoUpdated') {
        $('#user-part').css('background-image',
            'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("' + event.data.coverPic + '")'
        );
        if (window.currentUser) {
            window.currentUser.coverPic = event.data.coverPic;
        }
    }

    if (event.data.type === 'profileUpdated') {
        const updatedUser = event.data.user;
        if (!updatedUser.coverPic && window.currentUser && window.currentUser.coverPic) {
            updatedUser.coverPic = window.currentUser.coverPic;
        }
        window.currentUser = updatedUser;
        updateProfile(updatedUser);
        $("#profile-settings-modal").fadeOut(300);
        $("#profile-iframe").attr("src", "");
    }
});

function getCurrentUser(callback) {
    $.ajax({
        url: '/api/me',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                window.currentUser = response.data;
                if (callback) callback();
            } else {
                window.location.href = 'Login-Page.html';
            }
        },
        error: function() {
            window.location.href = 'Login-Page.html';
        }
    });
}