# Development Workflow Guide 🚀

> **STOP AND READ THIS** before making any commits, PRs, or deployments!

This document outlines our complete development workflow to ensure code quality, maintainability, and smooth deployments. **Follow this process for every change**.

## Table of Contents
- [Quick Reference](#quick-reference)
- [Branch Strategy](#branch-strategy)
- [Development Process](#development-process)
- [Commit Standards](#commit-standards)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment Process](#deployment-process)
- [Emergency Procedures](#emergency-procedures)

---

## Quick Reference

### Before You Start
1. ✅ **Create feature branch** from `main`
2. ✅ **Follow naming convention**: `type/issue-description`
3. ✅ **Make focused commits** with conventional format
4. ✅ **Test locally** before pushing
5. ✅ **Create PR** with template
6. ✅ **Wait for review** and CI checks
7. ✅ **Merge only after approval**

### Emergency Checklist
- 🚨 **Hotfix?** Use `hotfix/` branch prefix
- 🚨 **Production down?** Follow [emergency procedures](#emergency-procedures)
- 🚨 **Security issue?** Create private issue, notify immediately

---

## Branch Strategy

### Branch Types
```
main/                    # Production-ready code
├── feature/123-new-ui   # New features
├── fix/456-calendar-bug # Bug fixes  
├── docs/update-readme   # Documentation
├── refactor/cleanup-db  # Code improvements
├── hotfix/critical-fix  # Emergency production fixes
└── chore/deps-update    # Maintenance tasks
```

### Naming Convention
```
<type>/<issue-number>-<short-description>

Examples:
- feature/789-dark-mode
- fix/234-mobile-layout  
- docs/workflow-guide
- hotfix/login-security
```

### Branch Lifecycle
1. **Create** from latest `main`
2. **Develop** with focused commits
3. **Push** regularly to remote
4. **Create PR** when ready
5. **Delete** after merge

---

## Development Process

### 1. Start New Work
```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/123-task-categories

# Start development...
```

### 2. During Development
```bash
# Make focused commits
git add .
git commit -m "feat: add task category selection UI"

# Push regularly
git push origin feature/123-task-categories

# Keep up with main (if long-lived branch)
git checkout main
git pull origin main
git checkout feature/123-task-categories
git rebase main  # or git merge main
```

### 3. Ready for Review
```bash
# Final check before PR
npm run lint
npm run build
npm run test:all

# Push final changes
git push origin feature/123-task-categories

# Create PR via GitHub UI (template will auto-populate)
```

---

## Commit Standards

### Format (Conventional Commits)
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples
```bash
✅ Good commits:
git commit -m "feat(calendar): add month navigation"
git commit -m "fix(mobile): resolve header alignment issue"
git commit -m "docs: update development workflow guide"
git commit -m "refactor(db): extract date utility functions"

❌ Bad commits:
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "updated files"
```

### Commit Best Practices
- **One change per commit**
- **Clear, descriptive messages**
- **Present tense** ("add" not "added")
- **Imperative mood** ("fix bug" not "fixes bug")
- **Reference issues** when applicable

---

## Pull Request Process

### 1. Pre-PR Checklist
- [ ] Branch is up-to-date with `main`
- [ ] All tests pass locally
- [ ] Code is linted and formatted
- [ ] No console.log in production code
- [ ] TypeScript compiles without errors
- [ ] Manual testing completed
- [ ] Screenshots added for UI changes

### 2. Creating the PR
1. **Go to GitHub** and create new PR
2. **Use the template** (auto-populates)
3. **Add descriptive title** (conventional format)
4. **Fill all template sections**
5. **Add reviewers** if needed
6. **Link related issues**
7. **Add appropriate labels**

### 3. PR Title Format
```
<type>(<scope>): <description>

Examples:
feat(calendar): add progressive day counter
fix(mobile): resolve button alignment issues
docs: update development workflow
```

### 4. During Review
- **Respond to feedback** promptly
- **Make requested changes** in new commits
- **Don't force-push** during review
- **Re-request review** after changes
- **Keep discussions constructive**

### 5. After Approval
- **Squash and merge** (preferred) or **merge**
- **Delete feature branch** 
- **Verify deployment** if auto-deployed

---

## Code Review Guidelines

### For Authors
- **Self-review first** - check your own PR
- **Provide context** - explain complex logic
- **Keep PRs small** - easier to review
- **Be responsive** - address feedback quickly
- **Test thoroughly** - don't rely only on CI

### For Reviewers
- **Review promptly** - within 24 hours
- **Be constructive** - suggest improvements
- **Test locally** for complex changes
- **Check security** - no exposed secrets
- **Verify UX** - does it work well for users?

### What to Review
- ✅ **Code quality** and readability
- ✅ **Performance** implications
- ✅ **Security** vulnerabilities
- ✅ **User experience** impact
- ✅ **Test coverage** adequacy
- ✅ **Documentation** updates needed
- ✅ **Breaking changes** identified

---

## CI/CD Pipeline

### Automated Checks
Our GitHub Actions pipeline runs on every PR:

1. **Lint & Build** 
   - ESLint code quality
   - TypeScript compilation
   - Next.js build verification

2. **Security Scan**
   - Dependency vulnerabilities
   - Secret detection
   - Audit checks

3. **PR Quality Checks**
   - Title format validation
   - Large file detection
   - Code quality metrics

4. **Deployment Preview**
   - Build verification
   - Preview environment setup
   - Status reporting

### Status Checks
All checks must ✅ **pass** before merge:
- Linting and TypeScript
- Build compilation
- Security scans
- PR format validation
- Review approval

### Failure Handling
If CI fails:
1. **Check the logs** in GitHub Actions
2. **Fix issues locally**
3. **Push new commits** (don't force-push)
4. **Wait for re-run** of checks
5. **Ask for help** if stuck

---

## Deployment Process

### Automatic Deployment
- **Merge to `main`** → Auto-deploy to production
- **Vercel** handles deployment automatically
- **Status updates** posted in commit

### Manual Deployment (if needed)
```bash
# Production build
cd daily-tracking
npm run build

# Deploy to Vercel
vercel --prod

# Verify deployment
curl -I https://tracker.timwatts.dev
```

### Deployment Verification
After deployment:
1. ✅ **Check live site** functionality
2. ✅ **Verify new features** work
3. ✅ **Test critical paths** (create task, calendar)
4. ✅ **Monitor** for errors
5. ✅ **Rollback** if issues found

### Rollback Process
If deployment fails:
```bash
# Revert the merge commit
git revert <merge-commit-hash>
git push origin main

# Or redeploy previous version
vercel --prod --force
```

---

## Emergency Procedures

### Production Outage
1. 🚨 **Create hotfix branch** immediately
2. 🚨 **Fix the critical issue**
3. 🚨 **Skip normal review** (but document why)
4. 🚨 **Deploy directly** to production
5. 🚨 **Create post-mortem** issue

### Security Vulnerability
1. 🔒 **Don't commit fix publicly** yet
2. 🔒 **Create private issue** or contact directly
3. 🔒 **Fix in private branch**
4. 🔒 **Deploy fix** immediately
5. 🔒 **Disclose responsibly** after fix

### Database Issues
1. 💾 **Stop writes** if data corruption risk
2. 💾 **Backup current state**
3. 💾 **Identify root cause**
4. 💾 **Test fix on backup**
5. 💾 **Apply fix to production**

---

## Tools and Resources

### Required Tools
- **Git** for version control
- **Node.js** v18+ for development
- **npm** for package management
- **VS Code** (recommended) with extensions
- **GitHub CLI** (optional but helpful)

### Helpful Commands
```bash
# Quick branch creation
gh repo fork --clone

# Create PR from CLI
gh pr create --fill

# Check PR status
gh pr status

# View PR checks
gh pr checks

# Switch to PR for testing
gh pr checkout 123
```

### VS Code Extensions
- ESLint
- Prettier
- TypeScript
- GitLens
- GitHub Pull Requests

---

## Troubleshooting

### Common Issues

**Q: CI failing with "Module not found"**
A: Run `npm ci` locally, check package.json dependencies

**Q: TypeScript errors in CI but not locally**
A: Ensure same Node.js version, run `npx tsc --noEmit`

**Q: PR checks failing**  
A: Check GitHub Actions tab, read error logs carefully

**Q: Merge conflicts**
A: `git rebase main` and resolve conflicts locally

**Q: Accidentally pushed to main**
A: Create revert PR immediately, don't force-push

### Getting Help
1. **Check this guide** first
2. **Search GitHub issues** for similar problems  
3. **Ask in team chat** or create discussion
4. **Create issue** if it's a process problem

---

## Process Improvements

This workflow will evolve! Suggest improvements by:
1. **Creating an issue** with label `workflow`
2. **Discussing in PR comments**
3. **Updating this guide** as needed

### Recent Changes
- 2025-08-14: Initial workflow guide created
- 2025-08-14: GitHub Actions CI/CD pipeline added
- 2025-08-14: PR and issue templates created

---

**Remember: This process exists to help us ship better software faster. When in doubt, follow the process!**

🚀 Happy coding!
