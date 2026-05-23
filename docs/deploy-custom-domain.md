# 国内网络访问 Vercel 部署站点指南

## 背景

Vercel 默认域名 `*.vercel.app` 在中国大陆被 DNS 污染/封锁。  
**Vercel 服务器本身在国内可访问**，只需换一个自购域名指向它即可。

---

## 第一步：购买域名

推荐以下任一平台（支持支付宝/微信支付）：

| 平台 | 网址 | 价格 |
|------|------|------|
| 阿里云（万网） | https://wanwang.aliyun.com | ¥30-60/年 |
| 腾讯云（DNSPod） | https://dnspod.cloud.tencent.com | ¥30-60/年 |

常用后缀：`.com` `.cn` `.xyz` `.top`。`.cn` 最便宜但需要额外审核。

---

## 第二步：域名实名认证

中国法律要求域名必须实名认证。购买后：

1. 登录域名控制台
2. 找到你买的域名 → **实名认证**
3. 上传身份证正面照（个人）
4. 等待审核（通常 1-2 个工作日）

---

## 第三步：Vercel 添加自定义域名

1. 打开 https://vercel.com/dashboard
2. 选择项目 `web-design-two-phi`
3. **Settings** → **Domains**
4. 输入你的域名（如 `myblog.com` 或 `www.myblog.com`）
5. 点 **Add**
6. Vercel 会提示你添加 **DNS 记录**

---

## 第四步：配置 DNS 解析

回到域名控制台，添加 DNS 记录：

### 如果要访问 `www.你的域名.com`

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| CNAME | `www` | `cname.vercel-dns.com` |

### 如果要访问 `你的域名.com`（裸域）

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| A | `@` | `76.76.21.21` |

Vercel 会检测 DNS 是否生效，自动签发免费 SSL 证书（约 2-3 分钟）。

---

## 第五步：更新平台环境变量

Vercel → 项目 `web-design-two-phi` → **Settings** → **Environment Variables**：

| Key | 旧值 | 新值 |
|-----|------|------|
| `NEXTAUTH_URL` | `https://web-design-two-phi.vercel.app` | `https://你的域名.com` |

Save → **Redeploy**.

---

## 第六步：更新模板环境变量（如有部署）

如果你已经部署了模板仓库，到 Vercel 里找到模板项目，同样更新：

| Key | 新值 |
|-----|------|
| `NEXT_PUBLIC_BLOG_API_URL` | `https://你的域名.com` |

---

## 验证

部署完成后：

```bash
# 确认 HTTPS 可用
curl -I https://你的域名.com

# 确认返回 200
curl -o /dev/null -w "%{http_code}" https://你的域名.com
```

---

## 常见问题

**Q: DNS 改了多久生效？**  
A: 通常 2-5 分钟，最长 24 小时。

**Q: 裸域（不带 www）和带 www 区别？**  
A: 建议两个都配。Vercel 会自动把裸域重定向到带 www 的域名。

**Q: 需要备案吗？**  
A: .com / .cn 等域名如果使用境外服务器（Vercel 在美国），不需要 ICP 备案。如果用国内服务器才需要。

**Q: Vercel 需要付费吗？**  
A: 自定义域名在 Hobby 免费计划中已支持。
