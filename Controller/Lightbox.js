const Lightbox = {
    images: [],
    currentIndex: 0,

    open: function(images, startIndex) {
        this.images = images;
        this.currentIndex = startIndex || 0;

        this.buildThumbnails();
        this.showImage(this.currentIndex);

        $('#image-lightbox').addClass('active');
        $(document).on('keydown.lightbox', (e) => {
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft')  this.prev();
            if (e.key === 'Escape')     this.close();
        });
    },

    close: function() {
        $('#image-lightbox').removeClass('active');
        $('#lightbox-main-img').attr('src', '');
        $('#lightbox-thumbnails').empty();
        $(document).off('keydown.lightbox');
        this.images = [];
        this.currentIndex = 0;
    },

    showImage: function(index) {
        this.currentIndex = index;
        const src = this.images[index];

        // Fade transition
        const $img = $('#lightbox-main-img');
        $img.css('opacity', 0);
        $img.attr('src', src);
        $img.on('load', function() {
            $img.animate({ opacity: 1 }, 150);
        });

        // Update thumbnails
        $('.lightbox-thumb').removeClass('active');
        $(`.lightbox-thumb[data-index="${index}"]`).addClass('active');

        // Scroll thumbnail into view
        const $thumb = $(`.lightbox-thumb[data-index="${index}"]`);
        if ($thumb.length) {
            const container = $('#lightbox-thumbnails')[0];
            container.scrollLeft = $thumb[0].offsetLeft - container.offsetWidth / 2 + 30;
        }

        // Update counter
        $('#lightbox-counter').text((index + 1) + ' / ' + this.images.length);

        // Show/hide nav
        $('.lightbox-prev').toggle(this.images.length > 1);
        $('.lightbox-next').toggle(this.images.length > 1);
    },

    buildThumbnails: function() {
        const $container = $('#lightbox-thumbnails');
        $container.empty();

        if (this.images.length <= 1) {
            $container.hide();
            return;
        }

        $container.show();
        this.images.forEach((src, i) => {
            const $thumb = $(`<img 
                class="lightbox-thumb ${i === this.currentIndex ? 'active' : ''}" 
                src="${src}" 
                data-index="${i}"
                alt="Thumbnail ${i + 1}"
            >`);
            $thumb.click(() => this.showImage(i));
            $container.append($thumb);
        });
    },

    next: function() {
        const next = (this.currentIndex + 1) % this.images.length;
        this.showImage(next);
    },

    prev: function() {
        const prev = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.showImage(prev);
    }
};

window.Lightbox = Lightbox;

// Global openModal function called from PostLayout
window.openModal = function(clickedSrc, allImages) {
    const index = allImages ? allImages.indexOf(clickedSrc) : 0;
    Lightbox.open(allImages || [clickedSrc], index >= 0 ? index : 0);
};

window.closeLightbox = function() { Lightbox.close(); };
window.lightboxNext  = function() { Lightbox.next(); };
window.lightboxPrev  = function() { Lightbox.prev(); };