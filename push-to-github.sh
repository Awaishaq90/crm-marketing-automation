#!/bin/bash

# Instructions to push to GitHub
# Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual GitHub username and repository name

echo "=== GitHub Repository Setup Commands ==="
echo ""
echo "1. First, create a new repository on GitHub.com"
echo "2. Then run these commands:"
echo ""
echo "# Add remote origin (replace with your repository URL):"
echo "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
echo ""
echo "# Push to GitHub:"
echo "git branch -M main"
echo "git push -u origin main"
echo ""
echo "=== Alternative: If you want to use SSH ==="
echo "git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git"
echo "git push -u origin main"
echo ""
echo "=== Repository Information ==="
echo "Repository name: crm-marketing-automation"
echo "Description: CRM Marketing Automation System with Next.js and Supabase"
echo "Visibility: Public (recommended for portfolio)"
echo ""
echo "=== Current Git Status ==="
git status
echo ""
echo "=== Recent Commits ==="
git log --oneline -3
