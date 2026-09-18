const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

function getEmailTemplate(type, data) {
    switch (type) {
        case 'welcome':
            return `
          <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; padding: 0; margin: 0;">
            <div style="max-width:600px;margin:40px auto;background:white;padding:40px 32px 32px 32px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <div style="text-align:center;margin-bottom:24px;">
                <h2 style="color:#0056b3;margin:16px 0 8px 0;">Welcome to <span style='color:#0ea5e9;'>BCI</span></h2>
                <p style="color:#64748b;font-size:18px;">We're excited to have you on board!</p>
              </div>
              <p style="font-size:16px;color:#22223b;">Hi <b>${data.name}</b>,</p>
              <p style="font-size:16px;color:#22223b;">You are assigned as a <b>${data.role}</b> in BCI.</p>
              <p style="font-size:15px;color:#334155;">You can log in using the credentials below:</p>
              <div style="background:#f1f5f9;padding:18px 20px;border-radius:8px;margin:24px 0 18px 0;font-size:15px;">
                <strong>Login URL:</strong> <a href="${data.loginUrl}" style="color:#0ea5e9;">${data.loginUrl}</a><br>
                <strong>Username:</strong> ${data.email}<br>
                <strong>Password:</strong> ${data.password}
              </div>
              <p style="color:#ef4444;font-size:14px;">Please change your password after logging in for security.</p>
              <div style="text-align:center;margin:32px 0 0 0;">
                <a href="${data.loginUrl}" style="background:#0ea5e9;color:white;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">Login Now</a>
              </div>
            </div>
          </body>
          </html>
        `;

        case 'password-reset':
            return `
          <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; padding: 0; margin: 0;">
            <div style="max-width:600px;margin:40px auto;background:white;padding:40px 32px 32px 32px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <div style="text-align:center;margin-bottom:24px;">
                <h2 style="color:#d9534f;margin:16px 0 8px 0;">Password Reset Request</h2>
              </div>
              <p style="font-size:16px;color:#22223b;">Hi <b>${data.name}</b>,</p>
              <p style="font-size:15px;color:#334155;">You requested to reset your password. Your new credentials are:</p>
              <div style="background:#f1f5f9;padding:18px 20px;border-radius:8px;margin:24px 0 18px 0;font-size:15px;">
                <strong>Login URL:</strong> <a href="${data.loginUrl}" style="color:#0ea5e9;">${data.loginUrl}</a><br>
                <strong>Username:</strong> ${data.email}<br>
                <strong>Password:</strong> ${data.password}
              </div>
              <p style="margin-top:32px;color:#64748b;font-size:14px;">Login with the credentials above and reset your password.</p>
            </div>
          </body>
          </html>
        `;

        case 'daily-doer':
            return `
          <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; padding: 0; margin: 0;">
            <div style="max-width:600px;margin:40px auto;background:white;padding:40px 32px 32px 32px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <div style="text-align:center;margin-bottom:24px;">
                <img src='https://img.icons8.com/color/96/000000/todo-list.png' alt='Daily Notification' style='width:64px;height:64px;'/>
                <h2 style="color:#0ea5e9;margin:16px 0 8px 0;">Your Daily Task Summary</h2>
              </div>
              <p style="font-size:16px;color:#22223b;">Hi <b>${data.name}</b>,</p>
              <p style="font-size:15px;color:#334155;">Here is your daily task summary for today:</p>
              <ul style="background:#f1f5f9;padding:18px 20px;border-radius:8px;margin:24px 0 18px 0;font-size:15px;list-style:none;">
                <li><strong>Active Tasks:</strong> <span style='color:#0ea5e9;'>${data.totalActiveTasks}</span></li>
                <li><strong>Overdue Tasks:</strong> <span style='color:#ef4444;'>${data.totalOverdueTasks}</span></li>
                <li><strong>Tasks Assigned Today:</strong> <span style='color:#22c55e;'>${data.totalTodaysTasks}</span></li>
              </ul>
              <p style="color:#64748b;font-size:14px;">Stay productive! Please check your dashboard for details.</p>
              <div style="text-align:center;margin:32px 0 0 0;">
                <a href="${data.dashboardUrl}" style="background:#0ea5e9;color:white;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">Go to Dashboard</a>
              </div>
              <p style="margin-top:40px;color:#64748b;font-size:14px;text-align:center;">— AwesomeApp Team</p>
            </div>
          </body>
          </html>
        `;

        case 'daily-eapc':
            return `
          <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; padding: 0; margin: 0;">
            <div style="max-width:600px;margin:40px auto;background:white;padding:40px 32px 32px 32px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <div style="text-align:center;margin-bottom:24px;">
                <img src='https://img.icons8.com/color/96/000000/checked-checkbox.png' alt='Daily Notification' style='width:64px;height:64px;'/>
                <h2 style="color:#0ea5e9;margin:16px 0 8px 0;">Your Daily Task Summary</h2>
              </div>
              <p style="font-size:16px;color:#22223b;">Hi <b>${data.name}</b>,</p>
              <p style="font-size:15px;color:#334155;">Here is your daily task summary for today:</p>
              <ul style="background:#f1f5f9;padding:18px 20px;border-radius:8px;margin:24px 0 18px 0;font-size:15px;list-style:none;">
                <li><strong>Active Tasks:</strong> <span style='color:#0ea5e9;'>${data.totalActiveTasks}</span></li>
                <li><strong>Completed Tasks:</strong> <span style='color:#22c55e;'>${data.totalCompletedTasks}</span></li>
                <li><strong>Overdue Tasks:</strong> <span style='color:#ef4444;'>${data.totalOverdueTasks}</span></li>
                <li><strong>Tasks Assigned Today:</strong> <span style='color:#f59e42;'>${data.totalTodaysTasks}</span></li>
              </ul>
              <p style="color:#64748b;font-size:14px;">Keep up the great work! Please check your dashboard for more details.</p>
              <div style="text-align:center;margin:32px 0 0 0;">
                <a href="${data.dashboardUrl}" style="background:#0ea5e9;color:white;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">Go to Dashboard</a>
              </div>
              <p style="margin-top:40px;color:#64748b;font-size:14px;text-align:center;">— AwesomeApp Team</p>
            </div>
          </body>
          </html>
        `;

        default:
            return '<p>No template found.</p>';
    }
}

const sendEmail = async (email, subject, type, data) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html: getEmailTemplate(type, data),
    };
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;