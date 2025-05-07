document.addEventListener('DOMContentLoaded', function() {
    // Load components data
    fetch('data/components.xml')
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            const components = parseComponents(data);
            initCatalog(components);
        })
        .catch(error => {
            console.error('Error loading catalog data:', error);
            showError();
        });
});

function parseComponents(xml) {
    const components = [];
    const categories = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case'];
    
    categories.forEach(category => {
        const items = xml.querySelectorAll(category);
        
        items.forEach(item => {
            components.push({
                id: item.getAttribute('id'),
                category: category,
                name: item.querySelector('name').textContent,
                brand: item.querySelector('brand').textContent,
                price: parseFloat(item.querySelector('price').textContent),
                oldPrice: item.querySelector('oldPrice') ? parseFloat(item.querySelector('oldPrice').textContent) : null,
                specs: {
                    socket: item.querySelector('socket')?.textContent,
                    formFactor: item.querySelector('formFactor')?.textContent,
                    memoryType: item.querySelector('memoryType')?.textContent,
                    wattage: item.querySelector('wattage')?.textContent ? parseInt(item.querySelector('wattage').textContent) : null,
                    capacity: item.querySelector('capacity')?.textContent,
                    size: item.querySelector('size')?.textContent,
                    cores: item.querySelector('cores')?.textContent,
                    threads: item.querySelector('threads')?.textContent,
                    speed: item.querySelector('speed')?.textContent,
                    interface: item.querySelector('interface')?.textContent
                },
                description: item.querySelector('description').textContent,
                image: item.querySelector('image')?.textContent || 'default-component.jpg',
                inStock: item.querySelector('inStock')?.textContent === 'true',
                isNew: item.querySelector('isNew')?.textContent === 'true',
                rating: item.querySelector('rating')?.textContent ? parseFloat(item.querySelector('rating').textContent) : null
            });
        });
    });
    
    return components;
}

function initCatalog(components) {
    const catalogGrid = document.getElementById('catalog-grid');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const brandFilter = document.getElementById('brand-filter');
    const availabilityFilter = document.getElementById('availability-filter');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    let currentPage = 1;
    const itemsPerPage = 12;
    let filteredComponents = [...components];
    
    // Render catalog
    function renderCatalog() {
        catalogGrid.innerHTML = '';
        
        if (filteredComponents.length === 0) {
            catalogGrid.innerHTML = `
                <div class="no-results">
                    <svg width="50" height="50" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" fill="#bdc3c7"/>
                    </svg>
                    <p>Ничего не найдено. Попробуйте изменить параметры поиска.</p>
                </div>
            `;
            return;
        }
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredComponents.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredComponents.length);
        const paginatedItems = filteredComponents.slice(startIndex, endIndex);
        
        // Render items
        paginatedItems.forEach(item => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.style.animationDelay = `${Math.random() * 0.3}s`;
            
            // Generate specs list
            const specsList = [];
            if (item.specs.socket) specsList.push(`<div class="spec-item"><i class="bi bi-cpu"></i> ${item.specs.socket}</div>`);
            if (item.specs.cores) specsList.push(`<div class="spec-item"><i class="bi bi-diagram-3"></i> ${item.specs.cores} ядер</div>`);
            if (item.specs.threads) specsList.push(`<div class="spec-item"><i class="bi bi-code-square"></i> ${item.specs.threads} потоков</div>`);
            if (item.specs.speed) specsList.push(`<div class="spec-item"><i class="bi bi-speedometer2"></i> ${item.specs.speed}</div>`);
            if (item.specs.capacity) specsList.push(`<div class="spec-item"><i class="bi bi-hdd"></i> ${item.specs.capacity}</div>`);
            if (item.specs.memoryType) specsList.push(`<div class="spec-item"><i class="bi bi-memory"></i> ${item.specs.memoryType}</div>`);
            if (item.specs.interface) specsList.push(`<div class="spec-item"><i class="bi bi-plug"></i> ${item.specs.interface}</div>`);
            if (item.specs.wattage) specsList.push(`<div class="spec-item"><i class="bi bi-lightning-charge"></i> ${item.specs.wattage} Вт</div>`);
            if (item.specs.formFactor) specsList.push(`<div class="spec-item"><i class="bi bi-aspect-ratio"></i> ${item.specs.formFactor}</div>`);
            
            productCard.innerHTML = `
            ${item.isNew ? '<div class="product-badge">NEW</div>' : ''}
            ${!item.inStock ? '<div class="product-badge" style="background: #ff4757;">PRE-ORDER</div>' : ''}
            
            <div class="product-info">
                <div class="product-category">${getCategoryName(item.category)}</div>
                <h3 class="product-name">${item.brand} ${item.name}</h3>
                <div class="product-price">${item.price} руб.</div>
            </div>
            
            <div class="product-actions">
                <button class="add-to-cart" data-id="${item.id}">В корзину</button>
            </div>
        `;
            
            catalogGrid.appendChild(productCard);
        });
        
        // Update pagination controls
        pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        
        // Add event listeners
        addCartEventListeners();
    }
    
    function addCartEventListeners() {
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                const item = components.find(c => c.id === itemId);
                
                if (item) {
                    addToCart({
                        id: item.id,
                        name: `${item.brand} ${item.name}`,
                        price: item.price,
                        category: item.category,
                        image: item.image
                    });
                    
                    // Visual feedback
                    this.innerHTML = '<i class="bi bi-check2"></i> Добавлено';
                    this.style.background = 'linear-gradient(135deg, #00ff88 0%, #00a1ff 50%, #ff00cc 100%)';
                    
                    setTimeout(() => {
                        this.innerHTML = '<i class="bi bi-cart-plus"></i> В корзину';
                        this.style.background = 'linear-gradient(135deg, #00f9ff 0%, #0066ff 50%, #cc00ff 100%)';
                    }, 2000);
                }
            });
        });
        
        document.querySelectorAll('.quick-view').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                const item = components.find(c => c.id === itemId);
                
                if (item) {
                    showQuickView(item);
                }
            });
        });
    }
    
    function showQuickView(item) {
        // Implement quick view modal here
        console.log('Quick view:', item);
        alert(`Быстрый просмотр: ${item.brand} ${item.name}\nЦена: ${item.price} руб.`);
    }
    
    function getCategoryName(category) {
        const names = {
            cpu: 'Процессор',
            motherboard: 'Материнская плата',
            ram: 'Оперативная память',
            gpu: 'Видеокарта',
            storage: 'Накопитель',
            psu: 'Блок питания',
            case: 'Корпус'
        };
        
        return names[category] || category;
    }
    
    function filterComponents() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const priceRange = priceFilter.value;
        const brand = brandFilter.value;
        const availability = availabilityFilter.value;
        
        filteredComponents = components.filter(item => {
            // Search term
            if (searchTerm && !`${item.brand} ${item.name} ${item.description}`.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Category filter
            if (category !== 'all' && item.category !== category) {
                return false;
            }
            
            // Brand filter
            if (brand !== 'all') {
                const itemBrand = item.brand.toLowerCase();
                if (brand === 'intel' && !itemBrand.includes('intel')) return false;
                if (brand === 'amd' && !itemBrand.includes('amd')) return false;
                if (brand === 'nvidia' && !itemBrand.includes('nvidia')) return false;
                if (brand === 'asus' && !itemBrand.includes('asus')) return false;
                if (brand === 'msi' && !itemBrand.includes('msi')) return false;
                if (brand === 'kingston' && !itemBrand.includes('kingston')) return false;
                if (brand === 'samsung' && !itemBrand.includes('samsung')) return false;
            }
            
            // Price filter
            if (priceRange !== 'all') {
                if (priceRange === '0-500' && item.price > 500) return false;
                if (priceRange === '500-1000' && (item.price <= 500 || item.price > 1000)) return false;
                if (priceRange === '1000-2000' && (item.price <= 1000 || item.price > 2000)) return false;
                if (priceRange === '2000+' && item.price <= 2000) return false;
            }
            
            // Availability filter
            if (availability === 'in-stock' && !item.inStock) return false;
            if (availability === 'pre-order' && item.inStock) return false;
            
            return true;
        });
        
        currentPage = 1;
        renderCatalog();
    }
    
    function showError() {
        document.getElementById('catalog-grid').innerHTML = `
            <div class="error-message">
                <svg width="50" height="50" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#e74c3c"/>
                </svg>
                <p>Не удалось загрузить каталог. Пожалуйста, попробуйте позже.</p>
            </div>
        `;
    }
    
    // Event listeners
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            filterComponents();
        }
    });
    
    searchButton.addEventListener('click', filterComponents);
    categoryFilter.addEventListener('change', filterComponents);
    priceFilter.addEventListener('change', filterComponents);
    brandFilter.addEventListener('change', filterComponents);
    availabilityFilter.addEventListener('change', filterComponents);
    
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderCatalog();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredComponents.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderCatalog();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    // Добавление обработчика события для селектора сортировки
const sortSelect = document.querySelector('.sorting select'); // Селектор для сортировки

// Функция сортировки компонентов
function sortComponents() {
    const sortOption = sortSelect.value;
    if (sortOption === 'По цене (возрастание)') {
        filteredComponents.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'По цене (убывание)') {
        filteredComponents.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'По новизне') {
        filteredComponents.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }
}

// Добавление события на изменение селектора сортировки
sortSelect.addEventListener('change', function() {
    sortComponents(); // Сортируем компоненты
    renderCatalog(); // Перерисовываем каталог
});
    
    // Initial render
    renderCatalog();
}