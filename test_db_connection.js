const sql = require('mssql/msnodesqlv8');

const config = {
    server: 'localhost\\SQLEXPRESS',
    database: 'premium_auto',
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function testConnection() {
    let pool;
    try {
        console.log('Конфигурация подключения:', JSON.stringify(config, null, 2));
        console.log('\nПопытка подключения к базе данных...');
        
        pool = await new sql.ConnectionPool(config).connect();
        console.log('✅ Подключение к пулу установлено');
        
        const result = await pool.request().query('SELECT COUNT(*) as count FROM cars');
        console.log('✅ Тестовый запрос выполнен успешно');
        console.log(`📊 Количество автомобилей в базе: ${result.recordset[0].count}`);

        const tables = ['cars', 'brands', 'car_models', 'customers', 'orders', 'services'];
        console.log('\nПроверка основных таблиц:');
        
        for (const table of tables) {
            try {
                const tableResult = await pool.request()
                    .input('tableName', sql.VarChar, table)
                    .query(`
                        SELECT COUNT(*) as count 
                        FROM INFORMATION_SCHEMA.TABLES 
                        WHERE TABLE_NAME = @tableName
                    `);
                
                const exists = tableResult.recordset[0].count > 0;
                console.log(`${exists ? '✅' : '❌'} Таблица ${table}: ${exists ? 'существует' : 'не найдена'}`);

                if (exists) {
                    const countResult = await pool.request()
                        .query(`SELECT COUNT(*) as count FROM ${table}`);
                    console.log(`   └─ Количество записей: ${countResult.recordset[0].count}`);
                }
            } catch (err) {
                console.log(`❌ Ошибка при проверке таблицы ${table}:`);
                console.log(`   └─ ${err.message}`);
            }
        }

    } catch (err) {
        console.error('❌ Ошибка подключения к базе данных:');
        console.error('Сообщение:', err.message);
        if (err.code) console.error('Код ошибки:', err.code);
        if (err.originalError) console.error('Оригинальная ошибка:', err.originalError);
        console.error('\nПолная информация об ошибке:', err);
    } finally {
        if (pool) {
            try {
                await pool.close();
                console.log('\n✅ Соединение с базой данных закрыто');
            } catch (err) {
                console.error('\n❌ Ошибка при закрытии соединения:', err.message);
            }
        }
        try {
            await sql.close();
        } catch (err) {
            console.error('❌ Ошибка при закрытии всех соединений:', err.message);
        }
    }
}

console.log('🔄 Запуск теста подключения к базе данных...\n');
testConnection(); 