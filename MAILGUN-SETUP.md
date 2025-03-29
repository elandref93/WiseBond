# Mailgun Email Integration Setup

This application uses Mailgun for email delivery for calculator result sharing and lead generation. To enable email functionality, you need to configure your Mailgun credentials.

## Configuration Steps

1. Create an account on [Mailgun](https://www.mailgun.com/) if you don't already have one.
2. Once logged in, go to your dashboard to find your API key and domain.
3. Create a `.env` file in the root directory of this project (you can copy from `.env.example`).
4. Add the following Mailgun-related environment variables to your `.env` file:

```
# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=your_mailgun_domain_here
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
```

Replace the placeholder values with your actual Mailgun API key, domain, and the email address you want to use as the sender.

## Email Features

### 1. Calculator Result Sharing

The application allows users to share their calculator results via email. This feature:
- Collects lead information (name, email)
- Sends a professionally formatted email with the calculation results
- Stores the lead information in the database for follow-up

### 2. Email Templates

The email templates are customized for each calculator type and include:
- The specific calculation results
- Call-to-action for contacting a home loan consultant
- Professional formatting with HTML and plain text alternatives

## Development Notes

- In development mode without valid Mailgun credentials, the application will still function, but emails won't be sent
- API calls to the email endpoint will return success responses even if the email isn't sent during development
- Check the console logs for any Mailgun-related errors
- For testing purposes, you may want to use Mailgun's sandbox domain during development

## Troubleshooting

If emails are not being sent:
1. Check that your Mailgun API key and domain are correctly configured in the `.env` file
2. Verify your Mailgun account is active and not restricted
3. Check server logs for any Mailgun-related errors
4. Ensure your Mailgun sending domain is properly verified