$(document).ready(function() {
    getCurrentUser(function() {   
        // for loading threads 
        function loadThreadModal() {
            $.ajax({
                url: 'ThreadModal.html',
                method: 'GET',
                success: function(html) {
                    $('body').append(html);
                    console.log('Thread modal loaded');
                },
                error: function(error) {
                    console.error('Failed to load thread modal:', error);
                }
            });
        }
        
        loadThreadModal();  

        console.log("Logged in as: ", window.currentUser);

        function tlProfile(){
            $('#disp-name').text(window.currentUser.displayName || window.currentUser.username);
            $('#username').text('@' + window.currentUser.username);
            $('#profile-pfp').attr('src', window.currentUser.profilePic || '/assets/defaultuser.jpg');
            $('#bio').text(window.currentUser.bio || 'This is my user bio!!!!');
            $('#profile-link').attr('href', `UserPage.html?userId=${window.currentUser._id}`);
        }

        // ===== POST MODAL =====
        $(".close-post-modal").click(function() {
            $("#post-composer-modal").fadeOut(300);
            setTimeout(function() {
                $("#post-iframe").attr("src", "");
            }, 300);
        });

        $("#postbutton").click(function(e){
            e.preventDefault();

            var userData = {
                _id: window.currentUser._id,
                username: window.currentUser.username
            };
            
            if(window.currentUser.displayName) {
                userData.displayName = window.currentUser.displayName;
            } else {
                userData.displayName = window.currentUser.username;
            }
            
            const userParam = encodeURIComponent(JSON.stringify(userData));

            $("#post-iframe").attr("src", "PostModal.html?user=" + userParam);
            $("#post-composer-modal").css("display", "flex").fadeIn(300);
        });

        window.refreshPosts = function() {
            loadUserPosts();
        };

        TLPostLayout.init().then(function(){
            console.log("Template loaded, now loading posts...");
            loadUserPosts();
        });

        $(window).click(function(e){
            if(e.target == $("#post-composer-modal")[0]) {
                $("#post-composer-modal").fadeOut(300);
                setTimeout(function() {
                    $("#post-iframe").attr("src", "");
                }, 300);
            }
        });

        tlProfile();
        Search();
        loadNotifBadge();
        challengeOTD();
        Leaderboard();

        async function loadNotifBadge() {
            try {
                const res = await fetch('/api/notifications/unread-count');
                const { count } = await res.json();
                const badge = document.getElementById('notifBadge');
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.textContent = '';
                    badge.style.display = 'none';
                }
            } catch (err) { console.error('Badge error:', err); }
        }

        function loadUserPosts() {
            $.ajax({
                url: '/api/posts',
                method: 'GET',
                success: function(response) {
                    console.log('Posts response:', response);
                    if(response.success) {
                        if(response.data && Array.isArray(response.data)) {
                            // FILTER OUT REPLIES - only show posts that are NOT commentReply
                            const regularPosts = response.data.filter(post => !post.commentReply);
                            console.log('Posts found:', response.data.length, 'Regular posts:', regularPosts.length);
                            displayPosts(regularPosts);
                        } else {
                            console.error('Response missing posts data:', response);
                        }
                    } else {
                        console.error('Response success false:', response);
                    }
                },
                error: function(error) {
                    console.error('Error loading posts:', error);
                }
            });
        }

        function displayPosts(posts) {
            const postsContainer = $('.feed');
            postsContainer.empty(); // Clear existing posts

            if (!posts || posts.length === 0) {
                postsContainer.append('<p class="no-posts">No posts yet. Click "Post" to create one!</p>');
                return;
            }
            
            for(var i = 0; i < posts.length; i++) {
                var post = posts[i];
                console.log("Rendering post:", post);
                var postHtml = TLPostLayout.render(post);
                postsContainer.append(postHtml);
            }
            
            var allPosts = $('.post');
            for(var j = 0; j < allPosts.length; j++) {
                TLPostLayout.dootInteractions(allPosts[j]);
            }
        }

        function Search(){
            const searchInput = document.getElementById("search-input");
            const searchResults = document.getElementById("search-results");
            const middleDiv = document.getElementById("middle");
            let timer;

            searchInput.addEventListener("keydown", (e) => {
            if (e.key !== "Enter") return;
            const query = searchInput.value.trim();
            if (query === "") return;

            searchResults.style.display = "none";

            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(r => r.json())
                .then(result => {
                    if (!result.success || result.data.posts.length === 0) {
                        $('.feed').empty();
                        $('.feed').append("<div class='no-results'>No posts found</div>");
                        return;
                    }
                    displayPosts(result.data.posts);
                })
                .catch(err => console.error("Search error:", err));
            });

            // ===== KEYUP = dropdown (users only) =====
            searchInput.addEventListener("keyup", () => {
                clearTimeout(timer);
                timer = setTimeout(async () => {
                    const query = searchInput.value.trim();
                    if(query === ""){
                        searchResults.innerHTML = "";
                        searchResults.style.display = "none";
                        return;
                    }
                    try {
                        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                        const result = await response.json();
                        searchResults.innerHTML = "";
                        if(!result.success){
                            console.error("Search failed");
                            return;
                        }

                        // ===== USERS =====
                        result.data.users.forEach(user => {
                            const userDiv = document.createElement("div");
                            userDiv.className = "search-user";
                            userDiv.innerHTML = `
                                <img src="${user.profilePic || '/assets/defaultuser.jpg'}" width="30">
                                <span>${user.username}</span>
                            `;
                            userDiv.addEventListener("click", () => {
                                window.location.href = `/UserPage.html?userId=${user._id}`;
                            });
                            searchResults.appendChild(userDiv);
                        });

                        if(result.data.users.length === 0){
                            searchResults.innerHTML = "<div class='no-results'>No users found</div>";
                        }
                        searchResults.style.display = "block";
                    } catch(error){
                        console.error("Search error:", error);
                    }
                }, 300);
            });
        }

        function challengeOTD(){
        document.getElementById('seeforum').addEventListener("click", () => {
            const searchInput = document.getElementById("search-input");
            searchInput.value = '#MiniChallenge';

            // Directly trigger the search fetch instead of relying on the keydown event
            fetch(`/api/search?q=${encodeURIComponent('#MiniChallenge')}`)
                .then(r => r.json())
                .then(result => {
                    if (!result.success || result.data.posts.length === 0) {
                        $('.feed').empty();
                        $('.feed').append("<div class='no-results'>No posts found</div>");
                        return;
                    }
                    displayPosts(result.data.posts);
                })
                .catch(err => console.error("Search error:", err));
        });
    }


        // Closing thread modal
        $(document).on('click', '.close-thread-modal', function() {
            $('#thread-modal').fadeOut(200);
            $('#original-post-container').empty();
            $('#thread-container').empty();
            $('#reply-content').val('');
            $('#reply-attachment-preview').empty();
            $('#reply-attachment').val('');
            if (typeof currentThreadPostId !== 'undefined') {
                window.currentThreadPostId = null;
            }
        });

        $(window).click(function(e) {
            if (e.target == $('#thread-modal')[0]) {
                $('#thread-modal').fadeOut(200);
                $('#original-post-container').empty();
                $('#thread-container').empty();
                $('#reply-content').val('');
                $('#reply-attachment-preview').empty();
                $('#reply-attachment').val('');
                if (typeof currentThreadPostId !== 'undefined') {
                    window.currentThreadPostId = null;
                }
            }
        });
    });

    async function Leaderboard(){
        const response = await fetch('/api/top-post');
        const result = await response.json();
        const post = result.data;

        if (!post) return;

        const postHtml = TLPostLayout.render(post);
        $('#leaderboard-post-container').html(postHtml);

        const newPost = document.querySelector(`#leaderboard-post-container .post`);
        if (newPost) {
            TLPostLayout.dootInteractions(newPost);
        }
    }
});
