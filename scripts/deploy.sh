#!/bin/bash

# 石河子大学班级事务管理系统部署脚本
# 使用方法: ./scripts/deploy.sh [development|production]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 环境变量
ENVIRONMENT=${1:-development}
PROJECT_ROOT=$(pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DATABASE_DIR="$PROJECT_ROOT/database"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示欢迎信息
show_header() {
    echo -e "${BLUE}"
    echo "╭─────────────────────────────────────────────────────────────╮"
    echo "│                                                             │"
    echo "│           石河子大学班级事务管理系统部署脚本                │"
    echo "│                                                             │"
    echo "│  🎯 环境: $ENVIRONMENT"
    echo "│  📅 时间: $(date +'%Y-%m-%d %H:%M:%S')"
    echo "│  📂 路径: $PROJECT_ROOT"
    echo "│                                                             │"
    echo "╰─────────────────────────────────────────────────────────────╯"
    echo -e "${NC}"
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 16+ 版本"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Node.js 版本过低，需要 16+ 版本，当前版本: $(node -v)"
        exit 1
    fi
    log_success "Node.js 版本检查通过: $(node -v)"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    log_success "npm 版本检查通过: $(npm -v)"
    
    # 检查 PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_warning "PostgreSQL 命令行工具未找到，请确保已安装 PostgreSQL"
    else
        log_success "PostgreSQL 命令行工具已安装"
    fi
    
    # 检查 Git
    if ! command -v git &> /dev/null; then
        log_warning "Git 未安装，某些功能可能无法正常使用"
    else
        log_success "Git 已安装: $(git --version)"
    fi
}

# 数据库初始化
init_database() {
    log_info "初始化数据库..."
    
    # 读取数据库配置
    if [ -f "$BACKEND_DIR/.env" ]; then
        source "$BACKEND_DIR/.env"
    else
        log_error "未找到后端环境配置文件: $BACKEND_DIR/.env"
        log_info "请先复制并配置 .env.example 文件"
        exit 1
    fi
    
    if [ -z "$DB_NAME" ]; then
        log_error "数据库名称未配置，请检查 .env 文件中的 DB_NAME"
        exit 1
    fi
    
    # 检查数据库是否存在
    if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        log_warning "数据库 '$DB_NAME' 已存在"
        read -p "是否重新初始化数据库？这将删除所有现有数据 (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "删除现有数据库..."
            dropdb "$DB_NAME" 2>/dev/null || true
        else
            log_info "跳过数据库初始化"
            return 0
        fi
    fi
    
    # 创建数据库
    log_info "创建数据库: $DB_NAME"
    createdb "$DB_NAME" || {
        log_error "创建数据库失败"
        exit 1
    }
    
    # 执行数据库脚本
    log_info "执行数据库结构脚本..."
    psql -d "$DB_NAME" -f "$DATABASE_DIR/schema/01_create_tables.sql" || {
        log_error "执行表结构脚本失败"
        exit 1
    }
    
    log_info "创建索引..."
    psql -d "$DB_NAME" -f "$DATABASE_DIR/indexes/02_create_indexes.sql" || {
        log_error "创建索引失败"
        exit 1
    }
    
    log_info "创建视图..."
    psql -d "$DB_NAME" -f "$DATABASE_DIR/schema/03_create_views.sql" || {
        log_error "创建视图失败"
        exit 1
    }
    
    log_info "创建存储过程..."
    psql -d "$DB_NAME" -f "$DATABASE_DIR/procedures/04_stored_procedures.sql" || {
        log_error "创建存储过程失败"
        exit 1
    }
    
    log_info "创建触发器..."
    psql -d "$DB_NAME" -f "$DATABASE_DIR/triggers/05_create_triggers.sql" || {
        log_error "创建触发器失败"
        exit 1
    }
    
    log_info "插入测试数据..."
    psql -d "$DB_NAME" -f "$DATABASE_DIR/data/06_insert_test_data.sql" || {
        log_warning "插入测试数据失败，可能是数据已存在"
    }
    
    log_success "数据库初始化完成"
}

# 安装后端依赖
install_backend() {
    log_info "安装后端依赖..."
    
    cd "$BACKEND_DIR"
    
    # 检查 package.json
    if [ ! -f "package.json" ]; then
        log_error "未找到后端 package.json 文件"
        exit 1
    fi
    
    # 安装依赖
    npm install || {
        log_error "后端依赖安装失败"
        exit 1
    }
    
    # 检查环境配置文件
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log_info "复制环境配置文件..."
            cp ".env.example" ".env"
            log_warning "请编辑 .env 文件配置数据库连接信息"
        else
            log_error "未找到环境配置模板文件"
            exit 1
        fi
    fi
    
    log_success "后端依赖安装完成"
    cd "$PROJECT_ROOT"
}

# 安装前端依赖
install_frontend() {
    log_info "安装前端依赖..."
    
    cd "$FRONTEND_DIR"
    
    # 检查 package.json
    if [ ! -f "package.json" ]; then
        log_error "未找到前端 package.json 文件"
        exit 1
    fi
    
    # 安装依赖
    npm install || {
        log_error "前端依赖安装失败"
        exit 1
    }
    
    log_success "前端依赖安装完成"
    cd "$PROJECT_ROOT"
}

# 构建前端
build_frontend() {
    if [ "$ENVIRONMENT" == "production" ]; then
        log_info "构建前端生产版本..."
        cd "$FRONTEND_DIR"
        npm run build:prod || {
            log_error "前端构建失败"
            exit 1
        }
        log_success "前端构建完成"
        cd "$PROJECT_ROOT"
    else
        log_info "开发环境跳过前端构建"
    fi
}

# 启动服务
start_services() {
    if [ "$ENVIRONMENT" == "development" ]; then
        log_info "启动开发服务器..."
        
        # 启动后端
        log_info "启动后端服务..."
        cd "$BACKEND_DIR"
        npm run dev &
        BACKEND_PID=$!
        
        # 等待后端启动
        sleep 3
        
        # 启动前端
        log_info "启动前端服务..."
        cd "$FRONTEND_DIR"
        npm run dev &
        FRONTEND_PID=$!
        
        # 显示访问信息
        echo -e "${GREEN}"
        echo "╭─────────────────────────────────────────────────────────────╮"
        echo "│                      🚀 服务启动成功！                      │"
        echo "│                                                             │"
        echo "│  📱 前端地址:  http://localhost:8080                        │"
        echo "│  🔧 后端API:   http://localhost:3000                        │"
        echo "│  📚 API文档:   http://localhost:3000/api                    │"
        echo "│  💾 数据库:    $DB_NAME                                    │"
        echo "│                                                             │"
        echo "│  按 Ctrl+C 停止服务                                        │"
        echo "╰─────────────────────────────────────────────────────────────╯"
        echo -e "${NC}"
        
        # 等待用户中断
        wait
        
    else
        log_info "生产环境部署完成"
        log_info "请配置 Nginx 或其他 Web 服务器来部署前端静态文件"
        log_info "前端构建文件位置: $FRONTEND_DIR/dist"
        log_info "后端启动命令: cd $BACKEND_DIR && npm start"
    fi
}

# 测试数据库连接
test_database() {
    log_info "测试数据库连接..."
    
    cd "$BACKEND_DIR"
    
    # 运行数据库连接测试
    node -e "
    require('dotenv').config();
    const { Pool } = require('pg');
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });
    
    pool.query('SELECT NOW()', (err, result) => {
        if (err) {
            console.error('❌ 数据库连接失败:', err.message);
            process.exit(1);
        } else {
            console.log('✅ 数据库连接成功');
            console.log('⏰ 数据库时间:', result.rows[0].now);
            pool.end();
        }
    });
    " || {
        log_error "数据库连接测试失败"
        exit 1
    }
    
    cd "$PROJECT_ROOT"
}

# 生成启动脚本
generate_scripts() {
    log_info "生成启动脚本..."
    
    # 生成开发环境启动脚本
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "启动石河子大学班级事务管理系统 - 开发模式"

# 启动后端
echo "启动后端服务..."
cd backend
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端
echo "启动前端服务..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "服务启动完成!"
echo "前端地址: http://localhost:8080"
echo "后端API: http://localhost:3000"
echo "按 Ctrl+C 停止服务"

# 等待中断信号
wait
EOF

    # 生成生产环境启动脚本
    cat > start-prod.sh << 'EOF'
#!/bin/bash
echo "启动石河子大学班级事务管理系统 - 生产模式"

# 构建前端
echo "构建前端..."
cd frontend
npm run build:prod

# 启动后端
echo "启动后端服务..."
cd ../backend
npm start
EOF

    chmod +x start-dev.sh start-prod.sh
    
    log_success "启动脚本生成完成"
    log_info "开发环境: ./start-dev.sh"
    log_info "生产环境: ./start-prod.sh"
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    # 杀死后台进程
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
}

# 信号处理
trap cleanup EXIT INT TERM

# 主程序
main() {
    show_header
    
    log_info "开始部署流程..."
    
    check_requirements
    install_backend
    install_frontend
    
    # 只在开发环境或用户确认时初始化数据库
    if [ "$ENVIRONMENT" == "development" ] || [ "$ENVIRONMENT" == "init" ]; then
        init_database
        test_database
    fi
    
    build_frontend
    generate_scripts
    
    if [ "$ENVIRONMENT" == "development" ]; then
        start_services
    else
        log_success "部署完成!"
        log_info "生产环境请参考 README.md 中的部署说明"
    fi
}

# 帮助信息
show_help() {
    echo "石河子大学班级事务管理系统部署脚本"
    echo
    echo "使用方法:"
    echo "  $0 [ENVIRONMENT]"
    echo
    echo "环境选项:"
    echo "  development  开发环境 (默认)"
    echo "  production   生产环境"
    echo "  init         仅初始化数据库"
    echo "  help         显示帮助信息"
    echo
    echo "示例:"
    echo "  $0                    # 开发环境部署"
    echo "  $0 development        # 开发环境部署"
    echo "  $0 production         # 生产环境部署"
    echo "  $0 init               # 仅初始化数据库"
}

# 参数处理
case "$ENVIRONMENT" in
    "help"|"-h"|"--help")
        show_help
        exit 0
        ;;
    "development"|"production"|"init")
        main
        ;;
    *)
        log_error "未知环境: $ENVIRONMENT"
        show_help
        exit 1
        ;;
esac