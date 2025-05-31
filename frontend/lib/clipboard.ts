/**
 * 复制文本到剪贴板的兼容性函数
 * 支持现代浏览器和较老的浏览器
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 首先尝试使用现代的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // 降级到使用 document.execCommand (已废弃但兼容性好)
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * 带有用户反馈的复制函数
 */
export async function copyWithFeedback(
  text: string, 
  onSuccess?: (text: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  const success = await copyToClipboard(text);
  
  if (success) {
    onSuccess?.(text);
  } else {
    onError?.('复制失败，请手动复制');
  }
} 