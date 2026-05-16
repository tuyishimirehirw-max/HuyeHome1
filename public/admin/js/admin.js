// public/admin/js/admin.js
const API_BASE = window.location.origin + '/api';
let token = localStorage.getItem('admin_token');

// If not on login page and no token, redirect
if (!token && !window.location.pathname.includes('login.html')) {
    window.location.href = '/admin/login.html';
}

// Handle login form (if on login page)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        try {
            const res = await fetch(`${API_BASE}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                localStorage.setItem('admin_token', data.data.token);
                window.location.href = '/admin/';
            } else {
                alert('Login failed: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            alert('Network error: ' + err.message);
        }
    });
}

// Only run dashboard code if we are on the main admin page
const dashboardContainer = document.getElementById('dashboardContainer');
if (dashboardContainer) {
    // Show dashboard, hide login container
    document.getElementById('loginContainer').style.display = 'none';
    dashboardContainer.style.display = 'block';

    // Helper function to fetch with auth header
    async function fetchWithAuth(url, options = {}) {
        const res = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        if (res.status === 401) {
            localStorage.removeItem('admin_token');
            window.location.href = '/admin/login.html';
            throw new Error('Unauthorized');
        }
        return res.json();
    }

    // Load dashboard stats
    async function loadDashboardStats() {
        try {
            const data = await fetchWithAuth(`${API_BASE}/admin/stats`);
            if (data.success) {
                const stats = data.data;
                const statsGrid = document.getElementById('statsGrid');
                if (statsGrid) {
                    statsGrid.innerHTML = `
                        <div class="stat-card"><i class="fas fa-building"></i><div class="stat-value">${stats.totalProperties || 0}</div><div class="stat-label">Total Properties</div></div>
                        <div class="stat-card"><i class="fas fa-check-circle"></i><div class="stat-value">${stats.availableProperties || 0}</div><div class="stat-label">Available</div></div>
                        <div class="stat-card"><i class="fas fa-shopping-cart"></i><div class="stat-value">${stats.soldProperties || 0}</div><div class="stat-label">Sold/Rented</div></div>
                        <div class="stat-card"><i class="fas fa-envelope"></i><div class="stat-value">${stats.totalInquiries || 0}</div><div class="stat-label">Inquiries</div></div>
                        <div class="stat-card"><i class="fas fa-star"></i><div class="stat-value">${stats.featuredProperties || 0}</div><div class="stat-label">Featured</div></div>
                        <div class="stat-card"><i class="fas fa-eye"></i><div class="stat-value">${stats.totalViews || 0}</div><div class="stat-label">Views</div></div>
                    `;
                }
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }

    // Load properties list
    async function loadProperties() {
        try {
            const data = await fetchWithAuth(`${API_BASE}/admin/properties`);
            if (data.success && data.data.properties) {
                const props = data.data.properties;
                const container = document.getElementById('propertiesList');
                if (container) {
                    if (props.length === 0) {
                        container.innerHTML = '<p class="text-gray-500">No properties found.</p>';
                    } else {
                        container.innerHTML = `
                            <table class="data-table">
                                <thead><tr><th>ID</th><th>Title</th><th>Type</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    ${props.map(p => `
                                        <tr>
                                            <td>${p.id}</td>
                                            <td>${escapeHtml(p.title)}</td>
                                            <td>${p.property_type}</td>
                                            <td>${p.price.toLocaleString()} RWF</td>
                                            <td><span class="status-badge status-${p.status}">${p.status}</span></td>
                                            <td><button class="btn-sm" onclick="deleteProperty(${p.id})">Delete</button></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `;
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load properties:', err);
        }
    }

    // Load inquiries
    async function loadInquiries() {
        try {
            const data = await fetchWithAuth(`${API_BASE}/admin/inquiries`);
            if (data.success && data.data.inquiries) {
                const inquiries = data.data.inquiries;
                const container = document.getElementById('inquiriesList');
                if (container) {
                    if (inquiries.length === 0) {
                        container.innerHTML = '<p class="text-gray-500">No inquiries yet.</p>';
                    } else {
                        container.innerHTML = `
                            <table class="data-table">
                                <thead><tr><th>Name</th><th>Phone</th><th>Property</th><th>Status</th><th>Date</th></tr></thead>
                                <tbody>
                                    ${inquiries.map(i => `
                                        <tr>
                                            <td>${escapeHtml(i.name)}</td>
                                            <td>${escapeHtml(i.phone)}</td>
                                            <td>${i.properties?.title || 'General'}</td>
                                            <td><span class="status-badge status-${i.status}">${i.status}</span></td>
                                            <td>${new Date(i.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `;
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load inquiries:', err);
        }
    }

    // Helper to escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // Delete property (global function for onclick)
    window.deleteProperty = async (id) => {
        if (confirm('Delete this property?')) {
            try {
                await fetchWithAuth(`${API_BASE}/admin/properties?id=${id}`, { method: 'DELETE' });
                loadProperties(); // refresh list
            } catch (err) {
                alert('Delete failed: ' + err.message);
            }
        }
    };

    // Add property form submission
    const propertyForm = document.getElementById('propertyForm');
    if (propertyForm) {
        propertyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(propertyForm);
            try {
                const res = await fetch(`${API_BASE}/admin/properties`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    alert('Property added!');
                    propertyForm.reset();
                    // Switch to properties view
                    document.querySelector('[data-view="properties"]').click();
                } else {
                    alert('Error: ' + (data.message || 'Unknown error'));
                }
            } catch (err) {
                alert('Network error: ' + err.message);
            }
        });
    }

    // Navigation between views
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            if (!view) return;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            const targetView = document.getElementById(view + 'View');
            if (targetView) targetView.classList.add('active');
            if (view === 'dashboard') loadDashboardStats();
            if (view === 'properties') loadProperties();
            if (view === 'inquiries') loadInquiries();
        });
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login.html';
    });

    // Initial load
    loadDashboardStats();
    loadProperties();
    loadInquiries();
}

// Helper to show add property form (called from button in properties view)
function showAddPropertyForm() {
    const addPropertyBtn = document.querySelector('[data-view="add-property"]');
    if (addPropertyBtn) addPropertyBtn.click();
}