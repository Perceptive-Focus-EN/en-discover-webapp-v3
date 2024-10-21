import { COMPANY_NAME } from '../constants/emailConstants';

export const baseTemplate = (content: string, styles: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Notification</title>
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${COMPANY_NAME} All rights reserved.
    </div>
  </div>
</body>
</html>
`;