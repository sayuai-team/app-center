#!/bin/bash

# SSL证书生成脚本
# 用于为新的IP地址或域名生成SSL证书

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    App Center SSL 证书生成工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}用法: $0 <IP地址或域名> [证书名称]${NC}"
    echo -e "${YELLOW}示例: $0 192.168.1.100${NC}"
    echo -e "${YELLOW}示例: $0 mydomain.com my-cert${NC}"
    exit 1
fi

HOST="$1"
CERT_NAME="${2:-$HOST}"

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERTS_DIR="$PROJECT_ROOT/data/certs"
FRONTEND_PUBLIC_DIR="$PROJECT_ROOT/frontend/public"

echo -e "${BLUE}配置信息:${NC}"
echo -e "  主机名/IP: ${GREEN}$HOST${NC}"
echo -e "  证书名称: ${GREEN}$CERT_NAME${NC}"
echo -e "  证书目录: ${GREEN}$CERTS_DIR${NC}"
echo

# 确保证书目录存在
mkdir -p "$CERTS_DIR"
mkdir -p "$FRONTEND_PUBLIC_DIR"

# 创建临时配置文件
TEMP_CONF="$CERTS_DIR/temp-cert.conf"

cat > "$TEMP_CONF" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req
x509_extensions = v3_req

[dn]
C=CN
ST=Beijing
L=Beijing
O=App Center
OU=IT Department
CN=$HOST

[v3_req]
basicConstraints = CA:TRUE
keyUsage = keyCertSign, cRLSign, digitalSignature, keyEncipherment
subjectAltName = @alt_names
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = $HOST
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# 如果是IP地址，添加IP配置；如果是域名，添加DNS配置
if [[ $HOST =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "IP.3 = $HOST" >> "$TEMP_CONF"
else
    echo "DNS.4 = *.$HOST" >> "$TEMP_CONF"
fi

echo -e "${BLUE}生成SSL证书...${NC}"

# 生成私钥和证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERTS_DIR/${CERT_NAME}-key.pem" \
    -out "$CERTS_DIR/${CERT_NAME}.pem" \
    -config "$TEMP_CONF"

# 复制到前端public目录供下载
cp "$CERTS_DIR/${CERT_NAME}.pem" "$FRONTEND_PUBLIC_DIR/"

# 清理临时文件
rm "$TEMP_CONF"

echo -e "${GREEN}✅ 证书生成成功!${NC}"
echo
echo -e "${BLUE}生成的文件:${NC}"
echo -e "  私钥文件: ${GREEN}$CERTS_DIR/${CERT_NAME}-key.pem${NC}"
echo -e "  证书文件: ${GREEN}$CERTS_DIR/${CERT_NAME}.pem${NC}"
echo -e "  前端下载: ${GREEN}$FRONTEND_PUBLIC_DIR/${CERT_NAME}.pem${NC}"
echo

echo -e "${YELLOW}接下来需要更新配置文件:${NC}"
echo -e "  1. 更新 ${GREEN}backend/.env${NC} 中的证书路径:"
echo -e "     ${BLUE}SSL_KEY_PATH=../data/certs/${CERT_NAME}-key.pem${NC}"
echo -e "     ${BLUE}SSL_CERT_PATH=../data/certs/${CERT_NAME}.pem${NC}"
echo
echo -e "  2. 更新 ${GREEN}frontend/.env.local${NC} 中的API地址:"
echo -e "     ${BLUE}NEXT_PUBLIC_API_HOST=$HOST${NC}"
echo -e "     ${BLUE}NEXT_PUBLIC_FRONTEND_HOST=$HOST${NC}"
echo
echo -e "  3. 更新 ${GREEN}frontend/package.json${NC} 中的dev脚本证书路径"
echo
echo -e "${GREEN}配置完成后，重启服务即可使用新证书!${NC}" 