// public/js/main.js
// API Base URL (Vercel handles this automatically)
const API_BASE = window.location.origin + '/api';

// Load featured properties on homepage
async function loadFeaturedProperties() {
  try {
    const response = await fetch(`${API_BASE}/properties/featured?limit=3`);
    const { data: properties } = await response.json();
    
    const container = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    if (!container) return;
    
    container.innerHTML = properties.map(prop => `
      <div class="property-card">
        <div class="card-image">
          <img src="${prop.primary_image || '/images/placeholder.jpg'}" alt="${prop.title}">
          <div class="card-badges">
            ${prop.is_verified ? '<span class="badge badge-verified"><i class="fa-solid fa-shield-check"></i> Verified</span>' : ''}
            ${prop.is_featured ? '<span class="badge badge-hot"><i class="fa-solid fa-fire"></i> Featured</span>' : ''}
          </div>
          <button class="card-favorite"><i class="fa-regular fa-heart"></i></button>
        </div>
        <div class="card-content">
          <h3 class="card-title">${prop.title}</h3>
          <p class="card-location"><i class="fa-solid fa-map-marker-alt"></i> ${prop.location}</p>
          <div class="card-features">
            <div class="feature-item"><i class="fa-solid fa-ruler-combined"></i> ${prop.size || 'N/A'} ${prop.size_unit || 'sqm'}</div>
          </div>
          <div class="card-footer">
            <div class="card-price">${prop.price.toLocaleString()} <span>RWF</span></div>
            <a href="/public/property-detail.html?slug=${prop.slug}" class="btn-primary text-sm py-2 px-4">View Details</a>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load properties:', error);
  }
}

// Search functionality
async function searchProperties(query) {
  try {
    const response = await fetch(`${API_BASE}/properties/search?q=${encodeURIComponent(query)}`);
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

// Submit contact form
async function submitInquiry(formData) {
  try {
    const response = await fetch(`${API_BASE}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    return await response.json();
  } catch (error) {
    console.error('Submission failed:', error);
    throw error;
  }
}

// Load property detail
async function loadPropertyDetail(slug) {
  try {
    const response = await fetch(`${API_BASE}/properties/${slug}`);
    const { data: property } = await response.json();
    return property;
  } catch (error) {
    console.error('Failed to load property:', error);
    return null;
  }
}

// Initialize page based on current URL
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path === '/' || path === '//public/index.html') {
    loadFeaturedProperties();
  }
  
  if (path === '//public/property-detail.html') {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    if (slug) {
      loadPropertyDetail(slug).then(property => {
        if (property) {
          // Populate property detail page
          document.getElementById('propertyTitle').textContent = property.title;
          document.getElementById('propertyPrice').textContent = `${property.price.toLocaleString()} RWF`;
          // ... populate other fields
        }
      });
    }
  }
  
  // Contact form handler
  const contactForm = document.querySelector('form[data-form="contact"]');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        message: document.getElementById('message').value,
        property_id: document.getElementById('property_id')?.value
      };
      
      try {
        await submitInquiry(formData);
        alert('Message sent successfully! We will contact you soon.');
        contactForm.reset();
      } catch (error) {
        alert('Failed to send message. Please try again.');
      }
    });
  }
});