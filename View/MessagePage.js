$(document).ready(function() {
    
    function loadFAQ() {
        $.ajax({
            url: '/api/contact',
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    displayFAQ(response.data);
                }
            },
            error: function(error) {
                console.error('Error loading FAQ:', error);
            }
        });
    }
    
    function displayFAQ(contacts) {
        const faqContainer = $('#faq-section');
        faqContainer.empty();
        
        if (!contacts || contacts.length === 0) {
            faqContainer.append('<p>No contact submissions yet.</p>');
            return;
        }
        
        // Show most recent first
        contacts.slice(0, 5).forEach(contact => {
            const user = contact.userId || {};
            const displayName = user.displayName || user.username || 'Anonymous';
            const username = user.username ? '@' + user.username : '@anonymous';
            
            // Truncate description for preview
            let previewText = contact.description;
            if (previewText.length > 100) {
                previewText = previewText.substring(0, 100) + '...';
            }
            
            const faqHtml = `
                <div class="faq-post">
                    <h2 class="display-name">${displayName}</h2>
                    <h3 class="user-id">${username}</h3>
                    <p><strong>${contact.contactPurpose}</strong></p>
                    <p>${previewText}</p>
                    <small>${new Date(contact.contactDate).toLocaleDateString()}</small>
                </div>
            `;
            
            faqContainer.append(faqHtml);
        });
    }
    
    // Load FAQ when page loads
    loadFAQ();
    
    // Refresh when switching to FAQ tab
    $(".faq-tab").click(function() {
        setTimeout(loadFAQ, 200); // Small delay for animation
    });
});