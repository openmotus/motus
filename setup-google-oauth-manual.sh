#!/bin/bash

# Manual Google OAuth Setup Script
# This helps you get the refresh token for Google Calendar and Gmail

echo "🔐 Google OAuth Manual Setup"
echo "=========================="
echo ""
echo "Your Google OAuth Credentials:"
echo "Client ID: 580582062962-g3bb67qrbtsmtbr21ui1eni14v8uq3n5.apps.googleusercontent.com"
echo "Client Secret: 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"
echo ""
echo "Steps to get your refresh token:"
echo "================================"
echo ""
echo "1. Go to: https://developers.google.com/oauthplayground/"
echo ""
echo "2. Click the gear icon (⚙️) in the top right"
echo "   - Check 'Use your own OAuth credentials'"
echo "   - Enter the Client ID and Secret above"
echo "   - Close settings"
echo ""
echo "3. In the left panel, select these scopes:"
echo "   - Google Calendar API v3:"
echo "     ✓ https://www.googleapis.com/auth/calendar"
echo "     ✓ https://www.googleapis.com/auth/calendar.events"
echo "   - Gmail API v1:"
echo "     ✓ https://www.googleapis.com/auth/gmail.modify"
echo "     ✓ https://www.googleapis.com/auth/gmail.compose"
echo "     ✓ https://www.googleapis.com/auth/gmail.send"
echo ""
echo "4. Click 'Authorize APIs' button"
echo "   - Select your Google account"
echo "   - Click 'Allow' to grant permissions"
echo ""
echo "5. Click 'Exchange authorization code for tokens'"
echo ""
echo "6. Copy the 'Refresh token' from the response"
echo ""
echo "7. Update your .env file:"
echo "   Replace: GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here"
echo "   With:    GOOGLE_REFRESH_TOKEN=[your actual refresh token]"
echo ""
echo "Once complete, test with:"
echo "node test-google-connection.js"
echo ""
echo "Press Enter to open the OAuth Playground in your browser..."
read

# Try to open browser
if command -v open &> /dev/null; then
    open "https://developers.google.com/oauthplayground/"
elif command -v xdg-open &> /dev/null; then
    xdg-open "https://developers.google.com/oauthplayground/"
else
    echo "Please open this URL manually:"
    echo "https://developers.google.com/oauthplayground/"
fi