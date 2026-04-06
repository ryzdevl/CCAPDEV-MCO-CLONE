// ThreadManager.js
let currentThreadPostId = null;
let currentReplyAttachments = [];

function openThreadModal(postId, originalPost) {
    currentThreadPostId = postId;
    currentReplyAttachments = [];
    $('#reply-content').val('');
    $('#reply-attachment-preview').empty();
    $('#reply-attachment').val('');
    
    const originalHtml = TLPostLayout.render(originalPost);
    $('#original-post-container').html(originalHtml);
    
    const originalPostElement = $('#original-post-container').find('.post');
    if (originalPostElement.length) {
        TLPostLayout.dootInteractions(originalPostElement[0]);
    }
    
    loadThreadReplies(postId);
    $('#thread-modal').css('display', 'flex').hide().fadeIn(200);
}

function loadThreadReplies(postId) {
    $('#thread-container').html('<p>Loading replies...</p>');
    
    $.ajax({
        url: `/api/posts/${postId}/thread`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayThreadReplies(response.data);
            } else {
                $('#thread-container').html('<p>Failed to load replies</p>');
            }
        },
        error: function(error) {
            console.error('Error loading thread:', error);
            $('#thread-container').html('<p>Error loading replies</p>');
        }
    });
}

function displayThreadReplies(replies) {
    const container = $('#thread-container');
    container.empty();
    
    if (!replies || replies.length === 0) {
        container.html('<p>No replies yet. Be the first to reply!</p>');
        return;
    }
    
    for (let i = 0; i < replies.length; i++) {
        const replyHtml = TLPostLayout.render(replies[i]);
        container.append(replyHtml);
    }
    
    const allReplies = container.find('.post');
    for (let j = 0; j < allReplies.length; j++) {
        TLPostLayout.dootInteractions(allReplies[j]);
    }
}

$(document).on('change', '#reply-attachment', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert('File too large! Maximum size is 5MB.');
        $(this).val('');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        $(this).val('');
        return;
    }
    
    currentReplyAttachments = [file];
    
    const reader = new FileReader();
    reader.onload = function(e) {
        $('#reply-attachment-preview').html(`
            <div class="attachment-preview-item">
                <img src="${e.target.result}" class="preview-img">
                <span class="remove-attachment">✕</span>
            </div>
        `);
    };
    reader.readAsDataURL(file);
});

$(document).on('click', '.remove-attachment', function() {
    currentReplyAttachments = [];
    $('#reply-attachment-preview').empty();
    $('#reply-attachment').val('');
});

$(document).on('click', '#submit-reply-btn', function() {
    const content = $('#reply-content').val().trim();
    
    if (!content && currentReplyAttachments.length === 0) {
        alert('Please enter a reply or add an image');
        return;
    }
    
    if (!window.currentUser) {
        alert('Please log in to reply!');
        return;
    }
    
    if (!currentThreadPostId) {
        alert('No post selected');
        return;
    }
    
    const $btn = $(this);
    $btn.prop('disabled', true).text('Posting...');
    
    const formData = new FormData();
    formData.append('userId', window.currentUser._id);
    if (content) formData.append('content', content);
    if (currentReplyAttachments.length > 0) {
        formData.append('attachments', currentReplyAttachments[0]);
    }
    
    $.ajax({
        url: `/api/posts/${currentThreadPostId}/reply`,
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            if (response.success) {
                $('#reply-content').val('');
                $('#reply-attachment-preview').empty();
                $('#reply-attachment').val('');
                currentReplyAttachments = [];
                loadThreadReplies(currentThreadPostId);
                
                const postElement = $(`.post[data-post-id="${currentThreadPostId}"]`);
                const commentCounter = postElement.find('.action-item[data-action="message"] .counter');
                const currentCount = parseInt(commentCounter.text()) || 0;
                commentCounter.text(currentCount + 1);
                
                const originalCommentCounter = $('#original-post-container').find('.action-item[data-action="message"] .counter');
                if (originalCommentCounter.length) {
                    const origCount = parseInt(originalCommentCounter.text()) || 0;
                    originalCommentCounter.text(origCount + 1);
                }
            } else {
                alert(response.error || 'Failed to post reply');
            }
        },
        error: function(xhr) {
            alert(xhr.responseJSON?.error || 'Failed to post reply');
        },
        complete: function() {
            $btn.prop('disabled', false).text('Post Reply');
        }
    });
});

$(document).on('click', '.close-thread-modal', function() {
    $('#thread-modal').fadeOut(200);
    $('#original-post-container').empty();
    $('#thread-container').empty();
    $('#reply-content').val('');
    $('#reply-attachment-preview').empty();
    $('#reply-attachment').val('');
    currentReplyAttachments = [];
    currentThreadPostId = null;
});

$(window).click(function(e) {
    if (e.target == $('#thread-modal')[0]) {
        $('#thread-modal').fadeOut(200);
        $('#original-post-container').empty();
        $('#thread-container').empty();
        $('#reply-content').val('');
        $('#reply-attachment-preview').empty();
        $('#reply-attachment').val('');
        currentReplyAttachments = [];
        currentThreadPostId = null;
    }
});

// Make entire post clickable to open thread modal
$(document).on('click', '.post', function(e) {
    if ($(e.target).closest('.updoot-btn, .downdoot-btn, .star-btn, .share-btn, .post-attachment, .see-more-overlay, .attachment-grid, .post-username, .post-avatar, a, button, .action-item, .comment-btn').length) {
        return;
    }
    
    const postData = $(this).data('post-data');
    
    if (postData && postData._id) {
        openThreadModal(postData._id, postData);
    } else {
        const postId = $(this).data('postId');
        if (postId && window.currentUser) {
            // Fetch post data from API if not stored
            $.ajax({
                url: `/api/posts/${postId}`,
                method: 'GET',
                success: function(response) {
                    if (response.success && response.data) {
                        openThreadModal(postId, response.data);
                    }
                }
            });
        }
    }
});

window.openThreadModal = openThreadModal;
