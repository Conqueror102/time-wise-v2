/**
 * Email Service using Nodemailer
 * Handles OTP and transactional emails
 */

import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

const APP_NAME = "TimeWise"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@timewise.com"

// Colors
const COLORS = {
  primary: "#1d4ed8", // Blue 700
  background: "#eff6ff", // Blue 50
  accent: "#FCD34D", // Amber
  text: "#1f2937",
  textMuted: "#4b5563",
  white: "#ffffff",
}

// Create reusable transporter
function createTransporter(): Transporter | null {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("[Email] Missing SMTP configuration:", {
      hasHost: !!process.env.SMTP_HOST,
      hasUser: !!process.env.SMTP_USER,
      hasPass: !!process.env.SMTP_PASS,
    })
    return null
  }

  try {
    // For Gmail, use explicit configuration with port 587 (TLS)
    if (process.env.SMTP_HOST === "smtp.gmail.com") {
      return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use TLS
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: true,
        },
      })
    }

    // For other SMTP providers
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } catch (error) {
    console.error("[Email] Failed to create transporter:", error)
    return null
  }
}

export interface SendOTPEmailParams {
  to: string
  otp: string
  firstName: string
  expiresInMinutes?: number
}

export interface SendPasswordResetEmailParams {
  to: string
  resetToken: string
  firstName: string
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail({
  to,
  otp,
  firstName,
  expiresInMinutes = 10,
}: SendOTPEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.error("[Email] Transporter creation failed")
      return { success: false, error: "Email service not configured" }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${COLORS.text}; max-width: 600px; margin: 0 auto; padding: 20px; background-color: ${COLORS.background};">
          <div style="background-color: ${COLORS.primary}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: ${COLORS.white}; margin: 0; font-size: 28px;">${APP_NAME}</h1>
          </div>
          
          <div style="background: ${COLORS.white}; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            <h2 style="color: ${COLORS.primary}; margin-top: 0;">Hi ${firstName}! 👋</h2>
            
            <p style="font-size: 16px; color: ${COLORS.textMuted};">
              Thank you for registering with ${APP_NAME}. To complete your registration, please verify your email address using the code below:
            </p>
            
            <div style="background: ${COLORS.background}; border: 2px dashed ${COLORS.primary}; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="margin: 0 0 10px 0; color: ${COLORS.textMuted}; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
              <p style="font-size: 36px; font-weight: bold; color: ${COLORS.primary}; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
            </div>
            
            <p style="font-size: 14px; color: ${COLORS.textMuted}; margin: 20px 0;">
              This code will expire in <strong>${expiresInMinutes} minutes</strong>.
            </p>
            
            <p style="font-size: 14px; color: ${COLORS.textMuted};">
              If you didn't request this verification, please ignore this email or contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: ${COLORS.textMuted}; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
              This is an automated email, please do not reply.
            </p>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `${APP_NAME} - Verify Your Email`,
      html: htmlContent,
    })

    console.log("[Email] OTP sent successfully to:", to)
    return { success: true }
  } catch (error: any) {
    console.error("[Email] Failed to send OTP email:", {
      message: error?.message,
      code: error?.code,
      response: error?.response,
      responseCode: error?.responseCode,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  to,
  resetToken,
  firstName,
}: SendPasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.error("[Email] Transporter creation failed")
      return { success: false, error: "Email service not configured" }
    }

    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `${APP_NAME} - Reset Your Password`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${COLORS.text}; max-width: 600px; margin: 0 auto; padding: 20px; background-color: ${COLORS.background};">
            <div style="background-color: ${COLORS.primary}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: ${COLORS.white}; margin: 0; font-size: 28px;">${APP_NAME}</h1>
            </div>
            
            <div style="background: ${COLORS.white}; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
              <h2 style="color: ${COLORS.primary}; margin-top: 0;">Hi ${firstName},</h2>
              
              <p style="font-size: 16px; color: ${COLORS.textMuted};">
                We received a request to reset your password for your ${APP_NAME} account.
              </p>
              
              <p style="font-size: 16px; color: ${COLORS.textMuted};">
                Click the button below to reset your password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background-color: ${COLORS.accent}; color: ${COLORS.text}; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
              </div>
              
              <p style="font-size: 14px; color: ${COLORS.textMuted};">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="font-size: 14px; color: ${COLORS.primary}; word-break: break-all; background: ${COLORS.background}; padding: 12px; border-radius: 6px;">
                ${resetUrl}
              </p>
              
              <p style="font-size: 14px; color: ${COLORS.textMuted}; margin-top: 20px;">
                This link will expire in <strong>1 hour</strong> for security reasons.
              </p>
              
              <p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 12px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 20px 0;">
                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: ${COLORS.textMuted}; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
                This is an automated email, please do not reply.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    console.log("[Email] Password reset email sent successfully to:", to)
    return { success: true }
  } catch (error: any) {
    console.error("[Email] Failed to send password reset email:", {
      message: error?.message,
      code: error?.code,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

/**
 * Generic send email function for custom emails
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.error("[Email] Transporter creation failed")
      return { success: false, error: "Email service not configured" }
    }

    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    console.log("[Email] Email sent successfully to:", to)
    return { success: true }
  } catch (error: any) {
    console.error("[Email] Failed to send email:", {
      message: error?.message,
      code: error?.code,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  organizationName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.error("[Email] Transporter creation failed")
      return { success: false, error: "Email service not configured" }
    }

    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to ${APP_NAME}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to ${APP_NAME}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${COLORS.text}; max-width: 600px; margin: 0 auto; padding: 20px; background-color: ${COLORS.background};">
            <div style="background-color: ${COLORS.primary}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: ${COLORS.white}; margin: 0; font-size: 28px;">${APP_NAME}</h1>
            </div>
            
            <div style="background: ${COLORS.white}; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
              <h2 style="color: ${COLORS.primary}; margin-top: 0;">Welcome aboard, ${firstName}! 🎉</h2>
              
              <p style="font-size: 16px; color: ${COLORS.textMuted};">
                Your email has been verified and your organization <strong>${organizationName}</strong> is now active!
              </p>
              
              <p style="font-size: 16px; color: ${COLORS.textMuted};">
                You're all set to start managing your staff attendance with ${APP_NAME}.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: ${COLORS.accent}; color: ${COLORS.text}; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: ${COLORS.textMuted}; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    console.log("[Email] Welcome email sent successfully to:", to)
    return { success: true }
  } catch (error: any) {
    console.error("[Email] Failed to send welcome email:", {
      message: error?.message,
      code: error?.code,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

/**
 * Test email connection
 */
export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      return { success: false, error: "Transporter not created - check environment variables" }
    }
    
    await transporter.verify()
    console.log("✅ Email server connection successful!")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Email connection failed:", error.message)
    return { success: false, error: error.message }
  }
}