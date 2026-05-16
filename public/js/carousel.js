/**
 * Huye Homes - Hero Carousel Module
 * Displays latest properties in an auto-sliding carousel with navigation arrows & dots
 * Maintains design integrity and uses external JS as requested.
 * Fetches property data from backend API endpoint.
 */

// Async function to fetch latest properties from API
// Updated fetchLatestProperties with relative URL
async function fetchLatestProperties() {
    try {
        const response = await fetch('/api/properties/featured?limit=3');
        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data.map(prop => ({
                id: prop.id,
                title: prop.title,
                location: prop.location,
                price: prop.listing_type === 'sale' 
                    ? `${prop.price.toLocaleString()} RWF` 
                    : `${prop.price.toLocaleString()} RWF/mo`,
                type: prop.property_type, // 'residential_land', 'student_housing', etc.
                imageUrl: prop.primary_image || prop.images?.[0]?.image_url || '/images/placeholder.jpg',
                alt: prop.title
            }));
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch properties for carousel:', error);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // DOM elements
    const slidesContainer = document.getElementById('heroCarouselSlides');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const dotsContainer = document.getElementById('carouselDots');

    if (!slidesContainer || !prevBtn || !nextBtn || !dotsContainer) {
        console.warn('Carousel elements not found. Ensure IDs exist in the DOM.');
        return;
    }

    // Fetch properties from API
    const latestProperties = await fetchLatestProperties();
    
    // Show fallback message if API fails or returns no data
    if (latestProperties.length === 0) {
        slidesContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 40px; text-align: center;">
                <p style="color: #6b7280; font-size: 16px; font-weight: 500;">
                    Unable to load properties. Please try again later.
                </p>
            </div>
        `;
        // Hide navigation buttons and dots when no data
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        dotsContainer.style.display = 'none';
        return;
    }

    let currentIndex = 0;
    let slideElements = [];
    let autoSlideInterval = null;
    const AUTO_SLIDE_DELAY = 5000; // 5 seconds between slides

    // Build carousel slides and dots from latestProperties data
    function buildCarousel() {
        // Clear containers
        slidesContainer.innerHTML = '';
        dotsContainer.innerHTML = '';
        
        // Create slides
        latestProperties.forEach((property, idx) => {
            // Create slide div
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            if (idx === 0) slide.classList.add('active');
            
            // Image element
            const img = document.createElement('img');
            img.src = property.imageUrl;
            img.alt = property.alt || `${property.title} - ${property.location}`;
            img.loading = 'eager';
            
            // Optional caption badge (adds context without clutter)
            // Determine icon based on property type
let iconClass = 'fa-mountain'; // default for land
if (property.type === 'student_housing') iconClass = 'fa-graduation-cap';
else if (property.type === 'agricultural_land') iconClass = 'fa-tractor';
else if (property.type === 'commercial') iconClass = 'fa-store';

caption.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${property.title} • ${property.location} • ${property.price}`;
            slide.appendChild(img);
            slide.appendChild(caption);
            slidesContainer.appendChild(slide);
            slideElements.push(slide);
            
            // Create dot indicator
            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            if (idx === 0) dot.classList.add('active');
            dot.setAttribute('data-index', idx);
            dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
            dot.addEventListener('click', () => {
                stopAutoSlide();
                goToSlide(idx);
                startAutoSlide();
            });
            dotsContainer.appendChild(dot);
        });
    }

    // Update active slide and active dot
    function goToSlide(index) {
        // Handle boundary wrapping
        if (index < 0) index = slideElements.length - 1;
        if (index >= slideElements.length) index = 0;
        
        // Remove active class from all slides
        slideElements.forEach((slide, i) => {
            slide.classList.remove('active');
            const dot = dotsContainer.children[i];
            if (dot) dot.classList.remove('active');
        });
        
        // Add active class to current slide and dot
        slideElements[index].classList.add('active');
        const activeDot = dotsContainer.children[index];
        if (activeDot) activeDot.classList.add('active');
        
        currentIndex = index;
    }
    
    function nextSlide() {
        goToSlide(currentIndex + 1);
    }
    
    function prevSlide() {
        goToSlide(currentIndex - 1);
    }
    
    // Auto-slide functionality
    function startAutoSlide() {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(() => {
            nextSlide();
        }, AUTO_SLIDE_DELAY);
    }
    
    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }
    
    // Reset auto-slide timer on user interaction (pause then resume)
    function resetAutoSlide() {
        stopAutoSlide();
        startAutoSlide();
    }
    
    // Event listeners for navigation arrows
    prevBtn.addEventListener('click', () => {
        stopAutoSlide();
        prevSlide();
        startAutoSlide();
    });
    
    nextBtn.addEventListener('click', () => {
        stopAutoSlide();
        nextSlide();
        startAutoSlide();
    });
    
    // Pause auto-slide on hover for better UX (optional but user-friendly)
    const carouselContainer = document.querySelector('.hero-carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            stopAutoSlide();
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            startAutoSlide();
        });
    }
    
    // Touch/swipe support for mobile (enhancement)
    let touchStartX = 0;
    let touchEndX = 0;
    
    carouselContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoSlide();
    }, { passive: true });
    
    carouselContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left -> next
            nextSlide();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right -> previous
            prevSlide();
        }
        startAutoSlide();
    });
    
    // Keyboard accessibility: left/right arrows
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            stopAutoSlide();
            prevSlide();
            startAutoSlide();
        } else if (e.key === 'ArrowRight') {
            stopAutoSlide();
            nextSlide();
            startAutoSlide();
        }
    });
    
    // Initialize carousel
    buildCarousel();
    startAutoSlide();
    
    // Optional: preload adjacent images for smoother experience
    function preloadAdjacentImages() {
        const preloadUrls = [];
        latestProperties.forEach(prop => {
            if (!preloadUrls.includes(prop.imageUrl)) {
                preloadUrls.push(prop.imageUrl);
            }
        });
        preloadUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }
    preloadAdjacentImages();
    
    // Handle window visibility API to stop auto-slide when tab inactive
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoSlide();
        } else {
            startAutoSlide();
        }
    });
    
    // Log successful initialization (for dev purposes)
    console.log('Huye Homes Hero Carousel initialized with', latestProperties.length, 'properties');
});