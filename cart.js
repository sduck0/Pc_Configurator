document.addEventListener('DOMContentLoaded', function() {
    const cartItemsContainer = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const deliveryElement = document.getElementById('delivery');
    const totalElement = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Render cart items
    function renderCart() {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <svg width="100" height="100" viewBox="0 0 24 24">
                        <path d="M22.73 22.73L2.77 2.77 2 2l-.73-.73L0 2.54l4.39 4.39 2.21 4.66-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h7.46l1.38 1.38c-.5.36-.83.95-.83 1.62 0 1.1.89 2 1.99 2 .67 0 1.26-.33 1.62-.84L21.46 24l1.27-1.27zM7.42 15c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h2.36l2 2H7.42zm8.13-2c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H6.54l9.01 9zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    <p>Ваша корзина пуста</p>
                    <a href="configurator.html" class="btn"><button class="btn btn-cyber">
                     Начать сборку
                    </button></a>
                </div>
            `;
            
            subtotalElement.textContent = '0 руб.';
            deliveryElement.textContent = '0 руб.';
            totalElement.textContent = '0 руб.';
            checkoutBtn.disabled = true;
            return;
        }
        
        // Render each cart item
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            if (item.isConfiguration) {
                // Render PC configuration
                cartItem.innerHTML = `
                    
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-category">Конфигурация ПК</div>
                        <ul class="configuration-components">
                            ${Object.entries(item.components).map(([category, component]) => 
                                component ? `<li>${component.brand} ${component.name}</li>` : ''
                            ).join('')}
                        </ul>
                        <div class="item-quantity">
                            <button class="decrease-quantity" data-index="${index}">-</button>
                            <span>${item.quantity}</span>
                            <button class="increase-quantity" data-index="${index}">+</button>
                        </div>
                    </div>
                    <div class="item-price">
                        <div class="current-price">${item.price * item.quantity} руб.</div>
                        <button class="remove-item" data-index="${index}">Удалить</button>
                    </div>
                `;
            } else {
                // Render regular product
                cartItem.innerHTML = `
                    <div class="item-image">
                        <img src="images/components/${item.image || 'default-component.jpg'}" alt="${item.name}">
                    </div>
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-category">${getCategoryName(item.category)}</div>
                        <div class="item-quantity">
                            <button class="decrease-quantity" data-index="${index}">-</button>
                            <span>${item.quantity}</span>
                            <button class="increase-quantity" data-index="${index}">+</button>
                        </div>
                    </div>
                    <div class="item-price">
                        <div class="current-price">${item.price * item.quantity} руб.</div>
                        <button class="remove-item" data-index="${index}">Удалить</button>
                    </div>
                `;
            }
            
            cartItemsContainer.appendChild(cartItem);
        });
        
        // Calculate totals
        updateTotals();
        
        // Add event listeners to quantity buttons
        document.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                increaseQuantity(index);
            });
        });
        
        document.querySelectorAll('.decrease-quantity').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                decreaseQuantity(index);
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeItem(index);
            });
        });
    }
    
    // Get category display name
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
    
    // Update cart totals
    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const delivery = subtotal > 2000 ? 0 : 200; // Free delivery for orders over 2000 rub
        const total = subtotal + delivery;
        
        subtotalElement.textContent = `${subtotal} руб.`;
        deliveryElement.textContent = subtotal > 2000 ? 'Бесплатно' : `${delivery} руб.`;
        totalElement.textContent = `${total} руб.`;
        
        checkoutBtn.disabled = cart.length === 0;
    }
    
    // Increase item quantity
    function increaseQuantity(index) {
        if (index >= 0 && index < cart.length) {
            cart[index].quantity += 1;
            saveCart();
        }
    }
    
    // Decrease item quantity
    function decreaseQuantity(index) {
        if (index >= 0 && index < cart.length) {
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
            } else {
                cart.splice(index, 1);
            }
            saveCart();
        }
    }
    
    // Remove item from cart
    function removeItem(index) {
        if (index >= 0 && index < cart.length) {
            cart.splice(index, 1);
            saveCart();
        }
    }
    
    // Save cart to localStorage and re-render
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartCount();
    }
    
    // Checkout button handler
    checkoutBtn.addEventListener('click', function() {
        // In a real application, this would redirect to a checkout page
        alert('Заказ оформлен! Спасибо за покупку.');
        localStorage.removeItem('cart');
        cart = [];
        saveCart();
    });
    
    // Initial render
    renderCart();
});