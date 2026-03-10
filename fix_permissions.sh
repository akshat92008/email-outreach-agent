#!/bin/bash
echo "Fixing NPM permissions for AI Lead Gen..."
sudo chown -R $(whoami) ~/.npm "/Users/ashishsingh/Desktop/email automation"
echo "✅ Permissions fixed! You can now run the deployment command."
