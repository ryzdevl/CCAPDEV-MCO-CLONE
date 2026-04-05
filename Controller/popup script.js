function validatePasswordForm(event) {
    event.preventDefault();

    let newPass = document.getElementById("password").value;
    let confirmPass = document.getElementById("passwordconfirm").value;

    if (newPass === "" || confirmPass === "") {
        alert("Please fill in all fields.");
        return;
    }

    if (newPass !== confirmPass) {
        alert("Passwords do not match.");
        return;
    }

    if (newPass.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    // If everything is correct
    document.getElementById("popup").style.display = "flex";
}

function validateDeleteForm(event) {
    event.preventDefault();

    let password = document.getElementById("password").value;
    let confirmPass2 = document.getElementById("passwordconfirm").value;
    let confirmDelete = document.getElementById("confirmdelete").value;

    if (password === "" || confirmPass2 === "") {
        alert("Please fill in all fields.");
        return;
    }

    if (password !== confirmPass2) {
        alert("Passwords do not match.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    if (confirmDelete !== "Yes" && confirmDelete !== "yes" && confirmDelete !== "YES"){
        alert("Please confirm deletion.");
        return;
    }

    document.getElementById("popup").style.display = "flex";
}

function openPopup() {
    document.getElementById("popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}