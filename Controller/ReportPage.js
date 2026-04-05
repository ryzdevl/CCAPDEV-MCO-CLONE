$(document).ready(function() {
    getCurrentUser(function() {
        let currentUser = window.currentUser;
        
        $('#report-user-id').val('@' + currentUser.username);
        
        var today = new Date().toISOString().split('T')[0];
        $('#report-date').val(today);
        
        $('#categories').change(function() {
            if ($(this).val() === 'harassment') {
                $('#harassment-section').show();
            } else {
                $('#harassment-section').hide();
            }
        });
        
        $('#report-form').submit(function(e) {
            e.preventDefault();
            
            var severity = $('input[name="severity"]:checked').val();
            var category = $('#categories').val();
            var description = $('#description').val();
            
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
            
            var reportData = {
                reporterId: currentUser._id,
                severity: severity,
                category: category,
                description: description
            };
            
            if (category === 'harassment') {
                var harassmentSub = $('#harassment').val();
                reportData.harassmentSub = harassmentSub;
            }
            
            console.log("Submitting report:", reportData);
            
            $('input[type="submit"]').prop('disabled', true).val('Submitting...');
            
            $.ajax({
                url: '/api/reports',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(reportData),
                success: function(response) {
                    if (response.success) {
                        alert('Report submitted successfully!');
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
        
        $('#description').focus(function() {
            if ($(this).val() === "Describe the report to be filed.") {
                $(this).val('');
            }
        });
        
        $('#description').blur(function() {
            if ($(this).val().trim() === '') {
                $(this).val('Describe the report to be filed.');
            }
        });
    });
});