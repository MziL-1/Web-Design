import { prisma } from "@/lib/prisma";

const CODE_LENGTH = 6;
const CODE_EXPIRY_MS = 10 * 60 * 1000;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

async function sendViaSMTP(email: string, code: string) {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.qq.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "邮箱验证码 - Blog Platform",
    text: `您的验证码是：${code}，有效期 10 分钟。`,
  });
}

async function sendViaResend(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "邮箱验证码 - Blog Platform",
    text: `您的验证码是：${code}，有效期 10 分钟。`,
  });
  if (error) {
    console.error("Resend error:", error);
    return false;
  }
  return true;
}

export async function sendVerificationCode(email: string): Promise<{
  success: boolean;
  error?: string;
  code?: string;
}> {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, error: "该邮箱已注册" };
  }

  const code = generateCode();

  await prisma.emailVerification.deleteMany({ where: { email } });

  await prisma.emailVerification.create({
    data: {
      email,
      code,
      expiresAt: new Date(Date.now() + CODE_EXPIRY_MS),
    },
  });

  let sent = false;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await sendViaSMTP(email, code);
      sent = true;
    } catch (e) {
      console.error("SMTP send error:", e);
    }
  }

  if (!sent && process.env.RESEND_API_KEY) {
    try {
      sent = await sendViaResend(email, code);
    } catch (e) {
      console.error("Resend send error:", e);
    }
  }

  if (!sent) {
    console.log(`[DEV] 验证码 ${code} 已生成，邮箱: ${email}`);
  }

  if (!sent && (process.env.SMTP_USER || process.env.RESEND_API_KEY)) {
    return { success: false, error: "邮件发送失败，请稍后重试" };
  }

  return { success: true, ...(process.env.NODE_ENV !== "production" ? { code } : {}) };
}

export async function verifyCode(
  email: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const record = await prisma.emailVerification.findFirst({
    where: { email, code, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { valid: false, error: "验证码错误" };
  if (new Date() > record.expiresAt) return { valid: false, error: "验证码已过期" };

  await prisma.emailVerification.update({
    where: { id: record.id },
    data: { used: true },
  });

  return { valid: true };
}

export async function markCodeUsed(email: string, code: string) {
  await prisma.emailVerification.updateMany({
    where: { email, code },
    data: { used: true },
  });
}
