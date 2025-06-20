const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../database/connection');

const fundValidationRules = () => {
    return [
        body('class_id').isInt({ min: 1 }).withMessage('班级ID必须是正整数'),
        body('transaction_type').isIn(['income', 'expense']).withMessage('交易类型必须是income或expense'),
        body('amount').isFloat({ min: 0.01 }).withMessage('金额必须大于0'),
        body('category').notEmpty().withMessage('类别不能为空'),
        body('description').notEmpty().withMessage('描述不能为空'),
        body('transaction_date').isISO8601().withMessage('交易日期格式不正确')
    ];
};

/**
 * @route GET /api/funds
 * @desc 获取班费记录列表
 * @access Private
 */
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            class_id, 
            transaction_type, 
            status,
            start_date,
            end_date
        } = req.query;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (class_id) {
            whereConditions.push(`f.class_id = $${paramIndex++}`);
            params.push(class_id);
        }

        if (transaction_type) {
            whereConditions.push(`f.transaction_type = $${paramIndex++}`);
            params.push(transaction_type);
        }

        if (status) {
            whereConditions.push(`f.status = $${paramIndex++}`);
            params.push(status);
        }

        if (start_date) {
            whereConditions.push(`f.transaction_date >= $${paramIndex++}`);
            params.push(start_date);
        }

        if (end_date) {
            whereConditions.push(`f.transaction_date <= $${paramIndex++}`);
            params.push(end_date);
        }

        const offset = (page - 1) * limit;
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                f.*,
                c.class_name,
                c.class_code,
                h.username as handler_name,
                a.username as approver_name
            FROM class_funds f
            JOIN classes c ON f.class_id = c.id
            LEFT JOIN users h ON f.handler_id = h.id
            LEFT JOIN users a ON f.approver_id = a.id
            ${whereClause}
            ORDER BY f.transaction_date DESC, f.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(limit, offset);

        const result = await db.query(query, params);

        // 获取总数
        const countQuery = `
            SELECT COUNT(*) as total
            FROM class_funds f
            ${whereClause}
        `;

        const countResult = await db.query(countQuery, params.slice(0, -2));
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('获取班费记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取班费记录失败'
        });
    }
});

/**
 * @route GET /api/funds/summary/:class_id
 * @desc 获取班费汇总信息
 * @access Private
 */
router.get('/summary/:class_id', async (req, res) => {
    try {
        const { class_id } = req.params;
        const { start_date, end_date } = req.query;

        let whereConditions = [`class_id = $1`, `status = 'approved'`];
        let params = [class_id];
        let paramIndex = 2;

        if (start_date) {
            whereConditions.push(`transaction_date >= $${paramIndex++}`);
            params.push(start_date);
        }

        if (end_date) {
            whereConditions.push(`transaction_date <= $${paramIndex++}`);
            params.push(end_date);
        }

        const whereClause = whereConditions.join(' AND ');

        // 获取收支汇总
        const summaryQuery = `
            SELECT 
                SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expense,
                SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END) as balance,
                COUNT(*) as total_transactions,
                COUNT(CASE WHEN transaction_type = 'income' THEN 1 END) as income_count,
                COUNT(CASE WHEN transaction_type = 'expense' THEN 1 END) as expense_count
            FROM class_funds
            WHERE ${whereClause}
        `;

        const summaryResult = await db.query(summaryQuery, params);

        // 获取分类统计
        const categoryQuery = `
            SELECT 
                category,
                transaction_type,
                SUM(amount) as total_amount,
                COUNT(*) as transaction_count
            FROM class_funds
            WHERE ${whereClause}
            GROUP BY category, transaction_type
            ORDER BY total_amount DESC
        `;

        const categoryResult = await db.query(categoryQuery, params);

        // 获取班级当前余额
        const balanceQuery = `
            SELECT class_fund_balance
            FROM classes
            WHERE id = $1
        `;

        const balanceResult = await db.query(balanceQuery, [class_id]);

        res.json({
            success: true,
            data: {
                summary: summaryResult.rows[0],
                categories: categoryResult.rows,
                current_balance: balanceResult.rows[0]?.class_fund_balance || 0
            }
        });

    } catch (error) {
        console.error('获取班费汇总错误:', error);
        res.status(500).json({
            success: false,
            message: '获取班费汇总失败'
        });
    }
});

/**
 * @route POST /api/funds
 * @desc 创建班费记录
 * @access Private
 */
router.post('/', fundValidationRules(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const fundData = req.body;
        
        // 使用事务处理
        const result = await db.transaction(async (client) => {
            // 创建班费记录
            const fundRecord = await client.query(`
                INSERT INTO class_funds (${Object.keys(fundData).join(', ')})
                VALUES (${Object.keys(fundData).map((_, i) => `$${i + 1}`).join(', ')})
                RETURNING *
            `, Object.values(fundData));

            return fundRecord.rows[0];
        });

        res.status(201).json({
            success: true,
            message: '班费记录创建成功',
            data: result
        });

    } catch (error) {
        console.error('创建班费记录错误:', error);
        res.status(500).json({
            success: false,
            message: '创建班费记录失败'
        });
    }
});

/**
 * @route PUT /api/funds/:id/approve
 * @desc 审批班费记录
 * @access Private
 */
router.put('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approver_id } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '审批状态必须是approved或rejected'
            });
        }

        // 使用事务处理审批
        const result = await db.transaction(async (client) => {
            // 更新班费记录状态
            const updateResult = await client.query(`
                UPDATE class_funds 
                SET status = $1, approver_id = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `, [status, approver_id, id]);

            if (updateResult.rows.length === 0) {
                throw new Error('班费记录不存在');
            }

            const fundRecord = updateResult.rows[0];

            // 如果审批通过，更新班级余额
            if (status === 'approved') {
                const balanceChange = fundRecord.transaction_type === 'income' 
                    ? fundRecord.amount 
                    : -fundRecord.amount;

                await client.query(`
                    UPDATE classes 
                    SET class_fund_balance = class_fund_balance + $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [balanceChange, fundRecord.class_id]);
            }

            return fundRecord;
        });

        res.json({
            success: true,
            message: `班费记录${status === 'approved' ? '审批通过' : '审批拒绝'}`,
            data: result
        });

    } catch (error) {
        console.error('审批班费记录错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '审批班费记录失败'
        });
    }
});

module.exports = router;