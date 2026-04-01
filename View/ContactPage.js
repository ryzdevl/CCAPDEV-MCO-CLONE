$(document).ready(function() {
    
    // Get current user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    let currentUser = null;
    
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        console.log("Contact page - current user:", currentUser);
        
        // Auto-fill the user field
        $('#contact-user-id').val('@' + currentUser.username);
    } else {
        alert("You must be logged in to contact!");
        return;
    }
    
    // Get recipient from URL (if coming from someone's profile)
    const urlParams = new URLSearchParams(window.location.search);
    const recipientId = urlParams.get('userId');
    
    // Auto-fill today's date
    var today = new Date().toISOString().split('T')[0];
    $('#contact-date').val(today);
    
    // Handle form submission
    $('#contact-section-form').submit(function(e) {
        e.preventDefault();
        
        var contactPurpose = $('input[name="contact-purpose"]').val();
        var description = $('#description').val();
        
        // Validation
        if (!contactPurpose || contactPurpose === "Purpose") {
            alert("Please enter a purpose");
            return;
        }
        
        if (!description || description === "bruh") {
            alert("Please enter a description");
            return;
        }
        
        var contactData = {
            userId: currentUser._id,
            recipientId: recipientId || currentUser._id,
            contactPurpose: contactPurpose,
            description: description
        };
        
        console.log("Submitting contact:", contactData);
        
        // Disable submit button
        $('input[type="submit"]').prop('disabled', true).val('Submitting...');
        
        $.ajax({
            url: '/api/contact',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(contactData),
            success: function(response) {
                if (response.success) {
                    alert('Contact form submitted successfully!');
                    
                    // Clear form
                    $('input[name="contact-purpose"]').val('');
                    $('#description').val('');
                    
                    // Reload messages for this recipient
                    if (recipientId) {
                        loadMessagesForRecipient(recipientId);
                    } else {
                        loadMessagesForRecipient(currentUser._id);
                    }
                } else {
                    alert('Error: ' + (response.error || 'Failed to submit'));
                }
            },
            error: function(error) {
                console.error('Error submitting contact:', error);
                alert('Failed to submit contact form');
            },
            complete: function() {
                $('input[type="submit"]').prop('disabled', false).val('Submit');
            }
        });
    });
    
    // Load messages for a specific recipient
    function loadMessagesForRecipient(userId) {
            $('#faq-section').html('<p>Loading messages...</p>');
            
            $.ajax({
                url: `/api/contact?userId=${userId}`,
                method: 'GET',
                success: function(response) {
                    if (response.success) {
                        displayMessages(response.data);
                    } else {
                        $('#faq-section').html('<p>Failed to load messages</p>');
                    }
                },
                error: function(error) {
                    console.error('Error loading messages:', error);
                    $('#faq-section').html('<p>Error loading messages</p>');
                }
            });
        }
        
        function displayMessages(messages) {
        const container = $('#faq-section');
        container.empty();
        
        if (!messages || messages.length === 0) {
            container.html('<p>No messages yet.</p>');
            return;
        }
        
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const sender = msg.userId || {};
            const date = new Date(msg.contactDate).toLocaleString();
            
            const messageHtml = `
                <div class="message-item">
                    <div class="message-header">
                        <img src="${sender.profilePic || '/assets/defaultuser.png'}" class="message-pfp">
                        <div class="message-userinfo">
                            <span class="message-displayname">${sender.displayName || sender.username}</span>
                            <span class="message-username">@${sender.username}</span>
                            <span class="message-date">${date}</span>
                        </div>
                    </div>
                    <div class="message-purpose">${msg.contactPurpose}</div>
                    <div class="message-description">${msg.description}</div>
                </div>
            `;
            container.append(messageHtml);
        }
    }
    
    // Load messages when clicking Messages tab
    $('.faq-tab').click(function(e) {
        e.preventDefault();
        $("#faq-section").fadeIn(200);
        $("#contact-section-form").fadeOut(200);
        $(this).addClass("active");
        $(".contact-tab").removeClass("active");
        
        // Load messages for the recipient
        const targetUserId = recipientId || currentUser._id;
        loadMessagesForRecipient(targetUserId);
    });
    
    $('.contact-tab').click(function(e) {
        e.preventDefault();
        $("#contact-section-form").fadeIn(200);
        $("#faq-section").fadeOut(200);
        $(this).addClass("active");
        $(".faq-tab").removeClass("active");
    });
    
    // Clear default text on focus
    $('#description').focus(function() {
        if ($(this).val() === "bruh") {
            $(this).val('');
        }
    });
    
    $('input[name="contact-purpose"]').focus(function() {
        if ($(this).val() === "Purpose") {
            $(this).val('');
        }
    });
    
    // Load initial messages if recipient exists
    if (recipientId) {
        loadMessagesForRecipient(recipientId);
    }
});