$(document).ready(function() {
    $("#postMessage").focus();

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

    $("#submitPost").click(function() {
        const postContent = $("#postMessage").val().trim();
        const fileInput = $("#insertion")[0].files;

        if (postContent === "" && (!fileInput || fileInput.length === 0)) {
            alert("Can't post nothing!");
            return;
        }

        if (!currentUser || !currentUser._id) {
            getCurrentUser(function() {
                currentUser = window.currentUser;
                submitPost(postContent, fileInput);
            });
        } else {
            submitPost(postContent, fileInput);
        }
    });

    function submitPost(postContent, fileInput) {
        const formData = new FormData();
        if (postContent) {
            formData.append('content', postContent);
        }
        formData.append('userId', currentUser._id);

        let apiUrl = '/api/posts';
        const isReply = parentPostId && parentPostId !== 'null' && parentPostId !== 'undefined';
        
        if (isReply) {
            apiUrl = `/api/posts/${parentPostId}/reply`;
        }

        if (fileInput && fileInput.length > 0) {
            for (let i = 0; i < fileInput.length; i++) {
                if (fileInput[i].size > 5 * 1024 * 1024) {
                    alert("File too large! Maximum size is 5MB per file.");
                    return;
                }
                formData.append('attachments', fileInput[i]);
            }
        }

        const $submitBtn = $("#submitPost");
        $submitBtn.prop('disabled', true).text('Posting...');

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
                            if (window.parent.refreshPosts) {
                                window.parent.refreshPosts();
                            }
                            if (window.parent.refreshTimeline) {
                                window.parent.refreshTimeline();
                            }
                            if (isReply && window.parent.refreshThread) {
                                window.parent.refreshThread(parentPostId);
                            }
                            
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
    }

    $("#insertFile").click(function() {
        $("#insertion").click();
    });

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