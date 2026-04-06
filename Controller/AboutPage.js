document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.faq-item, .Features');
    elements.forEach(el => el.classList.add('visible'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0, rootMargin: '200px' });

    elements.forEach(el => observer.observe(el));
});