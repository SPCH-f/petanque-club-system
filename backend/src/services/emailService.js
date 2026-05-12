const nodemailer = require('nodemailer');

const createTransporter = () => {
  // Use environment variables if set, otherwise fallback to a mock/log transporter for dev
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  
  // Dev/Fallback mock transporter
  return {
    sendMail: async (options) => {
      console.log('--------------------------------------------------');
      console.log('MOCK EMAIL SENT:');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('Body:', options.text);
      console.log('--------------------------------------------------');
      return { messageId: 'mock-id' };
    }
  };
};

const sendResetPasswordEmail = async (email, resetUrl) => {
  const transporter = createTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || 'ชมรมเปตอง';
  const fromAddr = process.env.EMAIL_FROM_ADDR || 'noreply@petanque.club';

  const mailOptions = {
    from: `"${fromName}" <${fromAddr}>`,
    to: email,
    subject: 'รีเซ็ตรหัสผ่าน - ระบบบริหารจัดการชมรมเปตอง',
    text: `คุณได้รับอีเมลนี้เนื่องจากมีการขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ\n\nกรุณาคลิกที่ลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์มีอายุ 1 ชั่วโมง):\n\n${resetUrl}\n\nหากคุณไม่ได้เป็นผู้ส่งคำขอนี้ โปรดเพิกเฉยต่ออีเมลนี้และรหัสผ่านของคุณจะไม่เปลี่ยนแปลง`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">รีเซ็ตรหัสผ่าน</h2>
        <p>คุณได้รับอีเมลนี้เนื่องจากมีการขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณในระบบชมรมเปตอง</p>
        <p>กรุณาคลิกที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์มีอายุ 1 ชั่วโมง):</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">ตั้งรหัสผ่านใหม่</a>
        </div>
        <p>หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์ของคุณ:</p>
        <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">หากคุณไม่ได้เป็นผู้ส่งคำขอนี้ โปรดเพิกเฉยต่ออีเมลนี้และรหัสผ่านของคุณจะไม่เปลี่ยนแปลง</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendResetPasswordEmail,
};
