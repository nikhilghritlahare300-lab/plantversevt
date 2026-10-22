// Shop specific logic
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('shop-products');
    const catFilters = document.querySelectorAll('#category-filters input');
    const priceSlider = document.getElementById('price-slider');
    const priceValue = document.getElementById('price-value');
    const sortSelect = document.getElementById('sort-select');
    const resultCount = document.getElementById('result-count');
    const searchIcon = document.getElementById('search-icon');
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    // Search Modal Toggle
    if(searchIcon) {
        searchIcon.addEventListener('click', () => {
            searchModal.classList.add('active');
            setTimeout(() => searchInput.focus(), 300);
        });
    }
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if(query.length < 2) { searchResults.innerHTML = ''; return; }
        
        const matches = products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
        
        if(matches.length === 0) {
            searchResults.innerHTML = '<p>No products found.</p>';
        } else {
            searchResults.innerHTML = matches.map(p => `
                <div style="display:flex; gap:15px; margin-bottom:15px; cursor:pointer;" onclick="window.location.href='shop.html?search=${p.id}'">
                    <img src="${p.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
                    <div>
                        <h4 style="font-size:1rem; margin-bottom:5px;">${p.name}</h4>
                        <div style="color:var(--primary-color);">₹${p.price}</div>
                    </div>
                </div>
            `).join('');
        }
    });

    // Check URL for category
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam) {
        catFilters.forEach(cb => {
            if (cb.value === catParam) cb.checked = true;
        });
    }

    function renderShop() {
        // Get checked categories
        const checkedCats = Array.from(catFilters).filter(cb => cb.checked).map(cb => cb.value);
        const maxPrice = parseInt(priceSlider.value);
        
        // Filter
        let filtered = products.filter(p => {
            const passCat = checkedCats.length === 0 || checkedCats.includes(p.category) || checkedCats.includes(p.secondaryCategory);
            const passPrice = p.price <= maxPrice;
            return passCat && passPrice;
        });
        
        // Sort
        const sortVal = sortSelect.value;
        if(sortVal === 'price-low') filtered.sort((a,b) => a.price - b.price);
        if(sortVal === 'price-high') filtered.sort((a,b) => b.price - a.price);
        if(sortVal === 'rating') filtered.sort((a,b) => b.rating - a.rating);
        
        // Render
        resultCount.innerText = `Showing ${filtered.length} results`;
        
        if(filtered.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px;">No products match your filters.</div>';
        } else {
            container.innerHTML = filtered.map(createProductCard).join('');
            setupObservers(); // This assumes setupObservers is defined globally in app.js
        }
    }
    
    catFilters.forEach(cb => cb.addEventListener('change', renderShop));
    priceSlider.addEventListener('input', (e) => {
        priceValue.innerText = e.target.value;
        renderShop();
    });
    sortSelect.addEventListener('change', renderShop);
    
    renderShop();
});
