#!/bin/bash

# ========================================
# App Center 快速启动脚本
# ========================================

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装后再运行此脚本"
        exit 1
    fi
}

# 检查 Node.js 版本
check_node_version() {
    local node_version=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js 版本过低，需要 >= 18.0.0，当前版本: $(node -v)"
        exit 1
    fi
    log_success "Node.js 版本检查通过: $(node -v)"
}

# 显示欢迎信息
show_welcome() {
    echo ""
    echo "=================================="
    echo "🚀 App Center 快速启动脚本"
    echo "=================================="
    echo ""
    echo "此脚本将帮助您快速部署 App Center："
    echo "1. 检查系统环境"
    echo "2. 安装项目依赖"
    echo "3. 配置环境变量"
    echo "4. 初始化数据库"
    echo "5. 构建并启动服务"
    echo ""
}

# 环境检查
check_environment() {
    log_info "正在检查系统环境..."
    
    # 检查必要的命令
    check_command "node"
    check_command "pnpm"
    check_command "git"
    
    # 检查 Node.js 版本
    check_node_version
    
    # 检查磁盘空间 (至少需要 5GB)
    local available_space=$(df . | tail -1 | awk '{print $4}')
    local required_space=$((5 * 1024 * 1024))  # 5GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        log_warning "磁盘可用空间可能不足 5GB，当前可用: $(df -h . | tail -1 | awk '{print $4}')"
    else
        log_success "磁盘空间检查通过"
    fi
    
    log_success "环境检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "正在安装项目依赖..."
    
    # 安装根目录依赖
    pnpm install
    
    # 构建共享模块
    log_info "构建共享类型包..."
    pnpm run build:shared
    
    log_success "依赖安装完成"
}

# 配置环境
setup_environment() {
    log_info "正在配置环境变量..."
    
    # 检查后端环境文件 (现在env文件直接包含在项目中)
    if [ -f "backend/.env" ]; then
        log_success "后端环境配置文件已就绪"
    else
        log_error "后端环境配置文件不存在，请确保已克隆完整项目"
        exit 1
    fi
    
    # 创建必要的目录
    mkdir -p backend/data
    mkdir -p backend/uploads
    mkdir -p backend/logs
    mkdir -p frontend/logs
    
    log_success "环境配置完成"
}

# 初始化数据库
init_database() {
    log_info "正在初始化数据库..."
    
    cd backend
    
    # 检查数据库是否已存在
    if [ -f "data/database.sqlite" ]; then
        read -p "数据库文件已存在，是否要重新初始化？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "重新初始化数据库..."
            pnpm run init-db:force
        else
            log_info "跳过数据库初始化"
        fi
    else
        pnpm run init-db
    fi
    
    cd ..
    log_success "数据库初始化完成"
}

# 构建项目
build_project() {
    log_info "正在构建项目..."
    
    # 设置生产环境变量
    export NODE_ENV=production
    
    # 构建项目
    pnpm run build
    
    log_success "项目构建完成"
}

# 启动服务
start_services() {
    log_info "正在启动服务..."
    
    # 检查端口是否被占用
    check_port_availability() {
        local port=$1
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 1
        else
            return 0
        fi
    }
    
    # 检查端口 3000 和 8000
    if ! check_port_availability 3000; then
        log_error "端口 3000 已被占用，请释放端口后重试"
        exit 1
    fi
    
    if ! check_port_availability 8000; then
        log_error "端口 8000 已被占用，请释放端口后重试"
        exit 1
    fi
    
    # 检查是否安装了 PM2
    if command -v pm2 &> /dev/null; then
        log_info "使用 PM2 启动服务..."
        pm2 start ecosystem.config.js
        log_success "服务已使用 PM2 启动"
    else
        log_warning "PM2 未安装，使用直接启动方式"
        log_info "启动服务 (后台运行)..."
        
        # 后台启动服务
        nohup pnpm run start:backend > backend/logs/backend.log 2>&1 &
        echo $! > backend/backend.pid
        
        nohup pnpm run start:frontend > frontend/logs/frontend.log 2>&1 &
        echo $! > frontend/frontend.pid
        
        log_success "服务已启动"
    fi
}

# 验证部署
verify_deployment() {
    log_info "正在验证部署..."
    
    # 等待服务启动
    sleep 5
    
    # 检查后端健康状态
    local backend_health_attempts=0
    while [ $backend_health_attempts -lt 10 ]; do
        if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
            log_success "后端服务运行正常"
            break
        else
            log_info "等待后端服务启动... ($((backend_health_attempts + 1))/10)"
            sleep 2
            backend_health_attempts=$((backend_health_attempts + 1))
        fi
    done
    
    if [ $backend_health_attempts -eq 10 ]; then
        log_error "后端服务启动失败，请检查日志"
        return 1
    fi
    
    # 检查前端服务
    local frontend_health_attempts=0
    while [ $frontend_health_attempts -lt 10 ]; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            log_success "前端服务运行正常"
            break
        else
            log_info "等待前端服务启动... ($((frontend_health_attempts + 1))/10)"
            sleep 2
            frontend_health_attempts=$((frontend_health_attempts + 1))
        fi
    done
    
    if [ $frontend_health_attempts -eq 10 ]; then
        log_error "前端服务启动失败，请检查日志"
        return 1
    fi
    
    log_success "部署验证完成"
}

# 显示完成信息
show_completion() {
    echo ""
    echo "=================================="
    echo "🎉 App Center 部署完成！"
    echo "=================================="
    echo ""
    echo "📱 访问地址："
    echo "  • 主页: http://localhost:3000"
    echo "  • 安装向导: http://localhost:3000/install"
    echo "  • 管理后台: http://localhost:3000/dashboard"
    echo ""
    echo "🔑 默认管理员账户："
    echo "  • 用户名: admin"
    echo "  • 密码: Psw#123456"
    echo "  • ⚠️  首次登录后请立即修改密码！"
    echo ""
    echo "📊 服务状态:"
    if command -v pm2 &> /dev/null; then
        echo "  • 使用 PM2 管理，运行 'pm2 status' 查看状态"
        echo "  • 停止服务: pm2 stop all"
        echo "  • 重启服务: pm2 restart all"
    else
        echo "  • 后端 PID: $(cat backend/backend.pid 2>/dev/null || echo "未知")"
        echo "  • 前端 PID: $(cat frontend/frontend.pid 2>/dev/null || echo "未知")"
        echo "  • 停止服务: kill \$(cat backend/backend.pid) \$(cat frontend/frontend.pid)"
    fi
    echo ""
    echo "📖 更多信息："
    echo "  • 部署检查清单: DEPLOYMENT_CHECKLIST.md"
    echo "  • 详细文档: docs/Install.md"
    echo ""
}

# 错误处理
handle_error() {
    log_error "部署过程中出现错误，请检查上述错误信息"
    echo ""
    echo "🔧 故障排除建议："
    echo "  1. 检查系统环境是否满足要求"
    echo "  2. 确保所有依赖已正确安装"
    echo "  3. 检查端口是否被占用"
    echo "  4. 查看日志文件获取详细错误信息"
    echo ""
    exit 1
}

# 主函数
main() {
    # 设置错误处理
    trap handle_error ERR
    
    # 执行部署流程
    show_welcome
    check_environment
    install_dependencies
    setup_environment
    init_database
    build_project
    start_services
    verify_deployment
    show_completion
}

# 如果是直接运行脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 