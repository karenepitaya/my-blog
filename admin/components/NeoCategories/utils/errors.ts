export function toFriendlyNeoError(input: unknown): string {
  const raw = input instanceof Error ? input.message : String(input ?? '');
  const message = raw.trim() || '未知错误';

  const match = /^([A-Z0-9_]+):\s*(.*)$/.exec(message);
  const code = match?.[1];
  const detail = (match?.[2] ?? message).trim();

  switch (code) {
    case 'NOT_AUTHENTICATED':
    case 'NO_TOKEN':
    case 'INVALID_TOKEN':
      return '登录状态已失效，请重新登录';
    case 'FORBIDDEN':
    case 'ADMIN_REQUIRED':
    case 'AUTHOR_REQUIRED':
      return '权限不足，无法执行该操作';
    case 'CATEGORY_NOT_FOUND':
      return '专栏不存在或已被删除';
    case 'CATEGORY_NOT_ACTIVE':
      return '专栏当前不可编辑（非正常状态）';
    case 'NOT_PENDING_DELETE':
      return '该专栏不在回收站状态';
    case 'ADMIN_DELETE_REQUIRES_REVIEW':
      return '该专栏由管理员删除，作者无法恢复，请联系管理员';
    case 'DUPLICATE_NAME':
      return '专栏名称已存在，请换一个';
    case 'DUPLICATE_SLUG':
      return 'Slug 已存在，请换一个';
    case 'FILE_TOO_LARGE':
      return '图片太大了，请换一张更小的（或稍后会自动压缩）';
    case 'UNSUPPORTED_FILE_TYPE':
      return '不支持的文件类型，请上传图片文件';
    case 'PURPOSE_MISMATCH':
      return '上传用途与文件类型不匹配';
    case 'UPLOAD_ERROR':
      return '上传失败，请稍后重试';
    default:
      return detail || message;
  }
}

