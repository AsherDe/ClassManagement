const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'class_management_system',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
    process.exit(-1);
});

// 数据库查询封装函数
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`🔍 Query executed in ${duration}ms`);
        return result;
    } catch (error) {
        const duration = Date.now() - start;
        console.error(`❌ Query error (${duration}ms):`, error);
        throw error;
    }
};

// 事务处理函数
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// 测试数据库连接
const testConnection = async () => {
    try {
        const result = await query('SELECT NOW()');
        console.log('📅 Database time:', result.rows[0].now);
        
        const versionResult = await query('SELECT version()');
        console.log('🐘 PostgreSQL version:', versionResult.rows[0].version.split(' ')[1]);
        
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
    }
};

// 常用查询函数
const findOne = async (table, conditions = {}, columns = '*') => {
    const keys = Object.keys(conditions);
    if (keys.length === 0) {
        throw new Error('Conditions cannot be empty for findOne');
    }
    
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    const values = keys.map(key => conditions[key]);
    
    const text = `SELECT ${columns} FROM ${table} WHERE ${whereClause} LIMIT 1`;
    const result = await query(text, values);
    
    return result.rows[0] || null;
};

const findMany = async (table, conditions = {}, options = {}) => {
    const { limit, offset, orderBy, columns = '*' } = options;
    const keys = Object.keys(conditions);
    
    let text = `SELECT ${columns} FROM ${table}`;
    let values = [];
    
    if (keys.length > 0) {
        const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
        text += ` WHERE ${whereClause}`;
        values = keys.map(key => conditions[key]);
    }
    
    if (orderBy) {
        text += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
        text += ` LIMIT ${limit}`;
    }
    
    if (offset) {
        text += ` OFFSET ${offset}`;
    }
    
    const result = await query(text, values);
    return result.rows;
};

const create = async (table, data) => {
    const keys = Object.keys(data);
    const values = keys.map(key => data[key]);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    
    const text = `
        INSERT INTO ${table} (${keys.join(', ')})
        VALUES (${placeholders})
        RETURNING *
    `;
    
    const result = await query(text, values);
    return result.rows[0];
};

const update = async (table, data, conditions) => {
    const dataKeys = Object.keys(data);
    const conditionKeys = Object.keys(conditions);
    
    if (dataKeys.length === 0) {
        throw new Error('Data cannot be empty for update');
    }
    
    if (conditionKeys.length === 0) {
        throw new Error('Conditions cannot be empty for update');
    }
    
    const setClause = dataKeys.map((key, index) => 
        `${key} = $${index + 1}`
    ).join(', ');
    
    const whereClause = conditionKeys.map((key, index) => 
        `${key} = $${dataKeys.length + index + 1}`
    ).join(' AND ');
    
    const values = [
        ...dataKeys.map(key => data[key]),
        ...conditionKeys.map(key => conditions[key])
    ];
    
    const text = `
        UPDATE ${table}
        SET ${setClause}
        WHERE ${whereClause}
        RETURNING *
    `;
    
    const result = await query(text, values);
    return result.rows[0];
};

const remove = async (table, conditions) => {
    const keys = Object.keys(conditions);
    
    if (keys.length === 0) {
        throw new Error('Conditions cannot be empty for delete');
    }
    
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    const values = keys.map(key => conditions[key]);
    
    const text = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
    const result = await query(text, values);
    
    return result.rows;
};

// 复杂查询函数
const executeStoredProcedure = async (procedureName, params = []) => {
    const placeholders = params.map((_, index) => `$${index + 1}`).join(', ');
    const text = `CALL ${procedureName}(${placeholders})`;
    
    const result = await query(text, params);
    return result.rows;
};

const executeFunction = async (functionName, params = []) => {
    const placeholders = params.map((_, index) => `$${index + 1}`).join(', ');
    const text = `SELECT * FROM ${functionName}(${placeholders})`;
    
    const result = await query(text, params);
    return result.rows;
};

// 统计查询函数
const count = async (table, conditions = {}) => {
    const keys = Object.keys(conditions);
    let text = `SELECT COUNT(*) as count FROM ${table}`;
    let values = [];
    
    if (keys.length > 0) {
        const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
        text += ` WHERE ${whereClause}`;
        values = keys.map(key => conditions[key]);
    }
    
    const result = await query(text, values);
    return parseInt(result.rows[0].count);
};

// 分页查询函数
const paginate = async (table, conditions = {}, options = {}) => {
    const { page = 1, limit = 10, orderBy, columns = '*' } = options;
    const offset = (page - 1) * limit;
    
    const [rows, total] = await Promise.all([
        findMany(table, conditions, { limit, offset, orderBy, columns }),
        count(table, conditions)
    ]);
    
    return {
        data: rows,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
};

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    findOne,
    findMany,
    create,
    update,
    remove,
    executeStoredProcedure,
    executeFunction,
    count,
    paginate
};