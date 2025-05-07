// JavaScript для прототипа
function showPage(pageId) {
    const pages = ['index', 'catalog', 'configurator', 'cart', 'contacts'];
    pages.forEach(page => {
        document.getElementById(page).style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
}

// Функция для получения параметра из URL
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Обработчики событий для навигации
document.querySelector('nav a[href="indexProto.html"]').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('index');
});

document.querySelector('nav a[href="catalogProto.html"]').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('catalog');
});

document.querySelector('nav a[href="configuratorProto.html"]').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('configurator');
});

document.querySelector('nav a[href="cartProto.html"]').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('cart');
});

document.querySelector('nav a[href="contactsProto.html"]').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('contacts');
});

// Отображение страницы по умолчанию (главная)
var page = getParameterByName('page');
if (page) {
    showPage(page);
} else {
    showPage('index');
}

// Конфигуратор
const cpuSelect = document.getElementById('cpu-select');
const motherboardSelect = document.getElementById('motherboard-select');
const ramSelect = document.getElementById('ram-select');
const summaryList = document.getElementById('summary-list');
const totalPriceElement = document.getElementById('total-price');

function updateSummary() {
    summaryList.innerHTML = '';
    let totalPrice = 0;

    function addItem(name, price) {
        const itemElement = document.createElement('div');
        itemElement.className = 'summary-item';
        itemElement.innerHTML = `<span>${name}</span><span>${price} руб.</span>`;
        summaryList.appendChild(itemElement);
        totalPrice += price;
    }

    if (cpuSelect.value) {
        const cpuName = cpuSelect.options[cpuSelect.selectedIndex].text;
        addItem(cpuName, 15000); // Пример цены
    }

    if (motherboardSelect.value) {
        const mbName = motherboardSelect.options[motherboardSelect.selectedIndex].text;
        addItem(mbName, 10000); // Пример цены
    }

    if (ramSelect.value) {
        const ramName = ramSelect.options[ramSelect.selectedIndex].text;
        addItem(ramName, 8000); // Пример цены
    }

    if (!cpuSelect.value && !motherboardSelect.value && !ramSelect.value) {
        summaryList.innerHTML = '<p>Выберите компоненты для отображения</p>';
    }

    totalPriceElement.textContent = totalPrice + ' руб.';
}

cpuSelect.addEventListener('change', updateSummary);
motherboardSelect.addEventListener('change', updateSummary);
ramSelect.addEventListener('change', updateSummary);