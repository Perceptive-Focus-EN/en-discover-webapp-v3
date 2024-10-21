export const passwordResetSuccessEmailTemplate = {
  subject: "Password Reset Successful",
  getHtml: (
    recipientName: string,
    additionalData: Record<string, unknown>,
    css: string
  ): string => `
    <html>
      <head>
        <style>
          ${css}
          .check-icon {
            width: 80px;
            height: 80px;
            animation: scale 0.5s ease-in-out;
          }
          @keyframes scale {
            0% {
              transform: scale(0);
            }
            100% {
              transform: scale(1);
            }
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1a3b5d;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            margin-bottom: 20px;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #122a42;
          }
          .button:active {
            background-color: #0c192a;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #777777;
            font-size: 14px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDBDQTQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTkgMTkuNDI0TDEuNjU2IDExLjA4N2ExLjAwMSAxLjAwMSAwIDAgMSAwLTEuNDE0bDIuMTQ0LTIuMTQ0YTEuMDAxIDEuMDAxIDAgMCAxIDEuNDE0IDBMOSA0LjcwOWwxMC4xNDEtMTAuMTQxYTEuMDAxIDEuMDAxIDAgMCAxIDEuNDE0bDIuMTQ0IDIuMTQxYTEuMDAxIDEuMDAxIDAgMCAxIDAgMS40MTRMOSAxOS40MjR6Ii8+PC9zdmc+" alt="Check Icon" class="check-icon" />
            <h1>Password Reset Successful</h1>
          </div>
          <p>Dear ${recipientName},</p>
          <p>Your password has been successfully reset. You can now log in to your account using your new password.</p>
          <p>If you did not request this password reset, please contact our support team immediately.</p>
          <p>Click the button below to log in:</p>
          <a href="http://localhost:3000/login" class="button">Log In</a>
          <p>Thank you for using our service!</p>
          <div class="footer">
            <p>Best regards,<br>The AetherIQ Team</p>
          </div>
        </div>
      </body>
    </html>
  `,
};
