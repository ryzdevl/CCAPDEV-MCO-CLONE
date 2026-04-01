const PostLayout = {
    template: null,

    // will initialize posts based on the template html file
    init: function(){
        const self = this;

        return $.ajax({
            url: 'PostLayout.html',
            method: 'GET',
            success: function(html){
                self.template = html;
            },
            error: function(error){
                console.error('Failed to load post template...', error);
            }
        });
    },

    render: function(post) {
        if (!this.template) {
            return '<div class="post loading">Loading...</div>';
        }

        const user = post.user || {};
        const displayName = user.displayName || user.username || 'User';
        const username = user.username ? '@' + user.username : '@username';
        const profilePic = user.profilePic || '/assets/tester.png';
        const attached = this.renderAttachments(post.attachments);

        // shared post label + embedded post
        const sharedLabel = post.isShared
            ? `<p class="shared-label">🔁 Shared a post</p>`
            : '';
        const embeddedPost = post.isShared && post.originalPost
            ? this.renderEmbeddedPost(post.originalPost)
            : '';

        return this.template
            .replace(/{{postId}}/g, post._id)
            .replace(/{{profilePic}}/g, profilePic)
            .replace(/{{displayName}}/g, displayName)
            .replace(/{{userId}}/g, username)
            .replace(/{{content}}/g, post.content || '')
            .replace(/{{updootsUp}}/g, post.updoots?.up || 0)
            .replace(/{{updootsDown}}/g, post.updoots?.down || 0)
            .replace(/{{commentCount}}/g, post.commentCount || 0)
            .replace(/{{starCount}}/g, post.starCount || 0)
            .replace(/{{shareCount}}/g, post.shareCount || 0)
            .replace(/{{attachments}}/g, attached)
            .replace(/{{sharedLabel}}/g, sharedLabel)
            .replace(/{{embeddedPost}}/g, embeddedPost)
            .replace(/{{postId}}/g, post._id)
            .replace(/{{isShared}}/g, post.isShared || false)
    },

    // helper for attachments
    renderAttachments: function(attachments) {
        if (!attachments || attachments.length === 0) return '';

        const images = attachments.filter(att => att.mimetype && att.mimetype.startsWith('image/'));
        const files  = attachments.filter(att => !att.mimetype || !att.mimetype.startsWith('image/'));

        let html = '';

        if (images.length > 0) {
            const count = images.length;
            const displayImages = count > 4 ? images.slice(0, 4) : images;
            const extraCount = count - 4;

            html += `<div class="attachment-grid grid-${Math.min(count, 4)}" data-images='${JSON.stringify(images.map(i => i.path.trim()))}'>`;

            displayImages.forEach((att, index) => {
                const isLast = index === 3 && extraCount > 0;
                const src = att.path.trim();
                html += `<div class="grid-item">`;
                html += `<img src="${src}" class="post-attachment" alt="Attachment" 
                            data-src="${src}"
                            loading="lazy">`;
                if (isLast) {
                    html += `<div class="see-more-overlay" data-src="${src}">+${extraCount} more</div>`;
                }
                html += `</div>`;
            });

            html += `</div>`;
        }

        files.forEach(att => {
            html += `<p class="file-attachment">📎 <a href="${att.path.trim()}" target="_blank">${att.filename || 'Attachment'}</a></p>`;
        });

        return html;
    },

    // renders the small embedded original post
    renderEmbeddedPost: function(original) {
        const user = original.user || {};
        const displayName = user.displayName || user.username || 'Unknown';
        const username = user.username ? '@' + user.username : '@unknown';
        const profilePic = user.profilePic || '/assets/tester.png';
        const date = original.createdAt
            ? new Date(original.createdAt).toLocaleDateString('en-GB').replaceAll('/', ' | ')
            : '';
        const attached = this.renderAttachments(original.attachments);

        return `
            <div class="embedded-post">
                <div class="embedded-post-header">
                    <img src="${profilePic}" class="embedded-profile-pic">
                    <div>
                        <span class="embedded-display-name">${displayName}</span>
                        <span class="embedded-user-id">${username}</span>
                        <span class="embedded-date">${date}</span>
                    </div>
                </div>
                <p class="embedded-content">${original.content || ''}</p>
                <div class="attachments-container">${attached}</div>
            </div>
        `;
    },

    // Initialize interactions (make it clickable) 
    dootInteractions: function(postElement) {
        const postId = $(postElement).data('postId');

        // IMAGE CLICK — open lightbox
        $(postElement).find('.attachment-grid').each(function() {
            const allImages = JSON.parse($(this).attr('data-images') || '[]');

            $(this).find('.post-attachment, .see-more-overlay').click(function() {
                const clickedSrc = $(this).data('src');
                const startIndex = Math.max(allImages.indexOf(clickedSrc), 0);
                Lightbox.open(allImages, startIndex);
            });
        });

        // UPDOOT button
        $(postElement).find('.updoot-btn').click(function(e) {
            e.preventDefault();
            PostLayout.handleInteraction('updoot', postId, $(this));
        });
        // DOWNDOOT button
        $(postElement).find('.downdoot-btn').click(function(e) {
            e.preventDefault();
            PostLayout.handleInteraction('downdoot', postId, $(this));
        });
        // COMMENT button
        $(postElement).find('.comment-btn').click(function(e) {
            e.preventDefault();
            PostLayout.handleInteraction('comment', postId, $(this));
        });
        // STAR button
        $(postElement).find('.star-btn').click(function(e) {
            e.preventDefault();
            PostLayout.handleInteraction('star', postId, $(this));
        });
        // SHARE button — replace existing share handler
        $(postElement).find('.share-btn').click(function(e) {
            e.preventDefault();

            if (!window.currentUser) {
                alert('Please log in to share!');
                return;
            }

            const postId = $(postElement).data('postId');
            const isShared = $(postElement).data('isShared');

            if (isShared) {
                alert("You can't re-share a shared post!");
                return;
            }

            if (!confirm('Share this post?')) return;

            $.ajax({
                url: `/api/posts/${postId}/share`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ userId: window.currentUser._id }),
                success: function(response) {
                    if (response.success) {
                        const countSpan = $(postElement).find('.share-count');
                        countSpan.text(parseInt(countSpan.text()) + 1);
                        alert('Post shared!');
                        if (window.refreshPosts) window.refreshPosts();
                    } else {
                        alert(response.error || 'Could not share post');
                    }
                },
                error: function(xhr) {
                    const msg = xhr.responseJSON?.error || 'Failed to share post';
                    alert(msg);
                }
            });
        });
    },

    handleInteraction: function(type, postId, buttonElement) {
        if (!window.currentUser) {
            alert('Please log in to interact with posts!');
            return;
        }

        $.ajax({
            url: `/api/posts/${postId}/interact`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                type: type,
                userId: window.currentUser._id
            }),
            success: function(response) {
                if (response.success) {
                    const countSpan = buttonElement.find('span');
                    countSpan.text(response.data.newCount);

                    // Toggle the active class
                    if (buttonElement.hasClass('active')) {
                        buttonElement.removeClass('active');
                    } else {
                        buttonElement.addClass('active');

                        // If like is clicked, remove active from dislike
                        if (type === 'updoot') {
                            buttonElement.siblings('.downdoot-btn').removeClass('active');
                        }
                        // If dislike is clicked, remove active from like
                        else if (type === 'downdoot') {
                            buttonElement.siblings('.updoot-btn').removeClass('active');
                        }
                    }
                }
            },
            error: function(error) {
                console.error(`Error with ${type}:`, error);
                alert('Failed to process interaction. . . :(');
            }
        });
    }
}
window.PostLayout = PostLayout;