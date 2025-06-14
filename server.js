const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('.'));

const config = {
    server: 'localhost\\SQLEXPRESS',
    database: 'premium_auto',
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: true,
        trustServerCertificate: true
    }
};

console.log('Конфигурация базы данных:', config);


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });


app.get('/test', (req, res) => {
    res.json({ message: 'Сервер работает!' });
});

let pool;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

async function connectToDatabase() {
    if (isConnecting) return false;
    if (connectionAttempts >= MAX_ATTEMPTS) {
        console.error('Превышено максимальное количество попыток подключения к БД');
        return false;
    }

    try {
        isConnecting = true;
        connectionAttempts++;
        pool = await sql.connect(config);
        console.log('Подключение к базе данных успешно установлено');
        return true;
    } catch (err) {
        console.error('Ошибка подключения к базе данных:', err);
        return false;
    } finally {
        isConnecting = false;
    }
}


async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}


app.get('/api/brands', async (req, res) => {
    try {
        const result = await pool.request()
            .query('SELECT * FROM brands ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка при получении списка брендов:', err);
        res.status(500).json({ error: 'Ошибка сервера при получении брендов' });
    }
});

app.get('/api/models', async (req, res) => {
    try {
        const brandId = req.query.brand_id;
        const query = brandId ? 
            'SELECT * FROM car_models WHERE brand_id = @brand_id' :
            'SELECT * FROM car_models';
            
        const result = await pool.request()
            .input('brand_id', sql.Int, brandId)
            .query(query);
            
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка при получении моделей:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/cars', async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
                SELECT c.*, cm.name as model_name, b.name as brand_name, b.id as brand_id
            FROM cars c
                JOIN car_models cm ON c.model_id = cm.id
                JOIN brands b ON cm.brand_id = b.id
            ORDER BY c.id DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка при получении списка автомобилей:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.get('/api/cars/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT c.*, cm.name as model_name, b.name as brand_name, b.id as brand_id
                FROM cars c
                JOIN car_models cm ON c.model_id = cm.id
                JOIN brands b ON cm.brand_id = b.id
                WHERE c.id = @id
            `);
            
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Автомобиль не найден' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Ошибка при получении автомобиля:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM users WHERE username = @username');
        const user = result.recordset[0];
        if (user && await bcrypt.compare(password, user.password)) {
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ error: 'Неверные учетные данные' });
        }
    } catch (err) {
        console.error('Ошибка при авторизации:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


app.get('/api/customers', async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
                SELECT 
                    c.*,
                    COUNT(o.id) as orders_count,
                    SUM(o.total_price) as total_spent
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id
                GROUP BY 
                    c.id, c.first_name, c.last_name, c.email, c.phone,
                    c.address, c.city, c.postal_code, c.country,
                    c.birth_date, c.registration_date, c.last_visit,
                    c.notes, c.is_active
            ORDER BY c.id DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка при получении списка клиентов:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.get('/api/customers/:id/orders', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('customer_id', sql.Int, id)
            .query(`
                SELECT 
                    o.*,
                    c.brand_name + ' ' + c.model_name as car_name,
                    c.price as car_price,
                    c.image as car_image
                FROM orders o
                JOIN (
                    SELECT 
                        cars.id,
                        brands.name as brand_name,
                        car_models.name as model_name,
                        cars.price,
                        cars.image
                    FROM cars
                    JOIN car_models ON cars.model_id = car_models.id
                    JOIN brands ON car_models.brand_id = brands.id
                ) c ON o.car_id = c.id
                WHERE o.customer_id = @customer_id
                ORDER BY o.order_date DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка при получении заказов клиента:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.post('/api/orders', async (req, res) => {
    try {
        const { car_id, client_name, client_phone, client_email, services, total_price } = req.body;
        

        const clientResult = await pool.request()
            .input('first_name', sql.NVarChar, client_name.split(' ')[0])
            .input('last_name', sql.NVarChar, client_name.split(' ').slice(1).join(' '))
            .input('email', sql.NVarChar, client_email)
            .input('phone', sql.NVarChar, client_phone)
            .query(`
                MERGE INTO customers AS target
                USING (SELECT @first_name as first_name, @last_name as last_name, @email as email, @phone as phone) AS source
                ON target.email = source.email
                WHEN MATCHED THEN
                    UPDATE SET 
                        last_visit = GETDATE(),
                        phone = source.phone
                WHEN NOT MATCHED THEN
                    INSERT (first_name, last_name, email, phone)
                    VALUES (source.first_name, source.last_name, source.email, source.phone);
                
                SELECT id FROM customers WHERE email = @email;
            `);
        
        const customer_id = clientResult.recordset[0].id;
        

        const orderResult = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('car_id', sql.Int, car_id)
            .input('total_price', sql.Decimal(12,2), total_price)
            .query(`
                INSERT INTO orders (customer_id, car_id, total_price, status)
                VALUES (@customer_id, @car_id, @total_price, 'pending');
                SELECT SCOPE_IDENTITY() as order_id;
            `);
        
        const order_id = orderResult.recordset[0].order_id;
        

        await pool.request()
            .input('car_id', sql.Int, car_id)
            .query(`
                UPDATE cars
                SET status = 'sold'
                WHERE id = @car_id;
            `);
            
        res.json({ 
            success: true, 
            message: 'Заказ успешно создан',
            order_id: order_id
        });
    } catch (err) {
        console.error('Ошибка при создании заказа:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/cars/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }
    res.json({ imageUrl: '/images/' + req.file.filename });
});


app.post('/api/cars', upload.single('image'), async (req, res) => {
    try {
        let { brand_id, model_id, vin, year, color, mileage, price, engine, transmission, quantity } = req.body;
        

        if (!vin || vin.trim() === '') {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let randomChars = '';
            for (let i = 0; i < 14; i++) {
                randomChars += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            vin = 'VIN' + randomChars;
        }
        
        let image = 'no-image.png';
        if (req.file) {
            image = req.file.filename;
        }
        
        const result = await pool.request()
            .input('brand_id', sql.Int, brand_id)
            .input('model_id', sql.Int, model_id)
            .input('vin', sql.NVarChar, vin)
            .input('year', sql.Int, year)
            .input('color', sql.NVarChar, color)
            .input('mileage', sql.Int, mileage)
            .input('price', sql.Decimal(12,2), price)
            .input('engine', sql.NVarChar, engine)
            .input('transmission', sql.NVarChar, transmission)
            .input('image', sql.NVarChar, image)
            .input('status', sql.NVarChar, 'available')
            .input('quantity', sql.Int, quantity || 1)
            .query(`
                INSERT INTO cars (brand_id, model_id, vin, year, color, mileage, price, engine, transmission, image, status, quantity)
                VALUES (@brand_id, @model_id, @vin, @year, @color, @mileage, @price, @engine, @transmission, @image, @status, @quantity);
                SELECT SCOPE_IDENTITY() as id;
            `);
            
        res.json({ 
            success: true, 
            message: 'Автомобиль успешно добавлен',
            id: result.recordset[0].id
        });
    } catch (err) {
        console.error('Ошибка при добавлении автомобиля:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.put('/api/cars/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { brand_id, model_id, year, color, mileage, price, engine, transmission } = req.body;
        
        let image = undefined;
        if (req.file) {
            image = req.file.filename;
        }

        let query = `
            UPDATE cars
            SET brand_id = @brand_id,
                model_id = @model_id,
                year = @year,
                color = @color,
                mileage = @mileage,
                price = @price,
                engine = @engine,
                transmission = @transmission
        `;
        
        if (image) {
            query += `, image = @image`;
        }
        
        query += ` WHERE id = @id`;

        const request = pool.request()
            .input('id', sql.Int, id)
            .input('brand_id', sql.Int, brand_id)
            .input('model_id', sql.Int, model_id)
            .input('year', sql.Int, year)
            .input('color', sql.NVarChar, color)
            .input('mileage', sql.Int, mileage)
            .input('price', sql.Decimal(12,2), price)
            .input('engine', sql.NVarChar, engine)
            .input('transmission', sql.NVarChar, transmission);
            
        if (image) {
            request.input('image', sql.NVarChar, image);
        }
        
        await request.query(query);
        
        res.json({ 
            success: true, 
            message: 'Автомобиль успешно обновлен' 
        });
    } catch (err) {
        console.error('Ошибка при обновлении автомобиля:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.delete('/api/cars/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM cars WHERE id = @id');
        
        res.json({ 
            success: true, 
            message: 'Автомобиль успешно удален' 
        });
    } catch (err) {
        console.error('Ошибка при удалении автомобиля:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.get('/api/test-db', async (req, res) => {
    try {
        if (!pool) {
            const connected = await connectToDatabase();
            if (!connected) {
                return res.status(500).json({ error: 'Не удалось подключиться к базе данных' });
            }
        }
        const result = await pool.request().query('SELECT TOP 1 * FROM car_models');
        res.json({ 
            status: 'success',
            message: 'Подключение к базе данных работает',
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('Ошибка при тестировании подключения:', err);
        res.status(500).json({ 
            error: 'Ошибка при тестировании подключения к базе данных',
            details: err.message 
        });
    }
});

app.get('/api/contact-messages', async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
                SELECT *
                FROM contact_messages
                ORDER BY created_at DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка при получении списка сообщений:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone)
            .input('subject', sql.NVarChar, subject)
            .input('message', sql.NVarChar, message)
            .query(`
                INSERT INTO contact_messages (name, email, phone, subject, message)
                VALUES (@name, @email, @phone, @subject, @message);
                
                SELECT SCOPE_IDENTITY() as id;
            `);
            
        const messageId = result.recordset[0].id;
        

        const messageResult = await pool.request()
            .input('id', sql.Int, messageId)
            .query('SELECT * FROM contact_messages WHERE id = @id');
            
        res.json(messageResult.recordset[0]);
    } catch (err) {
        console.error('Ошибка при создании сообщения:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.put('/api/contact-messages/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.request()
            .input('id', sql.Int, id)
            .query(`
                UPDATE contact_messages
                SET is_read = 1,
                    status = 'read',
                    updated_at = GETDATE()
                WHERE id = @id
            `);
            
        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка при обновлении статуса сообщения:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.delete('/api/contact-messages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM contact_messages WHERE id = @id');
            
        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка при удалении сообщения:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.get('/api/orders', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT o.id, c.first_name + ' ' + c.last_name as customer_name, c.email as customer_email, c.phone as customer_phone,
                   m.name as car_name, cars.price as total_price, o.status, o.created_at
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            JOIN cars ON o.car_id = cars.id
            JOIN car_models m ON cars.model_id = m.id
            ORDER BY 
                CASE WHEN o.status = 'pending' THEN 0 ELSE 1 END, 
                o.created_at DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        

        const orderResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    o.*,
                    c.first_name + ' ' + c.last_name as customer_name,
                    c.email as customer_email,
                    c.phone as customer_phone,
                    car.brand_name + ' ' + car.model_name as car_name,
                    car.price as car_price,
                    car.image as car_image
                FROM orders o
                JOIN customers c ON o.customer_id = c.id
                JOIN (
                    SELECT 
                        cars.id,
                        brands.name as brand_name,
                        car_models.name as model_name,
                        cars.price,
                        cars.image
                    FROM cars
                    JOIN car_models ON cars.model_id = car_models.id
                    JOIN brands ON car_models.brand_id = brands.id
                ) car ON o.car_id = car.id
                WHERE o.id = @id
            `);
            
        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }
        
        const order = orderResult.recordset[0];
        

        const servicesResult = await pool.request()
            .input('order_id', sql.Int, id)
            .query(`
                SELECT 
                    s.*,
                    os.price as order_price
                FROM order_services os
                JOIN services s ON os.service_id = s.id
                WHERE os.order_id = @order_id
            `);
            
        order.services = servicesResult.recordset;
        
        res.json(order);
    } catch (err) {
        console.error('Ошибка при получении деталей заказа:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, status)
            .query(`
                UPDATE orders
                SET status = @status,
                    updated_at = GETDATE()
                WHERE id = @id
            `);
            

        if (status === 'cancelled') {
            await pool.request()
                .input('order_id', sql.Int, id)
                .query(`
                    UPDATE cars
                    SET status = 'available'
                    WHERE id = (SELECT car_id FROM orders WHERE id = @order_id)
                `);
        }
            
        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка при обновлении статуса заказа:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.get('/api/services', async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM services ORDER BY id DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка при получении списка услуг:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.post('/api/services', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price } = req.body;
        const image = req.file ? req.file.filename : null;
        
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .input('price', sql.Decimal(10, 2), price)
            .input('image', sql.NVarChar, image)
            .query(`
                INSERT INTO services (name, description, price, image)
                VALUES (@name, @description, @price, @image);
                SELECT SCOPE_IDENTITY() as id;
            `);
            
        res.json({ 
            success: true, 
            id: result.recordset[0].id,
            message: 'Услуга успешно добавлена' 
        });
    } catch (err) {
        console.error('Ошибка при добавлении услуги:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.put('/api/services/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price } = req.body;
        const image = req.file ? req.file.filename : undefined;

        let query = `
                UPDATE services
                SET name = @name,
                    description = @description,
                price = @price
        `;
        
        if (image) {
            query += `, image = @image`;
        }
        
        query += ` WHERE id = @id`;

        const request = pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .input('price', sql.Decimal(10, 2), price);

        if (image) {
            request.input('image', sql.NVarChar, image);
        }

        await request.query(query);
            
        res.json({ 
            success: true, 
            message: 'Услуга успешно обновлена' 
        });
    } catch (err) {
        console.error('Ошибка при обновлении услуги:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.delete('/api/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM services WHERE id = @id');
            
        res.json({ 
            success: true, 
            message: 'Услуга успешно удалена' 
        });
    } catch (err) {
        console.error('Ошибка при удалении услуги:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.put('/api/cars/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, status)
            .query(`
            UPDATE cars
                SET status = @status, updated_at = GETDATE()
                WHERE id = @id
            `);
            
        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка при обновлении статуса автомобиля:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});
        
app.get('/api/customers/details', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query(`
                SELECT 
                    c.*,
                    COUNT(o.id) as total_orders,
                    SUM(o.total_price) as total_spent,
                    MAX(o.order_date) as last_order_date
                FROM customers c
                LEFT JOIN orders o ON c.id = o.customer_id
                GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, 
                         c.address, c.city, c.postal_code, c.country, 
                         c.birth_date, c.registration_date, c.last_visit,
                         c.notes, c.is_active
                ORDER BY total_orders DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка при получении информации о клиентах:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
        });
        

app.put('/api/cars/:id/quantity', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        
        if (quantity < 0) {
            return res.status(400).json({ error: 'Количество не может быть отрицательным' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('quantity', sql.Int, quantity)
            .query(`
                UPDATE cars
                SET quantity = @quantity,
                    updated_at = GETDATE(),
                    status = CASE 
                        WHEN @quantity > 0 THEN 'available'
                        WHEN @quantity = 0 THEN 'out_of_stock'
                        ELSE status
                    END
            WHERE id = @id
            `);
            

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT c.*, cm.name as model_name, b.name as brand_name
                FROM cars c
                JOIN car_models cm ON c.model_id = cm.id
                JOIN brands b ON cm.brand_id = b.id
                WHERE c.id = @id
            `);
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Ошибка при обновлении количества автомобилей:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


const PORT = process.env.PORT || 3000;

async function startServer() {
    await connectToDatabase();
    app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`);
    });
}

startServer();


app.get('/api/analytics', async (req, res) => {
    try {

        const availableCars = await pool.request().query(`
            SELECT COUNT(*) as count FROM cars WHERE status = 'available'
        `);

        const activeOrders = await pool.request().query(`
            SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'processing')
        `);

        const monthlyRevenue = await pool.request().query(`
            SELECT ISNULL(SUM(total_price), 0) as revenue
            FROM orders
            WHERE status = 'completed'
              AND MONTH(created_at) = MONTH(GETDATE())
              AND YEAR(created_at) = YEAR(GETDATE())
        `);

        const popularModels = await pool.request().query(`
            SELECT TOP 3 m.name as name, COUNT(o.id) as sales_count
            FROM car_models m
            JOIN cars c ON m.id = c.model_id
            JOIN orders o ON c.id = o.car_id
            WHERE o.status = 'completed'
            GROUP BY m.name
            ORDER BY sales_count DESC
        `);

        const salesChart = await pool.request().query(`
            SELECT 
                FORMAT(created_at, 'MMM yyyy') as month,
                SUM(total_price) as revenue
            FROM orders
            WHERE status = 'completed'
              AND created_at >= DATEADD(MONTH, -11, GETDATE())
            GROUP BY FORMAT(created_at, 'MMM yyyy')
            ORDER BY MIN(created_at)
        `);

        const topServices = await pool.request().query(`
            SELECT s.name, COUNT(os.order_id) as usage_count
            FROM services s
            JOIN order_services os ON s.id = os.service_id
            GROUP BY s.name
            ORDER BY usage_count DESC
        `);

        const topClients = await pool.request().query(`
            SELECT TOP 3 c.first_name + ' ' + c.last_name as client, SUM(o.total_price) as total_spent
            FROM customers c
            JOIN orders o ON c.id = o.customer_id
            WHERE o.status = 'completed'
            GROUP BY c.first_name, c.last_name
            ORDER BY total_spent DESC
        `);
        const avgCheck = await pool.request().query(`
            SELECT AVG(total_price) as avg_check
            FROM orders
            WHERE status = 'completed'
        `);
        res.json({
            available_cars: availableCars.recordset[0].count,
            active_orders: activeOrders.recordset[0].count,
            monthly_revenue: monthlyRevenue.recordset[0].revenue,
            popular_models: popularModels.recordset,
            sales_chart: {
                labels: salesChart.recordset.map(r => r.month),
                data: salesChart.recordset.map(r => r.revenue)
            },
            top_services: topServices.recordset,
            top_clients: topClients.recordset,
            avg_check: avgCheck.recordset[0].avg_check
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/analytics/export', async (req, res) => {
    try {
        const analytics = await pool.request().query(`
            SELECT m.name as model, COUNT(o.id) as sales_count
            FROM car_models m
            JOIN cars c ON m.id = c.model_id
            JOIN orders o ON c.id = o.car_id
            WHERE o.status = 'completed'
            GROUP BY m.name
        `);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Аналитика');

        worksheet.columns = [
            { header: 'Модель', key: 'model', width: 30 },
            { header: 'Продаж', key: 'sales_count', width: 15 }
        ];

        analytics.recordset.forEach(row => worksheet.addRow(row));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Ошибка экспорта аналитики:', err);
        res.status(500).json({ error: 'Ошибка экспорта аналитики' });
    }
}); 