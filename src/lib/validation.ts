const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;
const USERNAME_RESERVED = [
  "login", "register", "api", "admin", "settings", "dashboard",
  "blog", "post", "rss", "feed", "404", "_next", "favicon",
];

export function validateUsername(username: unknown): string {
  if (typeof username !== "string") return "用户名必须是字符串";
  if (username.length < 3 || username.length > 30) return "用户名长度需在3-30字符";
  if (!USERNAME_REGEX.test(username)) return "用户名只能包含小写字母、数字、下划线和连字符";
  if (USERNAME_RESERVED.includes(username)) return "该用户名为系统保留字";
  return "";
}

export function validateEmail(email: unknown): string {
  if (typeof email !== "string") return "邮箱必须是字符串";
  if (email.length < 5 || email.length > 255) return "邮箱长度需在5-255字符";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "邮箱格式不正确";
  return "";
}

export function validatePassword(password: unknown): string {
  if (typeof password !== "string") return "密码必须是字符串";
  if (password.length < 6 || password.length > 128) return "密码长度需在6-128字符";
  return "";
}

export function validateLength(
  value: unknown, label: string, min: number, max: number
): string {
  if (typeof value !== "string") return `${label}必须是字符串`;
  if (value.length < min) return `${label}不能少于${min}个字符`;
  if (value.length > max) return `${label}不能超过${max}个字符`;
  return "";
}

export function validateField(value: unknown, label: string, min: number, max: number): string {
  return validateLength(value, label, min, max);
}
