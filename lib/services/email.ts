/**
 * Email Service using Resend SDK
 * Handles OTP and transactional emails
 */

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "TimeWise <onboarding@resend.dev>"
const APP_NAME = "TimeWise"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

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
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${APP_NAME} - Verify Your Email`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName}! 👋</h2>
              
              <p style="font-size: 16px; color: #4b5563;">
                Thank you for registering with ${APP_NAME}. To complete your registration, please verify your email address using the code below:
              </p>
              
              <div style="background: #f3f4f6; border: 2px dashed #9ca3af; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <p style="font-size: 36px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin: 20px 0;">
                This code will expire in <strong>${expiresInMinutes} minutes</strong>.
              </p>
              
              <p style="font-size: 14px; color: #6b7280;">
                If you didn't request this verification, please ignore this email or contact our support team.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
                This is an automated email, please do not reply.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("Resend email error:", error)
      return { success: false, error: error.message }
    }

    console.log("OTP email sent successfully:", data?.id)
    return { success: true }
  } catch (error) {
    console.error("Failed to send OTP email:", error)
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
    const { data, error } = await resend.emails.send({
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
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>
              
              <p style="font-size: 16px; color: #4b5563;">
                We received a request to reset your password for your ${APP_NAME} account.
              </p>
              
              <p style="font-size: 16px; color: #4b5563;">
                Click the button below to reset your password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="font-size: 14px; color: #667eea; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 6px;">
                ${resetUrl}
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                This link will expire in <strong>1 hour</strong> for security reasons.
              </p>
              
              <p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 12px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 20px 0;">
                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
                This is an automated email, please do not reply.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("Resend email error:", error)
      return { success: false, error: error.message }
    }

    console.log("Password reset email sent successfully:", data?.id)
    return { success: true }
  } catch (error) {
    console.error("Failed to send password reset email:", error)
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
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Resend email error:", error)
      return { success: false, error: error.message }
    }

    console.log("Email sent successfully:", data?.id)
    return { success: true }
  } catch (error) {
    console.error("Failed to send email:", error)
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
    const { data, error } = await resend.emails.send({
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
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Welcome aboard, ${firstName}! 🎉</h2>
              
              <p style="font-size: 16px; color: #4b5563;">
                Your email has been verified and your organization <strong>${organizationName}</strong> is now active!
              </p>
              
              <p style="font-size: 16px; color: #4b5563;">
                You're all set to start managing your staff attendance with ${APP_NAME}.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("Resend email error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to send welcome email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}
