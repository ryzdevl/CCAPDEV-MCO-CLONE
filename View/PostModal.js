// View/js/PostModal.js
$(document).ready(function() {
    $("#postMessage").focus();

    // Get user info from URL parameters (passed from parent page)
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    const parentPostId = urlParams.get('parentPost'); 
    let currentUser = null;
    
    if (userParam) {
        try {
            currentUser = JSON.parse(decodeURIComponent(userParam));
        } catch(e) {
            console.error('Error parsing user data:', e);
        }
    }

    // ===== SUBMIT POST =====
    $("#submitPost").click(function() {
        const postContent = $("#postMessage").val().trim();
        const fileInput = $("#insertion")[0].files;

        // Validate post content
        if (postContent === "" && (!fileInput || fileInput.length === 0)) {
            alert("Can't post nothing!");
            return;
        }

        // Get user if no user is currently set
        if (!currentUser || !currentUser._id) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                console.log("Using stored user:", currentUser);
            } else {
                alert("You must be logged in to post!");
                return;
            }
        }

        // Create FormData for sending to server
        const formData = new FormData();
        if (postContent) {
            formData.append('content', postContent);
        }
        formData.append('userId', currentUser._id);

        // Determine which endpoint to use
        let apiUrl = '/api/posts';
        const isReply = parentPostId && parentPostId !== 'null' && parentPostId !== 'undefined';
        
        if (isReply) {
            apiUrl = `/api/posts/${parentPostId}/reply`;
            console.log('This is a reply to post:', parentPostId);
        }

        // Handle MULTIPLE file inputs
        if (fileInput && fileInput.length > 0) {
            for (let i = 0; i < fileInput.length; i++) {
                if (fileInput[i].size > 5 * 1024 * 1024) {
                    alert("File too large! Maximum size is 5MB per file.");
                    return;
                }
                formData.append('attachments', fileInput[i]);
            }
        }

        // Prevents double posting
        const $submitBtn = $(this);
        $submitBtn.prop('disabled', true).text('Posting...');

        // Send to server using the correct endpoint
        $.ajax({
            url: apiUrl,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    $("#postMessage").val("");
                    $("#insertion").val("");
                    $("#attachment-preview").hide();
                    $("#preview-img").attr('src', '#');
                    $("#preview-filename").text('');
        
                    alert("Post submitted successfully!");
                    
                    if (window.parent) {
                        try {
                            // Refresh posts in parent page
                            if (window.parent.refreshPosts) {
                                window.parent.refreshPosts();
                            }
                            if (window.parent.refreshTimeline) {
                                window.parent.refreshTimeline();
                            }
                            
                            // If this was a reply, refresh the thread modal
                            if (isReply && window.parent.refreshThread) {
                                window.parent.refreshThread(parentPostId);
                            }
                            
                            // Close the modal
                            window.parent.$("#post-composer-modal").fadeOut(300);
                            
                            setTimeout(function() {
                                window.parent.$("#post-iframe").attr("src", "");
                            }, 300);
                            
                        } catch(e) {
                            console.log("Error communicating with parent:", e);
                        }
                    }
                } else {
                    alert("Error: " + (response.error || "Unknown error occurred"));
                }
            },
            error: function(xhr, status, error) {
                console.error('Error posting:', error);
                console.error('Response:', xhr.responseText);
                
                let errorMsg = "Failed to post. ";
                if (xhr.status === 413) {
                    errorMsg += "File too large.";
                } else if (xhr.status === 500) {
                    errorMsg += "Server error. Please try again later.";
                } else {
                    errorMsg += "Please check your connection and try again.";
                }
                
                alert(errorMsg);
            },
            complete: function() {
                $submitBtn.prop('disabled', false).text('Post');
            }
        });
    });

    // INSERT FILE
    $("#insertFile").click(function() {
        $("#insertion").click();
    });

    // FILE ATTACHMENTS
    $("#insertion").change(function() {
        const fileInput = this;
        const files = fileInput.files;
        
        if (files && files.length > 0) {
            alert(files.length + " file(s) selected");
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if(file.type.startsWith('image/')){
                    const reader = new FileReader();
                    reader.onload = function(e){
                        $('#preview-img').attr('src', e.target.result);
                        $('#preview-filename').text(files.length + " file(s) selected - " + file.name);
                        $('#attachment-preview').show();
                    };
                    reader.readAsDataURL(file);
                    break;
                } else {
                    $('#preview-img').attr('src', '');
                    $('#preview-filename').text(files.length + " file(s) selected (includes non-image)");
                    $('#attachment-preview').show();
                }
            }
        }
    });

    // CLEAR POST
    $("#clearPost").click(function() {
        if ($("#postMessage").val().trim() !== "" || $("#insertion").val() !== "") {
            if (confirm("Discard this post?")) {
                $("#postMessage").val("");
                $("#insertion").val("");
                $("#attachment-preview").hide();
                $("#postMessage").focus();
            }
        }
    });
    
});