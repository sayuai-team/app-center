export default function InstallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <title>App Center 安装向导</title>
        <meta name="description" content="App Center 安装向导" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
} 