$(document).ready(function() {

    let i = 0;
    const oneweek = 7 * 24 * 60 * 60 * 1000;

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

        // Settings modal handler
        $("#tosettings").click(function(e) {
            e.preventDefault();
            $("#settings-iframe").attr("src", "Profile Settings Page.html");
            $("#settings-modal").fadeIn(300);
        });

        $(".close-settings-modal").click(function() {
            $("#settings-modal").fadeOut(300);
            setTimeout(function() {
                $("#settings-iframe").attr("src", "");
            }, 300);
        });

        $(window).click(function(e) {
            if(e.target == $("#settings-modal")[0]) {
                $("#settings-modal").fadeOut(300);
                setTimeout(function() {
                    $("#settings-iframe").attr("src", "");
                }, 300);
            }
        });

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

            var prompts = [ "Create something that reminds you of childhood.",
                            "Create something that feels like a secret you kept as a kid.",
                            "Create something based on a smell you loved when you were young.",
                            "Create something that captures the sound of a summer afternoon.",
                            "Create something inspired by a game you invented as a child.",
                            "Create something that feels like a worn-out blanket or favorite piece of clothing.",
                            "Create something based on a fear you had as a kid, seen through adult eyes.",
                            "Create something inspired by a line from a children's book that stuck with you.",
                            "Create something that looks the way a skinned knee or bruised elbow felt.",
                            "Create something based on a dream you had before turning 10.",
                            "Create something that tastes like a specific birthday cake from your past.",
                            "Create something inspired by a hiding spot you used to love.",
                            "Create something based on a playground rumor you believed.",
                            "Create something that smells like rain on hot pavement in summer.",
                            "Create something inspired by a lullaby or bedtime song.",
                            "Create something that feels like a sleepover past midnight.",
                            "Create something based on a word you mispronounced as a child.",
                            "Create something that lives inside a closet or wardrobe.",
                            "Create something inspired by an imaginary friend you had.",
                            "Create something based on a lie you told as a kid.",
                            "Create something that represents the best boring Sunday ever.",
                            "Create something inspired by a relative you only saw occasionally.",
                            "Create something based on the view from your childhood bedroom window.",
                            "Create something inspired by a neighbor you were curious about.",
                            "Create something based on a car trip from the back seat.",
                            "Create something inspired by a hand-me-down object.",
                            "Create something based on a school desk doodle.",
                            "Create something inspired by a carnival or fair ride from a child's height.",
                            "Create something based on a babysitter who let rules slide.",
                            "Create something that reminds you of the night before a big event.",
                            "Create something based on a melted popsicle on a hot day.",
                            "Create something inspired by a handprint craft.",
                            "Create something that feels like waiting for a friend to come outside and play.",
                            "Create something based on a broken toy you couldn't throw away.",
                            "Create something inspired by a nickname only your family used.",
                            "Create something that sounds like a creaky staircase or screen door.",
                            "Create something based on a chore you secretly enjoyed.",
                            "Create something inspired by a puddle you couldn't resist jumping in.",
                            "Create something that feels like the static between radio stations.",
                            "Create something based on a TV show you watched reruns of every day.",
                            "Create something inspired by a lunchbox or thermos you loved.",
                            "Create something that tastes like a specific fruit from a neighbor's tree.",
                            "Create something based on a coin you found and kept as a treasure.",
                            "Create something inspired by a caterpillar, lightning bug, or other small creature.",
                            "Create something that feels like the last swim of the summer.",
                            "Create something based on a basement or attic you were curious about.",
                            "Create something inspired by a magazine you read at the doctor's office.",
                            "Create something that sounds like a neighborhood dog barking in the distance.",
                            "Create something based on a handshake or clapping game you learned.",
                            "Create something that feels like the moment just before being called in for dinner."
                        ]

            function getCurrentIndex() {
                const lastUpdate = localStorage.getItem('lastUpdate');
                const savedIndex = localStorage.getItem('promptIndex');
                
                if (lastUpdate && savedIndex) {
                    const weeksPassed = Math.floor((Date.now() - parseInt(lastUpdate)) / oneweek); // 👈 fix here
                    let newIndex = parseInt(savedIndex) + weeksPassed;
                    if (newIndex >= prompts.length) newIndex = prompts.length - 1;
                    return newIndex;
                }
                return 0;
            }

        function updateChallenge() {
            if (i < prompts.length) {
                document.getElementById('challenge-text').innerText = prompts[i];
                localStorage.setItem('lastUpdate', Date.now().toString());
                localStorage.setItem('promptIndex', i.toString());
                i++;
            }
        }

        i = getCurrentIndex();
        updateChallenge();

        setInterval(() => {
            if (i < prompts.length) updateChallenge();
        }, oneweek);

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

        const postText = document.querySelector('#leaderboard-post-container .post-text');
        const postBody = document.querySelector('#leaderboard-post-container .post-body');
        if (postText && postBody && postText.textContent.trim() === '') {
            postBody.style.paddingTop = '50px';
        }
    }
});
