$(document).ready(function() {
    
    // Get current user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    let currentUser = null;
    
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        console.log("Report page - current user:", currentUser);
        
        // Auto-fill the user field
        $('#report-user-id').val('@' + currentUser.username);
    } else {
        alert("You must be logged in to file a report!");
        // Close modal if in iframe
        if (window.parent) {
            window.parent.$("#report-modal").fadeOut(300);
        }
        return;
    }
    
    // Auto-fill today's date
    var today = new Date().toISOString().split('T')[0];
    $('#report-date').val(today);
    
    // Show/hide harassment section based on category selection
    $('#categories').change(function() {
        if ($(this).val() === 'harassment') {
            $('#harassment-section').show();
        } else {
            $('#harassment-section').hide();
        }
    });
    
    // Handle form submission
    $('#report-form').submit(function(e) {
        e.preventDefault();
        
        // Get form values
        var severity = $('input[name="severity"]:checked').val();
        var category = $('#categories').val();
        var description = $('#description').val();
        
        // Validation
        if (!severity) {
            alert("Please select a severity level");
            return;
        }
        
        if (!category) {
            alert("Please select a category");
            return;
        }
        
        if (!description || description === "Describe the report to be filed.") {
            alert("Please provide a description");
            return;
        }
        
        // Prepare report data
        var reportData = {
            reporterId: currentUser._id,
            severity: severity,
            category: category,
            description: description
        };
        
        // Add harassment subcategory if applicable
        if (category === 'harassment') {
            var harassmentSub = $('#harassment').val();
            reportData.harassmentSub = harassmentSub;
        }
        
        console.log("Submitting report:", reportData);
        
        // Disable submit button
        $('input[type="submit"]').prop('disabled', true).val('Submitting...');
        
        // Send to server
        $.ajax({
            url: '/api/reports',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(reportData),
            success: function(response) {
                if (response.success) {
                    alert('Report submitted successfully!');
                    
                    // Close modal
                    if (window.parent) {
                        window.parent.$("#report-modal").fadeOut(300);
                    }
                } else {
                    alert('Error: ' + (response.error || 'Failed to submit report'));
                    $('input[type="submit"]').prop('disabled', false).val('Submit');
                }
            },
            error: function(error) {
                console.error('Error submitting report:', error);
                alert('Failed to submit report. Please try again.');
                $('input[type="submit"]').prop('disabled', false).val('Submit');
            }
        });
    });
    
    // Clear default text on focus
    $('#description').focus(function() {
        if ($(this).val() === "Describe the report to be filed.") {
            $(this).val('');
        }
    });
    
    // Restore default text if empty on blur
    $('#description').blur(function() {
        if ($(this).val().trim() === '') {
            $(this).val('Describe the report to be filed.');
        }
    });
});