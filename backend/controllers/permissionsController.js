const db = require('../database/connection');

class PermissionsController {
  // 获取所有权限列表
  async getAllPermissions(req, res) {
    try {
      const { category, keyword } = req.query;
      
      let query = 'SELECT * FROM permissions WHERE 1=1';
      let params = [];
      
      if (category) {
        query += ' AND category = $' + (params.length + 1);
        params.push(category);
      }
      
      if (keyword) {
        query += ' AND (permission_name ILIKE $' + (params.length + 1) + ' OR permission_key ILIKE $' + (params.length + 2) + ')';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      query += ' ORDER BY category, permission_name';
      
      const permissions = await db.findMany('permissions', {}, query, params);
      
      res.json({
        code: 200,
        message: '获取权限列表成功',
        data: permissions
      });
    } catch (error) {
      console.error('获取权限列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取权限列表失败',
        error: error.message
      });
    }
  }

  // 获取权限分类列表
  async getPermissionCategories(req, res) {
    try {
      const query = 'SELECT DISTINCT category FROM permissions ORDER BY category';
      const result = await db.query(query);
      const categories = result.rows.map(row => row.category);
      
      res.json({
        code: 200,
        message: '获取权限分类成功',
        data: categories
      });
    } catch (error) {
      console.error('获取权限分类失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取权限分类失败',
        error: error.message
      });
    }
  }

  // 创建新权限
  async createPermission(req, res) {
    try {
      const { permission_name, permission_key, category, description } = req.body;
      
      if (!permission_name || !permission_key || !category) {
        return res.status(400).json({
          code: 400,
          message: '权限名称、权限标识符和分类为必填项'
        });
      }

      const permission = await db.create('permissions', {
        permission_name,
        permission_key,
        category,
        description
      });

      res.json({
        code: 200,
        message: '创建权限成功',
        data: permission
      });
    } catch (error) {
      console.error('创建权限失败:', error);
      if (error.code === '23505') { // 唯一约束冲突
        res.status(400).json({
          code: 400,
          message: '权限名称或标识符已存在'
        });
      } else {
        res.status(500).json({
          code: 500,
          message: '创建权限失败',
          error: error.message
        });
      }
    }
  }

  // 更新权限
  async updatePermission(req, res) {
    try {
      const { id } = req.params;
      const { permission_name, permission_key, category, description } = req.body;

      const permission = await db.update('permissions', { id }, {
        permission_name,
        permission_key,
        category,
        description
      });

      if (!permission) {
        return res.status(404).json({
          code: 404,
          message: '权限不存在'
        });
      }

      res.json({
        code: 200,
        message: '更新权限成功',
        data: permission
      });
    } catch (error) {
      console.error('更新权限失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新权限失败',
        error: error.message
      });
    }
  }

  // 删除权限
  async deletePermission(req, res) {
    try {
      const { id } = req.params;

      // 检查是否有用户拥有此权限
      const userPermissions = await db.findMany('user_permissions', { permission_id: id });
      if (userPermissions.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '无法删除，存在用户拥有此权限'
        });
      }

      const deleted = await db.remove('permissions', { id });
      if (!deleted) {
        return res.status(404).json({
          code: 404,
          message: '权限不存在'
        });
      }

      res.json({
        code: 200,
        message: '删除权限成功'
      });
    } catch (error) {
      console.error('删除权限失败:', error);
      res.status(500).json({
        code: 500,
        message: '删除权限失败',
        error: error.message
      });
    }
  }

  // 获取用户权限列表
  async getUserPermissions(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const query = `
        SELECT 
          up.id,
          up.user_id,
          up.permission_id,
          up.granted_at,
          up.expires_at,
          up.is_active,
          p.permission_name,
          p.permission_key,
          p.category,
          p.description,
          u.username as granted_by_name
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        LEFT JOIN users u ON up.granted_by = u.id
        WHERE up.user_id = $1
        ORDER BY p.category, p.permission_name
        LIMIT $2 OFFSET $3
      `;
      
      const offset = (page - 1) * limit;
      const result = await db.query(query, [userId, limit, offset]);
      
      // 获取总数
      const countQuery = 'SELECT COUNT(*) FROM user_permissions WHERE user_id = $1';
      const countResult = await db.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        code: 200,
        message: '获取用户权限成功',
        data: {
          permissions: result.rows,
          pagination: {
            current: parseInt(page),
            size: parseInt(limit),
            total
          }
        }
      });
    } catch (error) {
      console.error('获取用户权限失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取用户权限失败',
        error: error.message
      });
    }
  }

  // 为用户分配权限
  async assignPermissionToUser(req, res) {
    try {
      const { userId, permissionId } = req.params;
      const { expires_at } = req.body;
      const grantedBy = req.user?.id; // 从认证中间件获取当前用户ID

      // 检查用户是否已有此权限
      const existing = await db.findOne('user_permissions', { 
        user_id: userId, 
        permission_id: permissionId 
      });

      if (existing) {
        return res.status(400).json({
          code: 400,
          message: '用户已拥有此权限'
        });
      }

      const userPermission = await db.create('user_permissions', {
        user_id: userId,
        permission_id: permissionId,
        granted_by: grantedBy,
        expires_at: expires_at || null,
        is_active: true
      });

      res.json({
        code: 200,
        message: '分配权限成功',
        data: userPermission
      });
    } catch (error) {
      console.error('分配权限失败:', error);
      res.status(500).json({
        code: 500,
        message: '分配权限失败',
        error: error.message
      });
    }
  }

  // 撤销用户权限
  async revokePermissionFromUser(req, res) {
    try {
      const { userId, permissionId } = req.params;

      const deleted = await db.remove('user_permissions', {
        user_id: userId,
        permission_id: permissionId
      });

      if (!deleted) {
        return res.status(404).json({
          code: 404,
          message: '用户权限不存在'
        });
      }

      res.json({
        code: 200,
        message: '撤销权限成功'
      });
    } catch (error) {
      console.error('撤销权限失败:', error);
      res.status(500).json({
        code: 500,
        message: '撤销权限失败',
        error: error.message
      });
    }
  }

  // 批量分配权限
  async batchAssignPermissions(req, res) {
    try {
      const { userId } = req.params;
      const { permissionIds, expires_at } = req.body;
      const grantedBy = req.user?.id;

      if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '权限ID列表不能为空'
        });
      }

      const results = [];
      for (const permissionId of permissionIds) {
        try {
          // 检查是否已存在
          const existing = await db.findOne('user_permissions', {
            user_id: userId,
            permission_id: permissionId
          });

          if (!existing) {
            const userPermission = await db.create('user_permissions', {
              user_id: userId,
              permission_id: permissionId,
              granted_by: grantedBy,
              expires_at: expires_at || null,
              is_active: true
            });
            results.push({ permissionId, status: 'success', data: userPermission });
          } else {
            results.push({ permissionId, status: 'skipped', message: '权限已存在' });
          }
        } catch (error) {
          results.push({ permissionId, status: 'error', message: error.message });
        }
      }

      res.json({
        code: 200,
        message: '批量分配权限完成',
        data: results
      });
    } catch (error) {
      console.error('批量分配权限失败:', error);
      res.status(500).json({
        code: 500,
        message: '批量分配权限失败',
        error: error.message
      });
    }
  }

  // 更新用户权限状态
  async updateUserPermissionStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active, expires_at } = req.body;

      const userPermission = await db.update('user_permissions', { id }, {
        is_active,
        expires_at
      });

      if (!userPermission) {
        return res.status(404).json({
          code: 404,
          message: '用户权限不存在'
        });
      }

      res.json({
        code: 200,
        message: '更新权限状态成功',
        data: userPermission
      });
    } catch (error) {
      console.error('更新权限状态失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新权限状态失败',
        error: error.message
      });
    }
  }

  // 获取所有用户及其权限概览
  async getUsersWithPermissions(req, res) {
    try {
      const { page = 1, limit = 20, keyword, user_type } = req.query;

      let whereConditions = ['1=1'];
      let params = [];

      if (keyword) {
        whereConditions.push(`(u.username ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 2})`);
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      if (user_type) {
        whereConditions.push(`u.user_type = $${params.length + 1}`);
        params.push(user_type);
      }

      const query = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.user_type,
          u.status,
          u.created_at,
          COUNT(up.id) as permission_count
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id AND up.is_active = true
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY u.id, u.username, u.email, u.user_type, u.status, u.created_at
        ORDER BY u.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const offset = (page - 1) * limit;
      params.push(limit, offset);
      
      const result = await db.query(query, params);
      
      // 获取总数
      const countQuery = `
        SELECT COUNT(DISTINCT u.id) 
        FROM users u 
        WHERE ${whereConditions.join(' AND ')}
      `;
      const countResult = await db.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].count);

      res.json({
        code: 200,
        message: '获取用户权限概览成功',
        data: {
          users: result.rows,
          pagination: {
            current: parseInt(page),
            size: parseInt(limit),
            total
          }
        }
      });
    } catch (error) {
      console.error('获取用户权限概览失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取用户权限概览失败',
        error: error.message
      });
    }
  }
}

module.exports = new PermissionsController();