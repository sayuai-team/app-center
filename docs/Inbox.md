## 日志格式
```
[2025-05-30T15:18:20.613Z]-[traceid_xxx] GET - https://192.168.8.111:3000/api/v1/apps
[2025-05-30T15:18:20.614Z]-[traceid_xxx] [Request Headers] IP: 192.168.8.111; host: 192.168.8.111:8000; connection: keep-alive; sec-ch-ua-platform: "macOS"; user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0; sec-ch-ua: "Microsoft Edge";v="135", "Not-A.Brand";v="8", "Chromium";v="135"; sec-ch-ua-mobile: ?0; accept: */*; origin: https://192.168.8.111:3000; sec-fetch-site: same-site; sec-fetch-mode: cors; sec-fetch-dest: empty; referer: https://192.168.8.111:3000/; accept-encoding: gzip, deflate, br, zstd; accept-language: en-US,en;q=0.9,zh;q=0.8; if-none-match: W/"2e6d-Ny/kB5yzQODLLcFQCzsHrQu4XzE"
[2025-05-30T15:18:20.614Z]-[traceid_xxx] [Request Body] {"messageId": 100}
[2025-05-30T15:18:20.614Z]-[traceid_xxx] [Response Headers] IP: 192.168.8.111; host: 192.168.8.111:8000; connection: keep-alive; sec-ch-ua-platform: "macOS"; user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0; sec-ch-ua: "Microsoft Edge";v="135", "Not-A.Brand";v="8", "Chromium";v="135"; sec-ch-ua-mobile: ?0; accept: */*; origin: https://192.168.8.111:3000; sec-fetch-site: same-site; sec-fetch-mode: cors; sec-fetch-dest: empty; referer: https://192.168.8.111:3000/; accept-encoding: gzip, deflate, br, zstd; accept-language: en-US,en;q=0.9,zh;q=0.8; if-none-match: W/"2e6d-Ny/kB5yzQODLLcFQCzsHrQu4XzE"
[2025-05-30T15:18:20.614Z]-[traceid_xxx] [Response Body] {"code": 200, "message": "success", "data": [{"id": 1, "name": "App1", "description": "App1 description", "createdAt": "2025-05-30T15:18:20.614Z", "updatedAt": "2025-05-30T15:18:20.614Z"}]} 
```

## 响应报文结构
### 成功报文
```json
{
    "code": "0",
    "message": "Success",
    "data": {
        "name": "Hello"
    }
}
```

### 错误报文
```json
{
    "code": "AU0401",
    "message": "Token 过期，请重新登录",
    "data": {

    }
}
```