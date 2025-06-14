const API_URL = 'http://localhost:3000/api';

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.car-card, .contact-item, .about-content').forEach((el) => {
    observer.observe(el);
});

document.querySelectorAll('.car-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
        this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });
});

const ctaButton = document.querySelector('.cta-button');
if (ctaButton) {
    ctaButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.backgroundColor = '#990000';
    });

    ctaButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.backgroundColor = '#cc0000';
    });
}

const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }

    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
    if (window.location.pathname.endsWith('admin.html')) {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const adminPanel = document.querySelector('.admin-wrapper');
        if (!user) {
            adminPanel.style.display = 'none';
            showAdminLoginModal();
        } else {
            adminPanel.style.display = 'flex';
        }
    }
    if (document.getElementById('models-container')) {
        displayCars();
    }
    
    if (document.getElementById('cars-table')) {
        displayCarsAdmin();
    }
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const burgerMenu = document.getElementById('burgerMenu');
    const nav = document.getElementById('headerNav');

    burgerMenu.addEventListener('click', function() {
        this.classList.toggle('active');
        nav.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
        if (!burgerMenu.contains(e.target) && !nav.contains(e.target)) {
            burgerMenu.classList.remove('active');
            nav.classList.remove('active');
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            burgerMenu.classList.remove('active');
            nav.classList.remove('active');
        }
    });

    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                burgerMenu.classList.remove('active');
                nav.classList.remove('active');
                const target = document.querySelector(href === '#hero' ? '.hero' : href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});

document.querySelectorAll('.admin-nav-link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    const section = this.getAttribute('data-section');
    document.querySelectorAll('.admin-content-block').forEach(block => block.style.display = 'none');
    if (section === 'dashboard') {
      document.querySelector('.admin-dashboard').style.display = 'block';
    } else if (section === 'cars') {
      document.querySelector('.admin-cars').style.display = 'block';
    } else if (section === 'orders') {
      document.querySelector('.admin-orders').style.display = 'block';
    } else if (section === 'clients') {
      document.querySelector('.admin-clients').style.display = 'block';
    } else if (section === 'settings') {
      document.querySelector('.admin-settings').style.display = 'block';
    }
  });
});
if (document.querySelector('.admin-nav-link[data-section="dashboard"]')) {
  document.querySelector('.admin-nav-link[data-section="dashboard"]').classList.add('active');
}

const adminLoginModal = document.getElementById('adminLoginModal');
const adminPanelContainer = document.getElementById('adminPanelContainer');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginError = document.getElementById('adminLoginError');
const closeAdminLogin = document.getElementById('closeAdminLogin');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

const menuAdminBurger = document.getElementById('menuAdminBurger');
if (menuAdminBurger) {
    menuAdminBurger.onclick = function(e) {
        e.preventDefault();
        adminLoginModal.style.display = 'block';
    };
}

if (closeAdminLogin) {
    closeAdminLogin.onclick = function() {
        adminLoginModal.style.display = 'none';
    };
}

if (adminLoginForm) {
    adminLoginForm.onsubmit = async function(e) {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        if (!username || username.length < 3) {
            alert('Пожалуйста, введите имя пользователя (не менее 3 символов).');
            e.preventDefault();
            return;
        }
        if (!password || password.length < 3) {
            alert('Пожалуйста, введите пароль (не менее 3 символов).');
            e.preventDefault();
            return;
        }
        try {
            const result = await login(username, password);
            if (result.success) {
                localStorage.setItem('user', JSON.stringify(result.user));
            adminLoginModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.querySelector('header').style.display = 'none';
            document.querySelector('main').style.display = 'none';
            document.querySelector('footer').style.display = 'none';
            adminPanelContainer.style.display = 'block';
                
                loadAdminCars();
                loadAdminOrders();
                loadAdminCustomers();
                loadMessages();
                listenForMessages();
        } else {
                adminLoginError.style.display = 'block';
            }
        } catch (error) {
            console.error('Ошибка при авторизации:', error);
            adminLoginError.style.display = 'block';
        }
    };
}

if (adminLogoutBtn) {
    adminLogoutBtn.onclick = function(e) {
        e.preventDefault();
        adminPanelContainer.style.display = 'none';
        document.querySelector('header').style.display = '';
        document.querySelector('main').style.display = '';
        document.querySelector('footer').style.display = '';
    };
}

async function loadAdminCars() {
    try {
        const response = await fetch(`${API_URL}/cars`);
        if (!response.ok) {
            throw new Error('Ошибка при загрузке автомобилей');
        }
        
        const cars = await response.json();
    const tbody = document.getElementById('carsTableBody');
        
        if (!tbody) return;
        
    tbody.innerHTML = '';
        
    cars.forEach(car => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${car.image ? 'images/' + car.image : 'images/no-image.png'}" alt="${car.brand_name} ${car.model_name}" width="100"></td>
                <td>${car.brand_name} ${car.model_name}</td>
                <td>${car.year}</td>
                <td>${car.color}</td>
                <td>${car.price.toLocaleString()} ₽</td>
                <td>
                    <select onchange="updateCarStatus(${car.id}, this.value)" class="status-select ${car.status}">
                        <option value="available" ${car.status === 'available' ? 'selected' : ''}>В наличии</option>
                        <option value="sold" ${car.status === 'sold' ? 'selected' : ''}>Продан</option>
                        <option value="reserved" ${car.status === 'reserved' ? 'selected' : ''}>Зарезервирован</option>
                        <option value="pending" ${car.status === 'pending' ? 'selected' : ''}>Ожидается поставка</option>
                        <option value="frozen" ${car.status === 'frozen' ? 'selected' : ''}>Поставки заморожены</option>
                        <option value="discontinued" ${car.status === 'discontinued' ? 'selected' : ''}>Снят с производства</option>
                    </select>
                </td>
                <td>
                    <div class="quantity-controls">
                        <button class="btn btn-sm btn-secondary" onclick="decrementQuantity(${car.id}, ${car.quantity})">-</button>
                        <span class="quantity-value">${car.quantity || 0}</span>
                        <button class="btn btn-sm btn-secondary" onclick="incrementQuantity(${car.id}, ${car.quantity})">+</button>
                    </div>
                </td>
                <td>
                    <button class="btn btn-primary" onclick="editCar(${car.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteCar(${car.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
        `;
            tbody.appendChild(tr);
    });
        
        updateAdminDashboard(cars);
        
        await displayCars();
    } catch (error) {
        console.error('Ошибка при загрузке автомобилей:', error);
        alert('Произошла ошибка при загрузке автомобилей');
    }
}

window.incrementQuantity = async function(carId, currentQuantity) {
    try {
        const response = await fetch(`${API_URL}/cars/${carId}/quantity`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity: currentQuantity + 1 })
        });
        
        if (response.ok) {
            await loadAdminCars();
        } else {
            throw new Error('Ошибка при обновлении количества');
        }
    } catch (error) {
        console.error('Ошибка при увеличении количества:', error);
        alert('Произошла ошибка при обновлении количества автомобилей');
    }
};

window.decrementQuantity = async function(carId, currentQuantity) {
    if (currentQuantity <= 0) return;
    
    try {
        const response = await fetch(`${API_URL}/cars/${carId}/quantity`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity: currentQuantity - 1 })
        });
        
        if (response.ok) {
            await loadAdminCars();
        } else {
            throw new Error('Ошибка при обновлении количества');
        }
    } catch (error) {
        console.error('Ошибка при уменьшении количества:', error);
        alert('Произошла ошибка при обновлении количества автомобилей');
    }
};

window.editCar = function(id) {
    fetch(`${API_URL}/cars`)
        .then(res => res.json())
        .then(cars => {
            const car = cars.find(c => c.id === id);
            if (!car) return;
            document.getElementById('carModalTitle').textContent = 'Редактировать автомобиль';
            document.getElementById('carId').value = car.id;
            document.getElementById('carBrand').value = car.brand_id;
            
            loadCarModels(car.brand_id);
            
            document.getElementById('carModel').value = car.model_id;
            document.getElementById('carVin').value = car.vin;
            document.getElementById('carYear').value = car.year;
            document.getElementById('carColor').value = car.color;
            document.getElementById('carMileage').value = car.mileage;
            document.getElementById('carPrice').value = car.price;
            document.getElementById('carStatus').value = car.status;
            
            document.getElementById('carModal').style.display = 'block';
        });
};

window.deleteCar = async function(id) {
    if (!confirm('Удалить автомобиль?')) return;
    await fetch(`${API_URL}/cars/${id}`, { method: 'DELETE' });
    await loadAdminCars();
};

document.getElementById('addCarBtn').onclick = function() {
    document.getElementById('carModalTitle').textContent = 'Добавить автомобиль';
    document.getElementById('carForm').reset();
    document.getElementById('carId').value = '';
    document.getElementById('carModal').style.display = 'block';
};

document.getElementById('closeCarModal').onclick = function() {
    document.getElementById('carModal').style.display = 'none';
};

document.getElementById('carForm').onsubmit = async function(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('model_id', document.getElementById('carModel').value);
    formData.append('vin', document.getElementById('carVin').value);
    formData.append('year', document.getElementById('carYear').value);
    formData.append('color', document.getElementById('carColor').value);
    formData.append('mileage', document.getElementById('carMileage').value);
    formData.append('price', document.getElementById('carPrice').value);
    formData.append('status', document.getElementById('carStatus').value);
    
    const imageFile = document.getElementById('carImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const carId = document.getElementById('carId').value;
    
    const year = document.getElementById('carYear').value;
    const color = document.getElementById('carColor').value;
    const mileage = document.getElementById('carMileage').value;
    const price = document.getElementById('carPrice').value;
    if (!validateYear(year)) {
        alert('Пожалуйста, введите корректный год (1900-2024).');
        e.preventDefault();
        return;
    }
    if (!validateName(color)) {
        alert('Пожалуйста, введите корректный цвет (только буквы, не менее 2 символов).');
        e.preventDefault();
        return;
    }
    if (!validatePrice(mileage)) {
        alert('Пожалуйста, введите корректный пробег (только положительное число).');
        e.preventDefault();
        return;
    }
    if (!validatePrice(price)) {
        alert('Пожалуйста, введите корректную цену (только положительное число).');
        e.preventDefault();
        return;
    }
    
    try {
        const url = carId ? 
            `${API_URL}/cars/${carId}` : 
            `${API_URL}/cars`;
            
        const response = await fetch(url, {
            method: carId ? 'PUT' : 'POST',
            body: formData
        });
        
        if (response.ok) {
    document.getElementById('carModal').style.display = 'none';
    await loadAdminCars();
            await displayCars();
        }
    } catch (error) {
        console.error('Ошибка при сохранении автомобиля:', error);
    }
};

async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  let hasError = false;
  ['contactName','contactEmail','contactPhone','contactSubject','contactMessage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) clearFieldError(el);
  });
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const subject = form.subject.value.trim();
  const message = form.message.value.trim();
  if (!validateName(name)) {
    showFieldError(form.name, 'Введите корректное имя (только буквы, не менее 2 символов).');
    hasError = true;
  }
  if (!validateEmail(email)) {
    showFieldError(form.email, 'Введите корректный email.');
    hasError = true;
  }
  if (!validatePhone(phone)) {
    showFieldError(form.phone, 'Введите корректный телефон (только цифры, +, -, пробелы, скобки, 10-20 символов).');
    hasError = true;
  }
  if (subject.length < 3) {
    showFieldError(form.subject, 'Тема сообщения должна быть не менее 3 символов.');
    hasError = true;
  }
  if (message.length < 3) {
    showFieldError(form.message, 'Сообщение должно быть не менее 3 символов.');
    hasError = true;
  }
  if (hasError) return;
  try {
    const res = await fetch(`${API_URL}/contact-messages`);
    const messages = await res.json();
    const now = Date.now();
    const isDuplicate = messages.some(m =>
      m.email === email &&
      m.subject === subject &&
      m.message === message &&
      Math.abs(new Date(m.created_at).getTime() - now) < 10 * 60 * 1000
    );
    if (isDuplicate) {
      showFieldError(form.message, 'Похожее сообщение уже отправлено недавно.');
      return;
    }
  } catch (err) {
  }
  const messageData = { name, email, phone, subject, message };
  try {
    const response = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    if (!response.ok) throw new Error('Ошибка при отправке сообщения');
    const result = await response.json();
    if (result.id) {
      form.reset();
      document.getElementById('contactSuccess').style.display = 'block';
      setTimeout(() => {
        document.getElementById('contactSuccess').style.display = 'none';
      }, 5000);
    } else {
      throw new Error('Ошибка при отправке сообщения');
    }
  } catch (error) {
    alert('Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже.');
  }
}
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', handleContactSubmit);
}

async function loadAdminMessages() {
    const res = await fetch(`${API_URL}/contact-messages`);
    const messages = await res.json();
    const notif = document.getElementById('adminMessageNotification');
    if (messages.length > 0) {
        notif.style.display = 'block';
        notif.innerHTML = `<b>Новое сообщение от клиента:</b><br><b>${messages[0].name}</b> (${messages[0].email}):<br>${messages[0].message}<br><small>${new Date(messages[0].created_at).toLocaleString()}</small>`;
    } else {
        notif.style.display = 'none';
    }
}

function listenForMessages() {
    loadAdminMessages();
    setInterval(loadAdminMessages, 10000);
}

const footerAdminPanel = document.getElementById('footerAdminPanel');
const footerAdminLogin = document.getElementById('footerAdminLogin');
const footerAdminContent = document.getElementById('footerAdminContent');
const footerAdminLoginForm = document.getElementById('footerAdminLoginForm');
const footerAdminLoginError = document.getElementById('footerAdminLoginError');
const footerAdminLogout = document.getElementById('footerAdminLogout');
const footerAddCarBtn = document.getElementById('footerAddCarBtn');
const footerCarsTableBody = document.getElementById('footerCarsTableBody');
const footerCarModal = document.getElementById('footerCarModal');
const footerCloseCarModal = document.getElementById('footerCloseCarModal');
const footerCarForm = document.getElementById('footerCarForm');
const footerAdminMessages = document.getElementById('footerAdminMessages');

const openFooterAdminPanelBtn = document.getElementById('openFooterAdminPanelBtn');
if (openFooterAdminPanelBtn) {
    openFooterAdminPanelBtn.onclick = function() {
        footerAdminPanel.style.display = 'block';
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };
}

if (footerAdminLoginForm) {
    footerAdminLoginForm.onsubmit = function(e) {
        e.preventDefault();
        const user = document.getElementById('footerAdminUsername').value;
        const pass = document.getElementById('footerAdminPassword').value;
        if (user === 'admin' && pass === 'admin123') {
            footerAdminLogin.style.display = 'none';
            footerAdminContent.style.display = 'block';
            loadFooterCars();
            loadFooterMessages();
        } else {
            footerAdminLoginError.style.display = 'block';
        }
    };
}
if (footerAdminLogout) {
    footerAdminLogout.onclick = function() {
        footerAdminContent.style.display = 'none';
        footerAdminLogin.style.display = 'block';
    };
}

async function loadFooterCars() {
    const res = await fetch(`${API_URL}/cars`);
    const cars = await res.json();
    footerCarsTableBody.innerHTML = '';
    cars.forEach(car => {
        footerCarsTableBody.innerHTML += `
            <tr>
                <td><img src="${car.image ? 'images/' + car.image : 'images/no-image.png'}" alt="" width="60"></td>
                <td>${car.model_name || ''}</td>
                <td>${car.vin}</td>
                <td>${car.year}</td>
                <td>${car.color}</td>
                <td>${car.price.toLocaleString()} ₽</td>
                <td>${car.status}</td>
                <td>
                    <button onclick="footerEditCar(${car.id})">Редактировать</button>
                    <button onclick="footerDeleteCar(${car.id})">Удалить</button>
                </td>
            </tr>
        `;
    });
}
window.footerEditCar = function(id) {
    fetch(`${API_URL}/cars`).then(res => res.json()).then(cars => {
        const car = cars.find(c => c.id === id);
        if (!car) return;
        document.getElementById('footerCarModalTitle').textContent = 'Редактировать автомобиль';
        document.getElementById('footerCarId').value = car.id;
        document.getElementById('footerCarModel').value = car.model_name || '';
        document.getElementById('footerCarVin').value = car.vin;
        document.getElementById('footerCarYear').value = car.year;
        document.getElementById('footerCarColor').value = car.color;
        document.getElementById('footerCarPrice').value = car.price;
        footerCarModal.style.display = 'block';
    });
};
window.footerDeleteCar = async function(id) {
    if (!confirm('Удалить автомобиль?')) return;
    await fetch(`${API_URL}/cars/${id}`, { method: 'DELETE' });
    await loadFooterCars();
};
if (footerAddCarBtn) {
    footerAddCarBtn.onclick = function() {
        document.getElementById('footerCarModalTitle').textContent = 'Добавить автомобиль';
        footerCarForm.reset();
        document.getElementById('footerCarId').value = '';
        footerCarModal.style.display = 'block';
    };
}
if (footerCloseCarModal) {
    footerCloseCarModal.onclick = function() {
        footerCarModal.style.display = 'none';
    };
}
if (footerCarForm) {
    footerCarForm.onsubmit = async function(e) {
        e.preventDefault();
        const id = document.getElementById('footerCarId').value;
        const model_name = document.getElementById('footerCarModel').value;
        const vin = document.getElementById('footerCarVin').value;
        const year = document.getElementById('footerCarYear').value;
        const color = document.getElementById('footerCarColor').value;
        const price = document.getElementById('footerCarPrice').value;
        const imageInput = document.getElementById('footerCarImage');
        let image = '';
        if (imageInput.files && imageInput.files[0]) {
            const formData = new FormData();
            formData.append('image', imageInput.files[0]);
            const uploadRes = await fetch(`${API_URL}/cars/upload`, {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();
            image = uploadData.imageUrl.split('/').pop();
        }
        const models = await fetchModels();
        const model = models.find(m => m.name === model_name);
        const model_id = model ? model.id : null;
        const carData = { model_id, vin, year, color, price, image };
        if (id) {
            await fetch(`${API_URL}/cars/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(carData)
            });
        } else {
            await fetch(`${API_URL}/cars`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(carData)
            });
        }
        footerCarModal.style.display = 'none';
        await loadFooterCars();
    };
}

async function loadFooterMessages() {
    const res = await fetch(`${API_URL}/contact-messages`);
    const messages = await res.json();
    footerAdminMessages.innerHTML = messages.length === 0 ? '<i>Нет сообщений</i>' : messages.map(m => `
        <div style="border-bottom:1px solid #444; margin-bottom:1rem; padding-bottom:0.5rem;">
            <b>${m.name}</b> (${m.email})<br>${m.message}<br><small>${new Date(m.created_at).toLocaleString()}</small>
        </div>
    `).join('');
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();
        
        if (newStatus === 'cancelled') {
            await fetch(`${API_URL}/cars/${data.car_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'available' })
            });
        }
        
        await loadAdminOrders();
        await displayCars();
        
        return data;
    } catch (error) {
        console.error('Ошибка при обновлении статуса заказа:', error);
        return null;
    }
}

async function loadAdminOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`);
        let orders = await response.json();
        const tbody = document.getElementById('ordersTableBody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        if (!Array.isArray(orders)) {
            console.error('orders is not an array:', orders);
            orders = [];
        }
        orders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${order.customer_name}</td>
                <td>${order.car_name}</td>
                <td>${order.status || ''}</td>
                <td>${order.total_price ? order.total_price.toLocaleString() : ''} ₽</td>
                <td>
                    <select onchange="updateOrderStatus(${order.id}, this.value)" class="status-select ${order.status}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>В обработке</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Выполняется</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Завершен</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Отменен</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-info" onclick="viewOrderDetails(${order.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteOrder(${order.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        updateOrdersStats(orders);
        updateAdminDashboardAnalytics(orders);
    } catch (error) {
        console.error('Ошибка при загрузке заказов:', error);
    }
}

function updateAdminDashboardAnalytics(orders) {
    const totalOrders = Array.isArray(orders) ? orders.length : 0;
    const totalSum = Array.isArray(orders) ? orders.reduce((sum, o) => sum + (o.total_price || 0), 0) : 0;
    const clients = Array.isArray(orders) ? [...new Set(orders.map(o => o.customer_name))] : [];
    const totalClients = clients.length;
    let analyticsBlock = document.getElementById('adminDashboardAnalytics');
    if (!analyticsBlock) {
        analyticsBlock = document.createElement('div');
        analyticsBlock.id = 'adminDashboardAnalytics';
        analyticsBlock.style = 'margin: 2rem 0; display: flex; gap: 2rem;';
        const dashboard = document.querySelector('.admin-dashboard') || document.querySelector('#dashboard');
        if (dashboard) dashboard.prepend(analyticsBlock);
    }
    analyticsBlock.innerHTML = `
        <div><b>Всего заказов:</b> ${totalOrders}</div>
        <div><b>Сумма заказов:</b> ${totalSum.toLocaleString()} ₽</div>
        <div><b>Клиентов:</b> ${totalClients}</div>
    `;
}

async function deleteOrder(orderId) {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadAdminOrders();
            await displayCars();
        }
    } catch (error) {
        console.error('Ошибка при удалении заказа:', error);
    }
}

function viewOrderDetails(orderId) {
    console.log('Просмотр деталей заказа:', orderId);
}

function updateOrdersStats(orders) {
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const totalRevenue = orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.total_price, 0);
    
    const pendingCounter = document.getElementById('pendingOrdersCount');
    const completedCounter = document.getElementById('completedOrdersCount');
    const revenueCounter = document.getElementById('totalRevenue');
    
    if (pendingCounter) pendingCounter.textContent = pendingOrders;
    if (completedCounter) completedCounter.textContent = completedOrders;
    if (revenueCounter) revenueCounter.textContent = totalRevenue.toLocaleString() + ' ₽';
}

async function markMessageAsRead(messageId) {
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
        console.error('Ошибка при отметке сообщения как прочитанного:', error);
        alert('Произошла ошибка при обновлении статуса сообщения');
    }
}

async function deleteMessage(messageId) {
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
        console.error('Ошибка при удалении сообщения:', error);
        alert('Произошла ошибка при удалении сообщения');
    }
}

async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        const customers = await response.json();
        
        const tbody = document.getElementById('customersTableBody');
        tbody.innerHTML = '';
        
        customers.forEach(customer => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td>${customer.orders_count}</td>
                <td>
                    <button class="btn btn-primary" onclick="editCustomer(${customer.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-secondary" onclick="deleteCustomer(${customer.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Ошибка при загрузке клиентов:', error);
    }
}

async function loadAnalytics() {
    try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        document.getElementById('availableCarsCount').textContent = data.available_cars;
        document.getElementById('activeOrdersCount').textContent = data.active_orders;
        document.getElementById('monthlyRevenue').textContent = `${data.monthly_revenue} ₽`;
        document.getElementById('popularModelsCount').textContent = data.popular_models.length;
        
        const ctx = document.getElementById('salesChart').getContext('2d');
        new Chart(ctx, {
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
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
        
        const topModelsList = document.getElementById('topModelsList');
        topModelsList.innerHTML = '';
        data.popular_models.forEach(model => {
            const div = document.createElement('div');
            div.className = 'top-model-item';
            div.innerHTML = `
                <span>${model.name}</span>
                <span>${model.sales_count} продаж</span>
            `;
            topModelsList.appendChild(div);
        });
    } catch (error) {
        console.error('Ошибка при загрузке аналитики:', error);
    }
}

function changeTheme() {
    const theme = document.getElementById('themeSelect').value;
    document.body.className = theme;
    localStorage.setItem('theme', theme);
}

function saveSettings() {
    const email = document.getElementById('notificationEmail').value;
    localStorage.setItem('notificationEmail', email);
    alert('Настройки сохранены');
}

document.addEventListener('DOMContentLoaded', function() {
    const adminPanel = document.getElementById('adminPanelContainer');
    if (adminPanel) {
        loadAdminCars();
        loadAdminOrders();
        loadMessages();
        
        setInterval(() => {
            loadAdminCars();
            loadAdminOrders();
            loadMessages();
        }, 30000);
    } else {
        displayCars();
    }
});

async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.error || 'Неверный логин или пароль' };
        }
        const data = await response.json();
        return data;
    } catch (error) {
        return { success: false, error: 'Ошибка сервера' };
    }
}

function showAdminLoginModal() {
    let modal = document.getElementById('adminLoginModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminLoginModal';
        modal.className = 'modal';
        modal.innerHTML = `
        <div class="modal-content">
            <span class="close" id="closeAdminLogin">&times;</span>
            <h3>Вход в админ-панель</h3>
            <form id="adminLoginForm">
                <label>Имя пользователя: <input type="text" id="adminUsername" required></label><br>
                <label>Пароль: <input type="password" id="adminPassword" required></label><br>
                <button type="submit">Войти</button>
            </form>
            <div id="adminLoginError" style="color:red; display:none;">Неверный логин или пароль</div>
        </div>`;
        document.body.appendChild(modal);
    }
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.getElementById('closeAdminLogin').onclick = function() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    };
    document.getElementById('adminUsername').oninput = document.getElementById('adminPassword').oninput = function() {
        document.getElementById('adminLoginError').style.display = 'none';
    };
    document.getElementById('adminLoginForm').onsubmit = async function(e) {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        if (!username || username.length < 3) {
            alert('Пожалуйста, введите имя пользователя (не менее 3 символов).');
            e.preventDefault();
            return;
        }
        if (!password || password.length < 3) {
            alert('Пожалуйста, введите пароль (не менее 3 символов).');
            e.preventDefault();
            return;
        }
        try {
            const result = await login(username, password);
            if (result.success) {
                localStorage.setItem('user', JSON.stringify(result.user));
                modal.style.display = 'none';
                document.body.style.overflow = '';
                document.querySelector('.admin-wrapper').style.display = 'flex';
            } else {
                document.getElementById('adminLoginError').style.display = 'block';
                document.getElementById('adminLoginError').textContent = result.error || 'Неверный логин или пароль';
            }
        } catch (err) {
            document.getElementById('adminLoginError').style.display = 'block';
            document.getElementById('adminLoginError').textContent = 'Ошибка сервера';
        }
    };
} 

document.addEventListener('DOMContentLoaded', function() {
    loadCarsForCalculator();
    
    document.querySelectorAll('input[name="service"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateCalculator);
    });
    
    document.getElementById('carSelect').addEventListener('change', updateCalculator);
    
    document.getElementById('orderButton').addEventListener('click', showOrderModal);
    
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
});

async function loadCarsForCalculator() {
    try {
        const response = await fetch(`${API_URL}/cars`);
        const cars = await response.json();
        const select = document.getElementById('carSelect');
        
        cars.forEach(car => {
            const option = document.createElement('option');
            option.value = car.id;
            option.dataset.price = car.price;
            option.textContent = `${car.brand_name} ${car.model_name} - ${car.color} (${car.year})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка при загрузке автомобилей:', error);
    }
}

function updateCalculator() {
    const carSelect = document.getElementById('carSelect');
    const selectedCar = carSelect.options[carSelect.selectedIndex];
    const carPrice = selectedCar.value ? parseFloat(selectedCar.dataset.price) : 0;
    
    let servicesPrice = 0;
    document.querySelectorAll('input[name="service"]:checked').forEach(checkbox => {
        servicesPrice += parseFloat(checkbox.value);
    });
    
    document.getElementById('carPrice').textContent = carPrice.toLocaleString() + ' ₽';
    document.getElementById('servicesPrice').textContent = servicesPrice.toLocaleString() + ' ₽';
    document.getElementById('totalPrice').textContent = (carPrice + servicesPrice).toLocaleString() + ' ₽';
}

function showOrderModal() {
    const carSelect = document.getElementById('carSelect');
    const selectedCar = carSelect.options[carSelect.selectedIndex];
    const carPrice = selectedCar.value ? parseFloat(selectedCar.dataset.price) : 0;
    let servicesPrice = 0;
    const selectedServices = [];
    
    document.querySelectorAll('input[name="service"]:checked').forEach(checkbox => {
        const price = parseFloat(checkbox.value);
        servicesPrice += price;
        const serviceName = checkbox.closest('.service-card').querySelector('h3').textContent;
        selectedServices.push({ name: serviceName, price: price });
    });

    if (carPrice === 0 && selectedServices.length === 0) {
        alert('Пожалуйста, выберите автомобиль или хотя бы одну услугу');
        return;
    }
    
    const orderSummary = document.getElementById('orderSummary');
    orderSummary.innerHTML = `
        ${selectedCar.value ? `
            <div class="order-item">
                <strong>Автомобиль:</strong> ${selectedCar.textContent}<br>
                <strong>Стоимость:</strong> ${carPrice.toLocaleString()} ₽
            </div>
        ` : ''}
        ${selectedServices.length ? `
            <div class="order-item">
                <strong>Выбранные услуги:</strong>
                <ul>
                    ${selectedServices.map(service => 
                        `<li>${service.name} - ${service.price.toLocaleString()} ₽</li>`
                    ).join('')}
                </ul>
            </div>
        ` : ''}
        <div class="order-item total">
            <strong>Итого:</strong> ${(carPrice + servicesPrice).toLocaleString()} ₽
        </div>
    `;
    
    document.getElementById('orderModal').style.display = 'block';
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    const carSelect = document.getElementById('carSelect');
    const selectedServices = Array.from(document.querySelectorAll('input[name="service"]:checked'))
        .map(checkbox => ({
            name: checkbox.closest('.service-card').querySelector('h3').textContent,
            price: parseFloat(checkbox.value)
        }));
    
    const orderData = {
        car_id: carSelect.value,
        client_name: document.getElementById('clientName').value,
        client_phone: document.getElementById('clientPhone').value,
        client_email: document.getElementById('clientEmail').value,
        services: selectedServices,
        total_price: parseFloat(document.getElementById('totalPrice').textContent.replace(/[^\d.-]/g, ''))
    };
    
    const name = orderData.client_name;
    const phone = orderData.client_phone;
    const email = orderData.client_email;
    if (!validateName(name)) {
        alert('Пожалуйста, введите корректное имя (только буквы, не менее 2 символов).');
        return;
    }
    if (!validatePhone(phone)) {
        alert('Пожалуйста, введите корректный телефон (только цифры, +, -, пробелы, скобки, 10-20 символов).');
        return;
    }
    if (!validateEmail(email)) {
        alert('Пожалуйста, введите корректный email.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при отправке заказа');
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert('Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.');
            document.getElementById('orderModal').style.display = 'none';
            document.getElementById('orderForm').reset();
            document.querySelectorAll('input[name="service"]').forEach(checkbox => checkbox.checked = false);
            carSelect.value = '';
            updateCalculator();
        } else {
            throw new Error(result.error || 'Ошибка при оформлении заказа');
        }
    } catch (error) {
        console.error('Ошибка при отправке заказа:', error);
        alert('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте позже.');
    }
}

window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function() {
  const phoneInput = document.getElementById('contactPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^\d\+\-\s\(\)]/g, '');
    });
  }
});

function showFieldError(input, message) {
  input.classList.add('input-error');
  let errorDiv = input.nextElementSibling;
  if (!errorDiv || !errorDiv.classList.contains('error-message')) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    input.parentNode.insertBefore(errorDiv, input.nextSibling);
  }
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}
function clearFieldError(input) {
  input.classList.remove('input-error');
  let errorDiv = input.nextElementSibling;
  if (errorDiv && errorDiv.classList.contains('error-message')) {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }
}

async function updateCarStatus(carId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/cars/${carId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            await loadAdminCars();
            await displayCars();
        } else {
            throw new Error('Ошибка при обновлении статуса');
        }
    } catch (error) {
        console.error('Ошибка при обновлении статуса:', error);
        alert('Произошла ошибка при обновлении статуса автомобиля');
    }
}

function updateAdminDashboard(cars) {
    const availableCars = cars.filter(car => car.status === 'available').length;
    const soldCars = cars.filter(car => car.status === 'sold').length;
    const reservedCars = cars.filter(car => car.status === 'reserved').length;
    
    const availableCounter = document.getElementById('availableCarsCount');
    const soldCounter = document.getElementById('soldCarsCount');
    const reservedCounter = document.getElementById('reservedCarsCount');
    
    if (availableCounter) availableCounter.textContent = availableCars;
    if (soldCounter) soldCounter.textContent = soldCars;
    if (reservedCounter) reservedCounter.textContent = reservedCars;
}

async function displayCars() {
    try {
        const response = await fetch(`${API_URL}/cars`);
        const cars = await response.json();
        const container = document.querySelector('.models-grid');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        cars
            .filter(car => car.status === 'available')
            .forEach(car => {
                const card = document.createElement('div');
                card.className = 'model-card';
                card.innerHTML = `
                    <img src="${car.image ? 'images/' + car.image : 'images/no-image.png'}" alt="${car.brand_name} ${car.model_name}">
                    <div class="model-info">
                        <h3>${car.brand_name} ${car.model_name}</h3>
                        <p>Год: ${car.year}</p>
                        <p>Цвет: ${car.color}</p>
                        <div class="price">${car.price.toLocaleString()} ₽</div>
                        <span class="status available">В наличии</span>
                        <button onclick="showCarDetails(${car.id})">Подробнее</button>
                    </div>
                `;
                container.appendChild(card);
            });
    } catch (error) {
        console.error('Ошибка при отображении автомобилей:', error);
    }
}

async function loadCarModels(brandId) {
    try {
        const response = await fetch(`${API_URL}/models?brand_id=${brandId}`);
        const models = await response.json();
        const modelSelect = document.getElementById('carModel');
        
        modelSelect.innerHTML = '<option value="">Выберите модель</option>';
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка при загрузке моделей:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('adminPanelContainer')) {
        loadAdminCars();
    }

    displayCars();
});

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