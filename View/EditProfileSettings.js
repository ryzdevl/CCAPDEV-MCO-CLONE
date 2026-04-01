$(document).ready(function() {
    // Form submission
    $("#edit-profile-form").submit(function(e) {  // MATCHES FORM ID
        e.preventDefault();
        alert("Changes applied! (Demo)");
        if (window.parent) {
            window.parent.$("#profile-settings-modal").fadeOut(300);
            window.parent.$("#profile-iframe").attr("src", "");
        }
        this.reset();
    });
    
    // Clear button
    $("#clearChanges").click(function() {
        $("#display-name").val("<Current Display Name>");
        $("#username").val("@username");
        $("#bio-Box").val("");
    });
});