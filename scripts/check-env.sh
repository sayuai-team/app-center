#!/bin/sh

# App Center 环境检查脚本
# 检查并安装运行 App Center 所需的环境依赖

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

echo "🔍 开始检查 App Center 运行环境..."
echo ""

# 检查 Node.js
echo "📦 检查 Node.js..."
if ! command -v node >/dev/null 2>&1; then
    print_color red "❌ Node.js 未安装"
    echo "请先安装 Node.js >= 18.0.0"
    echo "推荐使用 nvm 安装: https://github.com/nvm-sh/nvm"
    echo ""
    echo "安装命令："
    echo "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "nvm install 18"
    echo "nvm use 18"
    exit 1
fi

# 获取 Node.js 版本
node_version=$(node --version | cut -d'v' -f2)
major_version=$(echo $node_version | cut -d'.' -f1)

print_color green "当前 Node.js 版本: v$node_version"

# 检查版本是否符合要求
if [ "$major_version" -lt 18 ]; then
    print_color red "❌ Node.js 版本过低，要求 >= 18.0.0"
    echo "请升级 Node.js 版本"
    exit 1
else
    print_color green "✅ Node.js 版本符合要求"
fi

echo ""

# 检查 pnpm
echo "📦 检查 pnpm..."
if ! command -v pnpm >/dev/null 2>&1; then
    print_color yellow "⚠️  pnpm 未安装，正在自动安装..."
    
    # 尝试安装 pnpm
    if npm install -g pnpm; then
        print_color green "✅ pnpm 安装成功"
    else
        print_color red "❌ pnpm 安装失败"
        echo "请尝试手动安装："
        echo "sudo npm install -g pnpm"
        echo "或者："
        echo "npm install -g pnpm --registry https://registry.npmmirror.com"
        exit 1
    fi
else
    pnpm_version=$(pnpm --version)
    print_color green "当前 pnpm 版本: v$pnpm_version"
    print_color green "✅ pnpm 已安装"
fi

echo ""

# 检查项目结构
echo "📁 检查项目结构..."
required_dirs="frontend backend shared"
missing_dirs=""

for dir in $required_dirs; do
    if [ ! -d "$dir" ]; then
        missing_dirs="$missing_dirs $dir"
    fi
done

if [ -n "$missing_dirs" ]; then
    print_color red "❌ 缺少必要的项目目录:"
    for dir in $missing_dirs; do
        echo "  - $dir"
    done
    echo "请确保在正确的项目根目录下运行此脚本"
    exit 1
else
    print_color green "✅ 项目结构完整"
fi

echo ""

# 检查必要的配置文件
echo "📄 检查配置文件..."
config_files="package.json pnpm-workspace.yaml"
missing_files=""

for file in $config_files; do
    if [ ! -f "$file" ]; then
        missing_files="$missing_files $file"
    fi
done

if [ -n "$missing_files" ]; then
    print_color yellow "⚠️  缺少配置文件:"
    for file in $missing_files; do
        echo "  - $file"
    done
else
    print_color green "✅ 配置文件完整"
fi

echo ""
print_color green "🎉 环境检查完成！可以继续安装依赖。"
echo ""
echo "下一步请运行："
print_color yellow "sh shell/install-deps.sh" 