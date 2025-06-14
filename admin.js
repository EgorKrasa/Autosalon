const API_URL = 'http://localhost:3000/api';

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        const section = this.getAttribute('data-section');
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        if (section === 'dashboard') loadDashboard();
        if (section === 'requests') loadRequests();
        if (section === 'cars') loadCars();
        if (section === 'clients') loadClients();
        if (section === 'calculator') initializeCalculator();
        if (section === 'analytics') loadAnalytics();
        if (section === 'services') loadServices();
    });
});

const translations = {
    ru: {
        dashboard: 'Дашборд',
        requests: 'Заявки',
        cars: 'Автомобили',
        clients: 'Клиенты',
        services: 'Услуги',
        calculator: 'Калькулятор',
        analytics: 'Аналитика',
        settings: 'Настройки',
        newRequests: 'Новые заявки',
        availableCars: 'Автомобилей в наличии',
        monthlyRevenue: 'Выручка за месяц',
        noChanges: 'Без изменений'
    },
    en: {
        dashboard: 'Dashboard',
        requests: 'Requests',
        cars: 'Cars',
        clients: 'Clients',
        services: 'Services',
        calculator: 'Calculator',
        analytics: 'Analytics',
        settings: 'Settings',
        newRequests: 'New Requests',
        availableCars: 'Available Cars',
        monthlyRevenue: 'Monthly Revenue',
        noChanges: 'No changes'
    }
};

function updateLanguage(lang) {
    const currentLang = translations[lang];
    
    document.querySelectorAll('.nav-link').forEach(link => {
        const section = link.getAttribute('data-section');
        const icon = link.querySelector('i').outerHTML;
        link.innerHTML = icon + ' ' + currentLang[section];
    });
    
    document.querySelectorAll('section h2').forEach(header => {
        const section = header.parentElement.id;
        if (currentLang[section]) {
            header.textContent = currentLang[section];
        }
    });
    
    if (document.getElementById('dashboardStats')) {
        loadDashboard();
    }
}

document.getElementById('language').addEventListener('change', function() {
    updateLanguage(this.value);
});

let dashboardSalesChartInstance = null;
async function loadDashboard() {
    try {
        const analyticsRes = await fetch(`${API_URL}/analytics`);
        const analytics = await analyticsRes.json();

        document.getElementById('dashboardStats').innerHTML = `
            <div class="stat-card">
                <div class="stat-title">Автомобилей в наличии</div>
                <div class="stat-value">${analytics.available_cars}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Активных заказов</div>
                <div class="stat-value">${analytics.active_orders}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Выручка за месяц</div>
                <div class="stat-value">${analytics.monthly_revenue.toLocaleString()} ₽</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Популярных моделей</div>
                <div class="stat-value">${analytics.popular_models.length}</div>
            </div>
        `;

        const ctx = document.getElementById('salesChart').getContext('2d');
        if (dashboardSalesChartInstance) {
            dashboardSalesChartInstance.destroy();
        }
        dashboardSalesChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: analytics.sales_chart.labels,
                datasets: [{
                    label: 'Продажи',
                    data: analytics.sales_chart.data,
                    borderColor: '#2962FF',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Динамика продаж' }
                }
            }
        });
    } catch (error) {
        console.error('Ошибка при загрузке данных дашборда:', error);
    }
}

async function loadRequests() {
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();
        const tbody = document.getElementById('requestsTableBody');
        tbody.innerHTML = '';
        if (!Array.isArray(orders) || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9">Нет заявок</td></tr>';
            return;
        }
        orders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customer_name || ''}</td>
                <td>${order.customer_email || ''}</td>
                <td>${order.customer_phone || ''}</td>
                <td>${order.car_name || ''}</td>
                <td>${order.total_price ? order.total_price.toLocaleString() : ''} ₽</td>
                <td>${order.status || ''}</td>
                <td>${order.created_at ? new Date(order.created_at).toLocaleString() : ''}</td>
                <td>
                    <button class="btn-edit" onclick="updateOrderStatus(${order.id}, 'completed')">Завершить</button>
                    <button class="btn-delete" onclick="deleteOrder(${order.id})">Удалить</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        const tbody = document.getElementById('requestsTableBody');
        tbody.innerHTML = '<tr><td colspan="9">Ошибка загрузки заявок</td></tr>';
        console.error('Ошибка при загрузке заявок:', err);
    }
}

async function loadBrands() {
    try {
        const response = await fetch(`${API_URL}/brands`);
        const brands = await response.json();
        const brandSelect = document.getElementById('brandSelect');
        
        brandSelect.innerHTML = '<option value="">Выберите бренд</option>';
        brands.forEach(brand => {
            brandSelect.innerHTML += `<option value="${brand.id}">${brand.name}</option>`;
        });
    } catch (err) {
        console.error('Ошибка при загрузке брендов:', err);
        showError('Не удалось загрузить список брендов');
    }
}

async function loadModels(brandId) {
    try {
        const response = await fetch(`${API_URL}/models?brand_id=${brandId}`);
        const models = await response.json();
        const modelSelect = document.getElementById('modelSelect');
        
        modelSelect.innerHTML = '<option value="">Выберите модель</option>';
        models.forEach(model => {
            modelSelect.innerHTML += `<option value="${model.id}">${model.name}</option>`;
        });
    } catch (err) {
        console.error('Ошибка при загрузке моделей:', err);
        showError('Не удалось загрузить список моделей');
    }
}

async function loadCars() {
    try {
        const response = await fetch(`${API_URL}/cars`);
        const cars = await response.json();
        
        const tbody = document.getElementById('carsTableBody');
        tbody.innerHTML = '';
        
        cars.forEach(car => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${car.id}</td>
                <td>
                    <img src="images/${car.image}" alt="${car.brand_name} ${car.model_name}" style="width: 50px; height: auto;">
                        </td>
                <td>${car.brand_name || ''}</td>
                <td>${car.model_name || ''}</td>
                <td>${car.year}</td>
                <td>${car.color}</td>
                <td>${car.price.toLocaleString()} ₽</td>
                <td>${car.status}</td>
                <td>
                    <button class="btn-edit" onclick="editCar(${car.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteCar(${car.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Ошибка при загрузке автомобилей:', err);
        showError('Не удалось загрузить список автомобилей');
    }
}

async function editCar(id) {
    try {
        const response = await fetch(`${API_URL}/cars/${id}`);
        const car = await response.json();
        
        document.getElementById('carId').value = car.id;
        document.getElementById('brandSelect').value = car.brand_id;
        await loadModels(car.brand_id);
        document.getElementById('modelSelect').value = car.model_id;
        document.getElementById('yearInput').value = car.year;
        document.getElementById('mileageInput').value = car.mileage;
        document.getElementById('engineInput').value = car.engine || '';
        document.getElementById('transmissionInput').value = car.transmission || 'automatic';
        document.getElementById('colorInput').value = car.color;
        document.getElementById('carPrice').value = car.price;
        
        document.getElementById('brandSelect').parentElement.style.display = 'block';
        document.getElementById('modelSelect').parentElement.style.display = 'block';
        document.getElementById('yearInput').parentElement.style.display = 'block';
        document.getElementById('mileageInput').parentElement.style.display = 'block';
        document.getElementById('engineInput').parentElement.style.display = 'block';
        document.getElementById('transmissionInput').parentElement.style.display = 'block';
        document.getElementById('colorInput').parentElement.style.display = 'block';
        
        document.getElementById('carModalTitle').textContent = 'Редактировать автомобиль';
        document.getElementById('carModal').style.display = 'block';
    } catch (err) {
        console.error('Ошибка при загрузке автомобиля:', err);
        showError('Не удалось загрузить данные автомобиля');
    }
}

function validateName(name) {
    return /^[А-Яа-яA-Za-z\s\-]{2,}$/.test(name.trim());
}
function validatePhone(phone) {
    return /^[\d\+\-\s\(\)]{10,20}$/.test(phone.trim());
}
function validateEmail(email) {
    return /^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email.trim());
}
function validatePrice(price) {
    return !isNaN(price) && Number(price) >= 0;
}
function validateYear(year) {
    return !isNaN(year) && Number(year) >= 1900 && Number(year) <= 2024;
}

async function saveCar(event) {
    event.preventDefault();
    const year = document.getElementById('yearInput').value;
    const color = document.getElementById('colorInput').value;
    const mileage = document.getElementById('mileageInput').value;
    const price = document.getElementById('carPrice').value;
    if (!validateYear(year)) {
        showError('Пожалуйста, введите корректный год (1900-2024).');
        return;
    }
    if (!validateName(color)) {
        showError('Пожалуйста, введите корректный цвет (только буквы, не менее 2 символов).');
        return;
    }
    if (!validatePrice(mileage)) {
        showError('Пожалуйста, введите корректный пробег (только положительное число).');
        return;
    }
    if (!validatePrice(price)) {
        showError('Пожалуйста, введите корректную цену (только положительное число).');
        return;
    }
    
    const carId = document.getElementById('carId').value;
    const formData = new FormData();
    
    formData.append('brand_id', document.getElementById('brandSelect').value);
    formData.append('model_id', document.getElementById('modelSelect').value);
    formData.append('year', document.getElementById('yearInput').value);
    formData.append('mileage', document.getElementById('mileageInput').value);
    formData.append('engine', document.getElementById('engineInput').value);
    formData.append('transmission', document.getElementById('transmissionInput').value);
    formData.append('color', document.getElementById('colorInput').value);
    formData.append('price', document.getElementById('carPrice').value);
    formData.append('status', 'available');
    formData.append('quantity', 1);
    
    const imageInput = document.getElementById('carImage');
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }
    
    try {
        const url = carId ? 
            `${API_URL}/cars/${carId}` : 
            `${API_URL}/cars`;
            
        const method = carId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            document.getElementById('carModal').style.display = 'none';
            loadCars();
            showSuccess(carId ? 'Автомобиль успешно обновлен' : 'Автомобиль успешно добавлен');
        } else {
            showError(result.error || 'Не удалось сохранить автомобиль');
        }
    } catch (err) {
        console.error('Ошибка при сохранении автомобиля:', err);
        showError('Не удалось сохранить автомобиль');
    }
}

async function deleteCar(id) {
    if (!confirm('Вы уверены, что хотите удалить этот автомобиль?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/cars/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadCars();
            showSuccess('Автомобиль успешно удален');
        } else {
            showError(result.error || 'Не удалось удалить автомобиль');
        }
    } catch (err) {
        console.error('Ошибка при удалении автомобиля:', err);
        showError('Не удалось удалить автомобиль');
    }
}

function showSuccess(message) {
    alert(message);
}

function showError(message) {
    alert(message);
    }

async function loadClients() {
    const res = await fetch(`${API_URL}/customers`);
    const clients = await res.json();
    document.getElementById('clientsTableContainer').innerHTML = `
        <table class="admin-table">
            <thead><tr><th>ID</th><th>Имя</th><th>Фамилия</th><th>Email</th><th>Телефон</th><th>Город</th><th>Действия</th></tr></thead>
            <tbody>
                ${clients.map(c => `
                    <tr>
                        <td>${c.id}</td>
                        <td>${c.first_name}</td>
                        <td>${c.last_name}</td>
                        <td>${c.email}</td>
                        <td>${c.phone}</td>
                        <td>${c.city || ''}</td>
                        <td>
                            <button class="btn-edit" onclick="editClient(${c.id})">Редактировать</button>
                            <button class="btn-delete" onclick="deleteClient(${c.id})">Удалить</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
window.deleteClient = async function(id) {
    if (!confirm('Удалить клиента?')) return;
    await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
    loadClients();
};
window.editClient = function(id) {
    alert('Редактирование клиента (реализовать модалку)');
};
document.getElementById('addClientBtn').onclick = function() {
    alert('Добавление клиента (реализовать модалку)');
};

const loginContainer = document.getElementById('loginContainer');
const adminPanel = document.getElementById('adminPanel');
const adminLoginForm = document.getElementById('adminLoginForm');
const errorMessage = document.getElementById('errorMessage');

adminLoginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (!username || username.length < 3) {
        showError('Пожалуйста, введите имя пользователя (не менее 3 символов).');
        e.preventDefault();
        return;
    }
    if (!password || password.length < 3) {
        showError('Пожалуйста, введите пароль (не менее 3 символов).');
        e.preventDefault();
        return;
    }
    if (username === 'admin' && password === 'admin123') {
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'flex';
        errorMessage.style.display = 'none';
        loadDashboard();
    } else {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Неверное имя пользователя или пароль';
    }
});

async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/services`);
        const services = await response.json();
        
        const tbody = document.getElementById('servicesTableBody');
        tbody.innerHTML = '';
        
        services.forEach(service => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${service.id}</td>
                <td>
                    ${service.image ? 
                        `<img src="images/${service.image}" alt="${service.name}" class="service-image">` : 
                        'Нет изображения'}
                </td>
                <td>${service.name}</td>
                <td>${service.description}</td>
                <td>${service.price} ₽</td>
                <td>
                    <button class="btn-edit" onclick="editService(${service.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteService(${service.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Ошибка при загрузке услуг:', err);
        showError('Не удалось загрузить список услуг');
    }
}

async function saveService(event) {
    event.preventDefault();
    const name = document.getElementById('serviceName').value;
    const price = document.getElementById('servicePrice').value;
    if (!validateName(name)) {
        showError('Пожалуйста, введите корректное название услуги (только буквы, не менее 2 символов).');
        return;
    }
    if (!validatePrice(price)) {
        showError('Пожалуйста, введите корректную цену (только положительное число).');
        return;
    }
    
    const serviceId = document.getElementById('serviceId').value;
    const formData = new FormData();
    
    formData.append('name', document.getElementById('serviceName').value);
    formData.append('description', document.getElementById('serviceDescription').value);
    formData.append('price', document.getElementById('servicePrice').value);
    
    const imageInput = document.getElementById('serviceImage');
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }
    
    try {
        const url = serviceId ? 
            `${API_URL}/services/${serviceId}` : 
            `${API_URL}/services`;
            
        const method = serviceId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            document.getElementById('serviceModal').style.display = 'none';
            loadServices();
            showSuccess(result.message);
        } else {
            showError(result.error);
        }
    } catch (err) {
        console.error('Ошибка при сохранении услуги:', err);
        showError('Не удалось сохранить услугу');
    }
}

async function editService(id) {
    try {
        const response = await fetch(`${API_URL}/services/${id}`);
        const service = await response.json();
        
        document.getElementById('serviceId').value = service.id;
        document.getElementById('serviceName').value = service.name;
        document.getElementById('serviceDescription').value = service.description;
        document.getElementById('servicePrice').value = service.price;
        
        document.getElementById('serviceModalTitle').textContent = 'Редактировать услугу';
        document.getElementById('serviceModal').style.display = 'block';
    } catch (err) {
        console.error('Ошибка при загрузке услуги:', err);
        showError('Не удалось загрузить данные услуги');
    }
}

async function deleteService(id) {
    if (!confirm('Вы уверены, что хотите удалить эту услугу?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/services/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadServices();
            showSuccess(result.message);
        } else {
            showError(result.error);
        }
    } catch (err) {
        console.error('Ошибка при удалении услуги:', err);
        showError('Не удалось удалить услугу');
    }
}

async function initializeCalculator() {
    try {
        const carsResponse = await fetch(`${API_URL}/cars`);
        const cars = await carsResponse.json();
        const carSelect = document.getElementById('calculatorCar');
        
        if (!carSelect) return;
        
        carSelect.innerHTML = '<option value="">Выберите автомобиль</option>';
        cars.filter(car => car.status === 'available').forEach(car => {
            carSelect.innerHTML += `
                <option value="${car.id}" data-price="${car.price}">
                    ${car.brand_name} ${car.model_name} (${car.year}) - ${car.price.toLocaleString()} ₽
                </option>
            `;
        });

        const servicesResponse = await fetch(`${API_URL}/services`);
        const services = await servicesResponse.json();
        const servicesContainer = document.getElementById('calculatorServices');
        
        if (!servicesContainer) return;
        
        servicesContainer.innerHTML = services.map(service => `
            <div class="service-checkbox">
                <input type="checkbox" id="service_${service.id}" value="${service.id}" 
                       data-price="${service.price}" onchange="updateCalculator()">
                <label for="service_${service.id}">
                    ${service.name} - ${service.price.toLocaleString()} ₽
                </label>
            </div>
        `).join('');

        document.getElementById('calculatorCar').addEventListener('change', updateCalculator);
        document.getElementById('calculateBtn').addEventListener('click', showCalculationResult);
    } catch (error) {
        console.error('Ошибка при инициализации калькулятора:', error);
    }
}

function updateCalculator() {
    const carSelect = document.getElementById('calculatorCar');
    const selectedOption = carSelect.options[carSelect.selectedIndex];
    const carPrice = selectedOption.value ? parseFloat(selectedOption.dataset.price) : 0;

    let servicesPrice = 0;
    document.querySelectorAll('#calculatorServices input:checked').forEach(checkbox => {
        servicesPrice += parseFloat(checkbox.dataset.price);
    });

    document.getElementById('carPriceDisplay').textContent = carPrice.toLocaleString() + ' ₽';
    document.getElementById('servicesPriceDisplay').textContent = servicesPrice.toLocaleString() + ' ₽';
    document.getElementById('totalPriceDisplay').textContent = (carPrice + servicesPrice).toLocaleString() + ' ₽';
}

function showCalculationResult() {
    const carSelect = document.getElementById('calculatorCar');
    const selectedCar = carSelect.options[carSelect.selectedIndex];
    const carPrice = selectedCar.value ? parseFloat(selectedCar.dataset.price) : 0;
    
    let servicesPrice = 0;
    const selectedServices = [];
    document.querySelectorAll('#calculatorServices input:checked').forEach(checkbox => {
        const price = parseFloat(checkbox.dataset.price);
        servicesPrice += price;
        const label = checkbox.nextElementSibling.textContent;
        selectedServices.push({ name: label, price: price });
    });

    const total = carPrice + servicesPrice;

    document.getElementById('calculationResult').innerHTML = `
        <h3>Итоговый расчет:</h3>
        ${selectedCar.value ? `
            <p><strong>Автомобиль:</strong> ${selectedCar.textContent}</p>
        ` : ''}
        ${selectedServices.length ? `
            <p><strong>Выбранные услуги:</strong></p>
            <ul>
                ${selectedServices.map(service => 
                    `<li>${service.name}</li>`
                ).join('')}
            </ul>
        ` : ''}
        <p class="total-price"><strong>Итого:</strong> ${total.toLocaleString()} ₽</p>
    `;
}

const DEFAULT_SETTINGS = {
    notificationEmail: '',
    autoRefresh: false,
    darkMode: false,
    language: 'ru',
    refreshInterval: 30000,
    defaultPageSize: 10,
    dashboardLayout: 'grid',
    notificationTypes: {
        newOrders: true,
        lowStock: true,
        serviceRequests: true
    },
    analyticsDefaultPeriod: 'month',
    exportFormats: ['excel', 'pdf']
};

function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
    const settings = { ...DEFAULT_SETTINGS, ...savedSettings };
    
    document.getElementById('notificationEmail').value = settings.notificationEmail;
    document.getElementById('autoRefresh').checked = settings.autoRefresh;
    document.getElementById('darkMode').checked = settings.darkMode;
    document.getElementById('language').value = settings.language;
    document.getElementById('refreshInterval').value = settings.refreshInterval;
    document.getElementById('defaultPageSize').value = settings.defaultPageSize;
    document.getElementById('dashboardLayout').value = settings.dashboardLayout;
    
    Object.entries(settings.notificationTypes).forEach(([key, value]) => {
        const element = document.getElementById(`notification_${key}`);
        if (element) element.checked = value;
    });
    
    document.body.classList.toggle('dark-mode', settings.darkMode);
    
    document.getElementById('dashboard')?.classList.toggle('grid-layout', settings.dashboardLayout === 'grid');
    
    return settings;
}

function saveSettings() {
    const settings = {
        notificationEmail: document.getElementById('notificationEmail').value,
        autoRefresh: document.getElementById('autoRefresh').checked,
        darkMode: document.getElementById('darkMode').checked,
        language: document.getElementById('language').value,
        refreshInterval: parseInt(document.getElementById('refreshInterval').value),
        defaultPageSize: parseInt(document.getElementById('defaultPageSize').value),
        dashboardLayout: document.getElementById('dashboardLayout').value,
        notificationTypes: {
            newOrders: document.getElementById('notification_newOrders').checked,
            lowStock: document.getElementById('notification_lowStock').checked,
            serviceRequests: document.getElementById('notification_serviceRequests').checked
        },
        analyticsDefaultPeriod: document.getElementById('analyticsDefaultPeriod').value,
        exportFormats: Array.from(document.querySelectorAll('input[name="exportFormat"]:checked')).map(cb => cb.value)
    };
    
    if (settings.refreshInterval < 5000) {
        alert('Минимальный интервал обновления - 5 секунд');
        return false;
    }
    
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    
    document.body.classList.toggle('dark-mode', settings.darkMode);
    document.getElementById('dashboard')?.classList.toggle('grid-layout', settings.dashboardLayout === 'grid');
    
    if (settings.autoRefresh) {
        startAutoRefresh(settings.refreshInterval);
    } else {
        stopAutoRefresh();
    }
    
    updateTablesPagination(settings.defaultPageSize);
    
    alert('Настройки успешно сохранены');
    return true;
}

function startAutoRefresh(interval = 30000) {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        const settings = loadSettings();
        if (!settings.autoRefresh) {
            stopAutoRefresh();
            return;
        }
        
        const activeSection = document.querySelector('.section.active');
        if (activeSection) {
            switch(activeSection.id) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'cars':
                    loadCars();
                    break;
                case 'analytics':
                    loadAnalytics();
                    break;
            }
        }
    }, interval);
}

function updateTablesPagination(pageSize) {
    const tables = document.querySelectorAll('.admin-table');
    tables.forEach(table => {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const totalPages = Math.ceil(rows.length / pageSize);
        
        if (!table.nextElementSibling?.classList.contains('pagination')) {
            const paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination';
            table.parentNode.insertBefore(paginationContainer, table.nextSibling);
        }
        
        updatePagination(table, 1, pageSize);
    });
}

function updatePagination(table, currentPage, totalItems) {
    const pageSize = 10;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginationContainer = document.querySelector(`#${table}Pagination`);
    
    if (!paginationContainer) return;
    
    let paginationHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage('${table}', ${currentPage - 1})">
            Предыдущая
        </button>
        <span>Страница ${currentPage} из ${totalPages}</span>
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage('${table}', ${currentPage + 1})">
            Следующая
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

window.changePage = function(button, newPage, pageSize) {
    const table = button.closest('.pagination').previousElementSibling;
    if (table) {
        updatePagination(table, newPage, pageSize);
    }
};

document.addEventListener('DOMContentLoaded', function() {

    if (document.getElementById('calculator')) {
        initializeCalculator();
    }
    
    if (document.getElementById('analytics')) {
        loadAnalytics();
    }
    
    if (document.getElementById('services')) {
        loadServices();
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            
            if (section === 'calculator') {
                initializeCalculator();
            } else if (section === 'analytics') {
                loadAnalytics();
            } else if (section === 'services') {
                loadServices();
            }
        });
    });

    document.getElementById('addServiceBtn').addEventListener('click', function() {
        document.getElementById('serviceForm').reset();
        document.getElementById('serviceId').value = '';
        document.getElementById('serviceModalTitle').textContent = 'Добавить услугу';
        document.getElementById('serviceModal').style.display = 'block';
    });
    
    document.getElementById('serviceForm').addEventListener('submit', saveService);
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (section === 'services') {
                loadServices();
            } else if (section === 'cars') {
                loadCars();
            } else if (section === 'requests') {
                loadRequests();
            }
        });
    });

    document.getElementById('addCarBtn')?.addEventListener('click', function() {
        document.getElementById('carForm').reset();
        document.getElementById('carId').value = '';
        
        document.getElementById('brandSelect').parentElement.style.display = 'block';
        document.getElementById('modelSelect').parentElement.style.display = 'block';
        document.getElementById('yearInput').parentElement.style.display = 'block';
        document.getElementById('mileageInput').parentElement.style.display = 'block';
        document.getElementById('engineInput').parentElement.style.display = 'block';
        document.getElementById('transmissionInput').parentElement.style.display = 'block';
        document.getElementById('colorInput').parentElement.style.display = 'block';
        
        document.getElementById('carModalTitle').textContent = 'Добавить автомобиль';
        document.getElementById('carModal').style.display = 'block';
        loadBrands();
    });
    
    document.getElementById('brandSelect')?.addEventListener('change', function() {
        if (this.value) {
            loadModels(this.value);
        }
    });
    
    document.getElementById('carForm')?.addEventListener('submit', saveCar);
    
    if (document.querySelector('.nav-link.active')?.getAttribute('data-section') === 'dashboard') {
        loadDashboard();
    }

});

let analyticsSalesChartInstance = null;
async function loadAnalytics() {
    try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        if (data.error) {
            document.getElementById('analyticsStats').innerHTML = '<div>Ошибка загрузки аналитики</div>';
            return;
        }
        document.getElementById('analyticsStats').innerHTML = `
            <div class="stat-card"><div class="stat-title">Автомобилей в наличии</div><div class="stat-value">${data.available_cars}</div></div>
            <div class="stat-card"><div class="stat-title">Активных заказов</div><div class="stat-value">${data.active_orders}</div></div>
            <div class="stat-card"><div class="stat-title">Выручка за месяц</div><div class="stat-value">${data.monthly_revenue.toLocaleString()} ₽</div></div>
            <div class="stat-card"><div class="stat-title">Средний чек</div><div class="stat-value">${data.avg_check ? Math.round(data.avg_check).toLocaleString() : 0} ₽</div></div>
        `;
        let topServicesHtml = '<h3>Топ-услуги</h3><ul>';
        if (data.top_services && data.top_services.length > 0) {
            data.top_services.forEach(s => {
                topServicesHtml += `<li>${s.name}: ${s.usage_count} заказов</li>`;
            });
        } else {
            topServicesHtml += '<li>Нет данных</li>';
        }
        topServicesHtml += '</ul>';
        let topClientsHtml = '<h3>Топ-клиенты</h3><ul>';
        if (data.top_clients && data.top_clients.length > 0) {
            data.top_clients.forEach(c => {
                topClientsHtml += `<li>${c.client}: ${Math.round(c.total_spent).toLocaleString()} ₽</li>`;
            });
        } else {
            topClientsHtml += '<li>Нет данных</li>';
        }
        topClientsHtml += '</ul>';
        document.getElementById('analyticsStats').innerHTML += `<div style="grid-column: span 2;">${topServicesHtml}${topClientsHtml}</div>`;
        const ctx = document.getElementById('analyticsSalesChart').getContext('2d');
        if (analyticsSalesChartInstance) {
            analyticsSalesChartInstance.destroy();
        }
        analyticsSalesChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.sales_chart.labels,
                datasets: [{
                    label: 'Продажи',
                    data: data.sales_chart.data,
                    borderColor: '#2962FF',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Динамика продаж' }
                }
            }
        });

        const carsResponse = await fetch(`${API_URL}/cars`);
        const cars = await carsResponse.json();
        analyzeBrandPopularity(cars);

    } catch (err) {
        document.getElementById('analyticsStats').innerHTML = '<div>Ошибка загрузки аналитики</div>';
        console.error('Ошибка при загрузке аналитики:', err);
    }
}

window.updateOrderStatus = async function(id, status) {
    try {
        const response = await fetch(`/api/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const result = await response.json();
        if (result.success) {
            loadRequests();
        } else {
            alert(result.error || 'Ошибка обновления статуса заказа');
        }
    } catch (err) {
        alert('Ошибка обновления статуса заказа');
        console.error('Ошибка при обновлении статуса заказа:', err);
    }
}

window.deleteOrder = async function(id) {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;
    try {
        const response = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            loadRequests();
        } else {
            alert(result.error || 'Ошибка удаления заказа');
        }
    } catch (err) {
        alert('Ошибка удаления заказа');
        console.error('Ошибка при удалении заказа:', err);
    }
}

document.getElementById('exportAnalyticsBtn').onclick = function() {
    window.location.href = '/api/analytics/export';
};

async function loadMessages() {
    try {
        const response = await fetch(`${API_URL}/contact-messages`);
        const messages = await response.json();
        const tbody = document.getElementById('messagesTableBody');
        tbody.innerHTML = '';
        if (!Array.isArray(messages) || messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9">Нет сообщений</td></tr>';
            return;
        }
        messages.forEach(msg => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${msg.id}</td>
                <td>${msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</td>
                <td>${msg.name || ''}</td>
                <td>${msg.email || ''}</td>
                <td>${msg.phone || ''}</td>
                <td>${msg.subject || ''}</td>
                <td>${msg.message || ''}</td>
                <td><span class="message-status ${msg.status}">${msg.status === 'read' ? 'Прочитано' : 'Новое'}</span></td>
                <td class="message-actions">
                    ${msg.status !== 'read' ? `<button class="btn-mark-read" onclick="markMessageAsRead(${msg.id})">Прочитано</button>` : ''}
                    <button class="btn-delete" onclick="deleteMessage(${msg.id})">Удалить</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        const tbody = document.getElementById('messagesTableBody');
        tbody.innerHTML = '<tr><td colspan="9">Ошибка загрузки сообщений</td></tr>';
        console.error('Ошибка при загрузке сообщений:', err);
    }
}

document.querySelectorAll('.nav-link[data-section="messages"]').forEach(link => {
    link.addEventListener('click', function() {
        loadMessages();
    });
});

window.markMessageAsRead = async function(messageId) {
  try {
    const response = await fetch(`${API_URL}/contact-messages/${messageId}/read`, {
      method: 'PUT'
    });
    if (response.ok) {
      await loadMessages();
    } else {
      throw new Error('Ошибка при обновлении статуса сообщения');
    }
  } catch (error) {
    alert('Произошла ошибка при обновлении статуса сообщения');
  }
}
window.deleteMessage = async function(messageId) {
  if (!confirm('Вы уверены, что хотите удалить это сообщение?')) return;
  try {
    const response = await fetch(`${API_URL}/contact-messages/${messageId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      await loadMessages();
    } else {
      throw new Error('Ошибка при удалении сообщения');
    }
  } catch (error) {
    alert('Произошла ошибка при удалении сообщения');
  }
}

function analyzeBrandPopularity(cars) {
    console.log('Начало analyzeBrandPopularity. Получены автомобили:', cars);

    if (!Array.isArray(cars)) {
        console.error('Ошибка: cars не является массивом.', cars);
        document.getElementById('mostPopularBrand').textContent = 'Ошибка данных';
        document.getElementById('brandPercentage').textContent = '0%';
        if (window.brandPopularityChartInstance) {
            window.brandPopularityChartInstance.destroy();
        }
        document.getElementById('brandPopularityChart').getContext('2d').clearRect(0, 0, document.getElementById('brandPopularityChart').width, document.getElementById('brandPopularityChart').height);
        return;
    }

    const brandData = {};
    let totalSales = 0;

    cars.forEach(car => {
        if (car && car.brand_name && car.status) {
            if (car.status === 'sold') {
                brandData[car.brand_name] = (brandData[car.brand_name] || 0) + 1;
                totalSales++;
                console.log('Найден проданный автомобиль:', car.brand_name, 'Текущие продажи:', brandData[car.brand_name]);
            }
        } else {
            console.warn('Предупреждение: Неполные данные об автомобиле для анализа бренда:', car);
        }
    });

    console.log('Итоговые данные по брендам:', brandData);
    console.log('Общее количество продаж:', totalSales);

    const allBrandsSorted = Object.entries(brandData)
        .map(([brand, sales]) => ({ brand, sales }))
        .sort((a, b) => a.sales - b.sales);

    const top3Brands = allBrandsSorted.slice(Math.max(0, allBrandsSorted.length - 3));

    const labels = top3Brands.map(item => item.brand);
    const data = top3Brands.map(item => item.sales);


    const allBackgroundColors = [
        'rgba(173, 216, 230, 0.7)',
        'rgba(100, 149, 237, 0.7)',
        'rgba(65, 105, 225, 0.7)',
        'rgba(0, 0, 139, 0.7)',
        'rgba(25, 25, 112, 0.7)'
    ];
    const allBorderColors = [
        'rgba(173, 216, 230, 1)',
        'rgba(100, 149, 237, 1)',
        'rgba(65, 105, 225, 1)',
        'rgba(0, 0, 139, 1)',
        'rgba(25, 25, 112, 1)'
    ];

    const backgroundColors = allBackgroundColors.slice(0, data.length);
    const borderColors = allBorderColors.slice(0, data.length);

    let mostPopularBrand = '';
    let maxSales = 0;
    let brandPercentage = 0;

    if (totalSales > 0) {
        for (const [brand, sales] of Object.entries(brandData)) {
            if (sales > maxSales) {
                maxSales = sales;
                mostPopularBrand = brand;
                brandPercentage = ((sales / totalSales) * 100).toFixed(1);
            }
        }
    }

    document.getElementById('mostPopularBrand').textContent = mostPopularBrand || 'Нет данных';
    document.getElementById('brandPercentage').textContent = `${brandPercentage}%`;

    const brandExplanationDiv = document.getElementById('brandExplanation');
    let explanationHtml = '<h3>Почему так?</h3><ul>';

    if (totalSales === 0) {
        explanationHtml += '<li>Пока нет данных о продажах автомобилей для анализа популярности брендов.</li>';
    } else {
        const brandCounts = Object.values(brandData);
        const sumCounts = brandCounts.reduce((a, b) => a + b, 0);
        const averageSales = sumCounts / brandCounts.length;

        const sortedBrandsForExplanation = Object.entries(brandData)
            .map(([brand, sales]) => ({ brand, sales }))
            .sort((a, b) => b.sales - a.sales);

        sortedBrandsForExplanation.forEach(item => {
            const percentage = (item.sales / totalSales * 100).toFixed(1);
            let popularityText = '';
            let reasonText = '';

            if (item.sales > averageSales * 1.5) {
                popularityText = 'очень популярный';
                reasonText = 'имеет значительно высокие продажи, что может быть связано с большой рекламной кампанией, высоким спросом на рынке или выгодными предложениями.';
            } else if (item.sales > averageSales * 1.1) {
                popularityText = 'популярный';
                reasonText = 'пользуется стабильным спросом и имеет хорошие показатели продаж.';
            } else if (item.sales >= averageSales * 0.7) {
                popularityText = 'средне популярный';
                reasonText = 'демонстрирует средний уровень продаж, что может указывать на конкурентную среду или нишевую аудиторию.';
            } else {
                popularityText = 'непопулярный';
                reasonText = 'имеет низкие продажи, что может быть связано с устаревшей моделью, недостаточной маркетинговой активностью или высокой ценой.';
            }
            explanationHtml += `<li>Бренд <strong>${item.brand}</strong> является ${popularityText} (${percentage}% продаж), потому что он ${reasonText}</li>`;
        });
    }
    explanationHtml += '</ul>';
    brandExplanationDiv.innerHTML = explanationHtml;

    const ctx = document.getElementById('brandPopularityChart').getContext('2d');
    if (window.brandPopularityChartInstance) {
        window.brandPopularityChartInstance.destroy();
    }
    window.brandPopularityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Количество продаж',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Популярность брендов по продажам' }
            }
        }
    });
} 