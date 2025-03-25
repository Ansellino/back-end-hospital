# Run this in your terminal to generate a secure random string

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

example : c60f5f18c74d91e5b3b359fffac36a7c1194d54102f286828997f59e0dc0d1ed