// State
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// DOM Elements
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('modal-overlay-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total-price');
const cartCount = document.getElementById('cart-count');
const wishlistCount = document.getElementById('wishlist-count');
const toastContainer = document.getElementById('toast-container');
const quickViewModal = document.getElementById('quick-view-modal');

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updateWishlistCount();
    setupObservers();
    setupModals();
    setupBackToTop();
    setupNavbarScroll();
    renderFeaturedProducts();
});

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Render Products (Helper)
function createProductCard(product) {
    const isWishlisted = wishlist.includes(product.id);
    return `
        <div class="product-card fade-in" data-id="${product.id}">
            ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
            <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${product.id}, event)">
                <i class="fas fa-heart"></i>
            </button>
            <div class="product-image" onclick="openQuickView(${product.id})">
                <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1554631221-f9603e6808be?w=500&q=80';">
                <div class="quick-view-overlay">
                    <span class="btn btn-outline" style="padding: 5px 15px; font-size: 0.8rem;">Quick View</span>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-rating">
                    ${getRatingStars(product.rating)}
                    <span>(${product.reviews})</span>
                </div>
                <div class="product-price-row">
                    <div class="product-price">₹${product.price}</div>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id}, event)">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getRatingStars(rating) {
    let stars = '';
    for(let i=1; i<=5; i++) {
        if(i <= rating) stars += '<i class="fas fa-star"></i>';
        else if(i - 0.5 <= rating) stars += '<i class="fas fa-star-half-alt"></i>';
        else stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

// Featured Products
function renderFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if(!container) return;
    
    // Skeleton loading simulation
    container.innerHTML = Array(8).fill('<div class="product-card skeleton" style="height: 380px;"></div>').join('');
    
    setTimeout(() => {
        const featured = products.slice(0, 8);
        container.innerHTML = featured.map(createProductCard).join('');
        setupObservers(); // Re-observe new elements
    }, 800);
}

// Cart Logic
window.addToCart = function(productId, event) {
    if(event) event.stopPropagation();
    
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    
    if(existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    updateCartCount();
    showToast(`${product.name} added to cart!`);
};

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCartItems();
};

window.updateQuantity = function(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if(item) {
        item.quantity += delta;
        if(item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            renderCartItems();
        }
    }
};

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    if(cartCount) cartCount.innerText = total;
}

function renderCartItems() {
    if(!cartItemsContainer) return;
    
    if(cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; margin-top:20px; color:#777;">Your cart is empty.</p>';
        cartTotalEl.innerText = '₹0';
        return;
    }
    
    let html = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        html += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1554631221-f9603e6808be?w=500&q=80';">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">₹${item.price}</div>
                    <div class="qty-control" style="margin-top:5px; margin-bottom:0;">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = html;
    cartTotalEl.innerText = `₹${total}`;
}

// Wishlist Logic
window.toggleWishlist = function(productId, event) {
    if(event) event.stopPropagation();
    
    const index = wishlist.indexOf(productId);
    const btn = event.currentTarget;
    
    if(index > -1) {
        wishlist.splice(index, 1);
        btn.classList.remove('active');
        showToast('Removed from wishlist');
    } else {
        wishlist.push(productId);
        btn.classList.add('active');
        showToast('Added to wishlist');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
};

function updateWishlistCount() {
    if(wishlistCount) wishlistCount.innerText = wishlist.length;
}

// Quick View Logic
window.openQuickView = function(productId) {
    const product = products.find(p => p.id === productId);
    if(!product || !quickViewModal) return;
    
    document.getElementById('qv-image-el').src = product.image;
    document.getElementById('qv-title').innerText = product.name;
    document.getElementById('qv-price').innerText = `₹${product.price}`;
    document.getElementById('qv-desc').innerText = product.description;
    
    const addToCartBtn = document.getElementById('qv-add-cart');
    addToCartBtn.onclick = () => {
        addToCart(product.id);
        closeModal(quickViewModal);
    };
    
    openModal(quickViewModal);
};

// Modals Setup
function setupModals() {
    // Open cart
    const cartIcon = document.getElementById('cart-icon');
    if(cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            cartSidebar.classList.add('open');
            cartOverlay.classList.add('active');
            renderCartItems();
        });
    }
    
    // Close cart
    const closeCartBtn = document.getElementById('close-cart');
    if(closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('active');
        });
    }
    cartOverlay?.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('active');
    });
    
    // Auth Modals
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    
    document.getElementById('user-icon')?.addEventListener('click', (e) => {
        e.preventDefault();
        if(currentUser) {
            // handle dropdown/logout
        } else {
            openModal(loginModal);
        }
    });
    
    document.getElementById('show-register')?.addEventListener('click', () => {
        closeModal(loginModal);
        setTimeout(() => openModal(registerModal), 300);
    });
    
    document.getElementById('show-login')?.addEventListener('click', () => {
        closeModal(registerModal);
        setTimeout(() => openModal(loginModal), 300);
    });
    
    // Close all modals via close button or overlay click
    document.querySelectorAll('.close-modal, .modal-overlay').forEach(el => {
        el.addEventListener('click', function(e) {
            if(e.target === this) {
                const modal = this.closest('.modal-overlay') || this;
                closeModal(modal);
            }
        });
    });
}

function openModal(modal) {
    if(modal) modal.classList.add('active');
}
function closeModal(modal) {
    if(modal) modal.classList.remove('active');
}

// Intersection Observer for animations
function setupObservers() {
    const faders = document.querySelectorAll('.fade-in:not(.visible)');
    
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        });
    }, appearOptions);
    
    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });
}

// Navbar scroll effect
function setupNavbarScroll() {
    const header = document.querySelector('header');
    if(!header) return;
    
    window.addEventListener('scroll', () => {
        if(window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Back to top
function setupBackToTop() {
    const btn = document.getElementById('back-to-top');
    if(!btn) return;
    
    window.addEventListener('scroll', () => {
        if(window.scrollY > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
