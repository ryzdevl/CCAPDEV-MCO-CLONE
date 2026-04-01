const TLPostLayout = {
    template: null,

    init: function(){
        const self = this;
        return $.ajax({
            url: 'TLPost.html',
            method: 'GET',
            success: function(html){
                self.template = html;
                console.log('Post template loaded successfully');
            },
            error: function(error){
                console.error('Failed to load post template...', error);
            }
        });
    },

    render: function(post) {
        if (!this.template) return '<div class="post loading">Loading...</div>';

        const user = post.user || {};
        const displayName = user.displayName || user.username || 'User';
        const username = user.username ? '@' + user.username : '@username';
        const profilePic = user.profilePic || '/assets/defaultuser.png';
        const attached = this.renderAttachments(post.attachments);
        const postUserId = post.user?._id || '';
        const sharedLabel = post.isShared ? `<p class="shared-label">Shared a post!</p>` : '';
        const embeddedPost = post.isShared && post.originalPost
            ? this.renderEmbeddedPost(post.originalPost) : '';
        const isHighlighted = post.highlighted || false;
        const postActions = this.renderPostActions(post); 
        const editedLabel = this.renderEditedLabel(post);  

        const postDate = post.createdAt 
        ? new Date(post.createdAt).toLocaleDateString('en-GB').replaceAll('/', ' | ')
        : '';

        return this.template
            .replace(/{{postId}}/g, post._id || '')
            .replace(/{{userId}}/g, postUserId)
            .replace(/{{profilePic}}/g, profilePic)
            .replace(/{{displayName}}/g, displayName)
            .replace(/{{username}}/g, username)
            .replace(/{{postDate}}/g, postDate)
            .replace(/{{content}}/g, post.content || '')
            .replace(/{{updootsUp}}/g, post.updoots?.up || 0)
            .replace(/{{updootsDown}}/g, post.updoots?.down || 0)
            .replace(/{{commentCount}}/g, post.commentCount || 0)
            .replace(/{{starCount}}/g, post.starCount || 0)
            .replace(/{{shareCount}}/g, post.shareCount || 0)
            .replace(/{{attachments}}/g, attached)
            .replace(/{{sharedLabel}}/g, sharedLabel)
            .replace(/{{embeddedPost}}/g, embeddedPost)
            .replace(/{{isShared}}/g, post.isShared || false)
            .replace(/{{isHighlighted}}/g, isHighlighted ? 'checked' : '')
            .replace(/{{postActions}}/g, postActions)      
            .replace(/{{editedLabel}}/g, editedLabel);     
    },

    renderAttachments: function(attachments) {
        if (!attachments || attachments.length === 0) return '';

        const images = attachments.filter(att => att.mimetype && att.mimetype.startsWith('image/'));
        const files = attachments.filter(att => !att.mimetype || !att.mimetype.startsWith('image/'));

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
                    html += `<div class="see-more-overlay" data-src="${src}">+${extraCount}</div>`;
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

  
    renderPostActions: function(post) {
        const isUserPage = window.location.pathname.includes('UserPage');
        // ATTEMPTED FIX FHSAJFHSDJHJSDF rn u cant edit/delete posts sa main timeline T^T
        const isTimeline = window.location.pathname.includes('main timeline');
        
        if (!isUserPage && !isTimeline) {
            console.log('Not on UserPage or Timeline, returning empty');
            return '';
        }
        if (!window.currentUser) {
            console.log('No currentUser, returning empty');
            return '';
        }
        
        const postUserId = post.user?._id || post.user;
        if (postUserId?.toString() !== window.currentUser._id?.toString()) {
            console.log('User mismatch, returning empty');
            return '';
        }

        console.log('Rendering edit/delete buttons for post:', post._id);
        
        return `
            <div class="post-action-buttons">
                <button class="edit-post-btn" data-post-id="${post._id}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                <button class="delete-post-btn" data-post-id="${post._id}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        `;
    },


    renderEditedLabel: function(post) {
        if (!post.edited) return '';
        const date = post.editedAt
            ? new Date(post.editedAt).toLocaleDateString('en-GB').replaceAll('/', ' | ')
            : '';
        return `<span class="edited-label">edited ${date}</span>`;
    },

    renderEmbeddedPost: function(original) {
        const user = original.user || {};
        const displayName = user.displayName || user.username || 'Unknown';
        const username = user.username ? '@' + user.username : '@unknown';
        const profilePic = user.profilePic || '/assets/defaultuser.png';
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

    dootInteractions: function(postElement) {
        const self = this;
        const postId = $(postElement).data('postId');
        const postUserId = $(postElement).data('userId');

        // Handle image grid clicks for lightbox
        $(postElement).find('.attachment-grid').each(function() {
            const allImages = JSON.parse($(this).attr('data-images') || '[]');
            $(this).find('.post-attachment, .see-more-overlay').click(function(e) {
                e.stopPropagation();
                const clickedSrc = $(this).data('src');
                const startIndex = Math.max(allImages.indexOf(clickedSrc), 0);
                if (window.Lightbox) {
                    Lightbox.open(allImages, startIndex);
                }
            });
        });

        // Handle UPDOOT button
        $(postElement).find('.action-item[data-action="updoot"]').off('click').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if(!window.currentUser){
                alert('Please log in to interact with posts!');
                return;
            }

            const wrapper = $(this);
            const checkbox = wrapper.find('input[type="checkbox"]');
            const isChecked = checkbox.prop('checked');
            
            checkbox.prop('checked', !isChecked);
            self.handleInteraction('updoot', postId, wrapper, !isChecked);
        });

        // Handle DOWNDOOT button
        $(postElement).find('.action-item[data-action="downdoot"]').off('click').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if(!window.currentUser){
                alert('Please log in to interact with posts!');
                return;
            }

            const wrapper = $(this);
            const checkbox = wrapper.find('input[type="checkbox"]');
            const isChecked = checkbox.prop('checked');
            
            checkbox.prop('checked', !isChecked);
            self.handleInteraction('downdoot', postId, wrapper, !isChecked);
        });

        // Handle STAR button (HIGHLIGHT functionality)
        $(postElement).find('.action-item[data-action="star"]').off('click').click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (!window.currentUser) {
                alert('Please log in!');
                return;
            }

            if (window.currentUser._id !== postUserId) {
                alert('You can only highlight your own posts!');
                return;
            }

            const wrapper = $(this);
            const checkbox = wrapper.find('input[type="checkbox"]');
            const isChecked = checkbox.prop('checked');
            const countSpan = wrapper.find('.counter');
            const currentCount = parseInt(countSpan.text()) || 0;

            $.ajax({
                url: `/api/posts/${postId}/highlight`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ userId: window.currentUser._id }),
                success: function(response) {
                    if (response.success) {
                        countSpan.text(response.data.starCount);
                        checkbox.prop('checked', response.data.highlighted);
                        
                        if (response.data.highlighted) {
                            wrapper.addClass('active');
                        } else {
                            wrapper.removeClass('active');
                        }
                        
                        if (window.refreshHighlights) {
                            window.refreshHighlights();
                        }
                    } else {
                        checkbox.prop('checked', isChecked);
                        countSpan.text(currentCount);
                        alert(response.error || 'Failed to update highlight');
                    }
                },
                error: function(error) {
                    console.error('Error toggling highlight:', error);
                    checkbox.prop('checked', isChecked);
                    countSpan.text(currentCount);
                    alert('Failed to update highlight status');
                }
            });
        });

        // Handle COMMENT button - opens thread modal
        $(postElement).find('.action-item[data-action="message"]').off('click').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!window.currentUser) {
                alert('Please log in to view replies!');
                return;
            }
            
            const checkbox = $(this).find('input[type="checkbox"]');
            checkbox.prop('checked', true);
            setTimeout(() => checkbox.prop('checked', false), 200);
            
            const attachments = [];
            $(postElement).find('.attachment-grid img, .file-attachment a').each(function() {
                const src = $(this).attr('src') || $(this).attr('href');
                if (src) {
                    attachments.push({ path: src });
                }
            });
            
            const postData = {
                _id: postId,
                user: {
                    _id: postUserId,
                    username: $(postElement).find('.post-username').text().replace('@', ''),
                    displayName: $(postElement).find('.post-displayname').text(),
                    profilePic: $(postElement).find('.post-pfp').attr('src')
                },
                content: $(postElement).find('.post-text').text(),
                attachments: attachments,
                commentCount: parseInt($(postElement).find('.action-item[data-action="message"] .counter').text()) || 0
            };
            
            if (window.openThreadModal) {
                window.openThreadModal(postId, postData);
            } else {
                console.error('openThreadModal function not found');
            }
        });

        // Handle SHARE button
        $(postElement).find('.action-item[data-action="share"]').off('click').click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (!window.currentUser) {
                alert('Please log in to share!');
                return;
            }

            const wrapper = $(this);
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
                        const countSpan = wrapper.find('.counter');
                        countSpan.text(parseInt(countSpan.text()) + 1);
                        alert('Post shared!');
                        if (window.refreshPosts) window.refreshPosts();
                    } else {
                        alert(response.error || 'Could not share post');
                    }
                },
                error: function(xhr) {
                    alert(xhr.responseJSON?.error || 'Failed to share post');
                }
            });
        });

        // making other posts clickable to redirect them to other user profiles
        $(postElement).find('.post-pfp, .post-displayname, .post-username').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            const userId = $(postElement).data('userId');
            if (userId) {
                window.location.href = `/UserPage.html?userId=${userId}`;
            }
        });
    },

    handleInteraction: function(type, postId, wrapper, isActive) {
        $.ajax({
            url: `/api/posts/${postId}/interact`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                type: type,
                userId: window.currentUser._id,
                active: isActive
            }),
            success: function(response) {
                if (response.success) {
                    const countSpan = wrapper.find('.counter');
                    countSpan.text(response.data.newCount);
                    wrapper.addClass('active');
                    setTimeout(() => wrapper.removeClass('active'), 200);
                } else {
                    const checkbox = wrapper.find('input[type="checkbox"]');
                    checkbox.prop('checked', !isActive);
                }
            },
            error: function(error) {
                const checkbox = wrapper.find('input[type="checkbox"]');
                checkbox.prop('checked', !isActive);
                alert('Failed to process interaction... :(');
            }
        });
    }
};

window.TLPostLayout = TLPostLayout;