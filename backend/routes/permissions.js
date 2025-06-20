const express = require('express');
const router = express.Router();
const permissionsController = require('../controllers/permissionsController');
// const { authMiddleware } = require('../middleware/auth');

// 权限管理路由

// 获取所有权限列表
router.get('/', permissionsController.getAllPermissions);

// 获取权限分类列表
router.get('/categories', permissionsController.getPermissionCategories);

// 创建新权限
router.post('/', permissionsController.createPermission);

// 更新权限
router.put('/:id', permissionsController.updatePermission);

// 删除权限
router.delete('/:id', permissionsController.deletePermission);

// 用户权限管理路由

// 获取所有用户及其权限概览
router.get('/users', permissionsController.getUsersWithPermissions);

// 获取指定用户的权限列表
router.get('/users/:userId', permissionsController.getUserPermissions);

// 为用户分配单个权限
router.post('/users/:userId/permissions/:permissionId', permissionsController.assignPermissionToUser);

// 批量为用户分配权限
router.post('/users/:userId/permissions', permissionsController.batchAssignPermissions);

// 撤销用户权限
router.delete('/users/:userId/permissions/:permissionId', permissionsController.revokePermissionFromUser);

// 更新用户权限状态（激活/禁用、设置过期时间）
router.put('/user-permissions/:id', permissionsController.updateUserPermissionStatus);

module.exports = router;