function openModal(src) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("fullImage");
    
    modal.style.display = "block";
    modalImg.src = src; 
}

function closeModal() {
    document.getElementById("imageModal").style.display = "none";
}