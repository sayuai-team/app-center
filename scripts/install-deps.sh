#!/bin/sh

# App Center 依赖安装脚本
# 安装所有依赖并构建共享类型包

set -e  # 遇到错误时退出

# 兼容性函数：跨平台的彩色输出
print_color() {
    case $1 in
        red) printf "\033[0;31m%s\033[0m\n" "$2" ;;
        green) printf "\033[0;32m%s\033[0m\n" "$2" ;;
        yellow) printf "\033[1;33m%s\033[0m\n" "$2" ;;
        blue) printf "\033[0;34m%s\033[0m\n" "$2" ;;
        *) printf "%s\n" "$2" ;;
    esac
}

echo "📦 开始安装 App Center 项目依赖..."
echo ""

# 确认在项目根目录
if [ ! -f "package.json" ] || [ ! -f "pnpm-workspace.yaml" ]; then
    print_color red "❌ 请在项目根目录下运行此脚本"
    exit 1
fi

print_color blue "📁 当前目录：$(pwd)"
echo ""

# 安装所有依赖
echo "📥 安装项目依赖（根目录、前端、后端）..."
if pnpm install; then
    print_color green "✅ 依赖安装成功"
else
    print_color red "❌ 依赖安装失败"
    echo "可能的解决方案："
    echo "1. 检查网络连接"
    echo "2. 清理缓存：pnpm store prune"
    echo "3. 删除 node_modules 重试：rm -rf node_modules && pnpm install"
    exit 1
fi

echo ""

# 构建共享类型包
echo "🔨 构建共享类型包..."
if pnpm run build:shared; then
    print_color green "✅ 共享类型包构建成功"
else
    print_color red "❌ 共享类型包构建失败"
    echo "请检查 shared/ 目录下的代码是否有语法错误"
    exit 1
fi

echo ""

# 检查安装结果
echo "🔍 验证安装结果..."

# 检查关键依赖目录
key_dirs="node_modules frontend/node_modules backend/node_modules shared/dist"
missing_dirs=""

for dir in $key_dirs; do
    if [ ! -d "$dir" ]; then
        missing_dirs="$missing_dirs $dir"
    fi
done

if [ -n "$missing_dirs" ]; then
    print_color yellow "⚠️  以下目录缺失:"
    for dir in $missing_dirs; do
        echo "  - $dir"
    done
else
    print_color green "✅ 安装验证通过"
fi

echo ""
print_color green "🎉 依赖安装完成！"
echo ""
echo "下一步可以："
print_color yellow "1. 初始化数据库：pnpm run init-db"
print_color yellow "2. 启动开发服务：pnpm run dev"
print_color yellow "3. 构建生产版本：pnpm run build" 