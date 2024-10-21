export const ticketSubmissionSuccessEmailTemplate = {
  subject: "Support Ticket Submitted",
  getHtml: (
    recipientName: string,
    additionalData: Record<string, unknown>,
    css: string
  ): string => {
    const ticketId = additionalData.ticketId as string;
    const subject = additionalData.subject as string;
    const category = additionalData.category as string;
    const submittedOn = new Date(
      additionalData.submittedOn as string
    ).toLocaleDateString();

    return `
    <html>
      <head>
        <style>
          ${css}
          .ticket-icon {
            width: 80px;
            height: 80px;
            fill: #1a3b5d;
            animation: fadeIn 0.5s ease-in-out;
          }
          @keyframes fadeIn {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <svg class="ticket-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            <h1>Support Ticket Submitted</h1>
          </div>
          <p>Hello ${recipientName},</p>
          <p>Thank you for reaching out to our support team. We have received your ticket and are working diligently to assist you.</p>
          <p>Here are the details of your submitted ticket:</p>
          <ul>
            <li><strong>Ticket ID:</strong> ${ticketId}</li>
            <li><strong>Subject:</strong> ${subject}</li>
            <li><strong>Category:</strong> ${category}</li>
            <li><strong>Submitted On:</strong> ${submittedOn}</li>
          </ul>
          <p>Our support team will review your ticket and provide a response as soon as possible. We appreciate your patience and understanding.</p>
          <p>If you have any additional information or updates regarding your ticket, please reply to this email or log in to your account to manage your ticket.</p>
          <a href="https://aetheriqinc.com/support" class="button">View Ticket</a>
          <p>We value your feedback and are committed to providing you with the best support experience. If you have any further questions or concerns, please don't hesitate to reach out.</p>
          <div class="footer">
            <p>Best regards,<br>The AetheriQ Support Team</p>
          </div>
        </div>
      </body>
    </html>
    `;
  },
};
