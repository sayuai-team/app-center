declare module 'app-info-parser' {
  interface AppInfo {
    CFBundleDisplayName?: string;
    CFBundleIdentifier?: string;
    CFBundleShortVersionString?: string;
    CFBundleVersion?: string;
    application?: {
      label?: string[];
    };
    package?: string;
    versionName?: string;
    versionCode?: string;
    icon?: Buffer;
    [key: string]: any;
  }

  class AppInfoParser {
    constructor(filePath: string);
    parse(): Promise<AppInfo>;
  }

  // CommonJS 导出
  export = AppInfoParser;
} 