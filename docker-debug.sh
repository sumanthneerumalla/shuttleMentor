#!/bin/bash

# Start the application in debug mode
echo "Starting ShuttleMentor in debug mode..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

echo "Application is running in debug mode."
echo "To debug server-side code:"
echo "1. Open VS Code"
echo "2. Go to the Debug panel"
echo "3. Select 'Docker: Debug Server-Side' from the dropdown"
echo "4. Press F5 to attach the debugger"
echo ""
echo "The application is available at: http://localhost:3000"
