#!/bin/bash

# Push to GitHub repository script
# This script will push your ISAFV-QHSE AIoT Platform to GitHub

echo "Pushing ISAFV-QHSE AIoT Platform to GitHub..."

# Ensure we're in the right directory
cd /home/shenzheng/lfwlw

# Show current status
echo "Current Git status:"
git status -s

# Show remote configuration
echo -e "\nCurrent remote configuration:"
git remote -v

# Instructions for pushing
echo -e "\n==================== INSTRUCTIONS ===================="
echo "The project has been committed and is ready to push."
echo ""
echo "To push to your GitHub repository, run ONE of these commands:"
echo ""
echo "Option 1 - Using SSH (if you have SSH keys set up):"
echo "  git remote set-url origin git@github.com:backspace-xdw/WebScadaPM.git"
echo "  git push -u origin master"
echo ""
echo "Option 2 - Using HTTPS (will prompt for username/password):"
echo "  git remote set-url origin https://github.com/backspace-xdw/WebScadaPM.git"
echo "  git push -u origin master"
echo ""
echo "Option 3 - If the repository already has content, force push:"
echo "  git push -u origin master --force"
echo ""
echo "======================================================"
echo ""
echo "Last commit details:"
git log -1 --oneline