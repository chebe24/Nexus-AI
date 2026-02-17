# Nexus-AI

**Trilingual 1st Grade French Immersion Workspace**

Automated AI agent management and trilingual RAG system for educational content creation.

---

## 🎯 Project Overview

**Owner:** Cary Hebert (chebert4@ebrschools.org)  
**Purpose:** Manage AI agents and generate trilingual educational content  
**Security Level:** Production (Project Sentinel Compliant)  
**Status:** Active Development

### Key Features

✅ **AI Agent Inventory** - Automated tracking of iOS Shortcuts and Apps Script agents  
✅ **Trilingual RAG** - French/English/Spanish content generation  
✅ **Security Hardened** - Zero-code storage, identity guardrails, audit logging  
✅ **FLAIM v4.1 Compliant** - Organized file structure and naming conventions

---

## 📁 Project Structure

```
Nexus-AI/
├── active/           # Active AI agents (shortcuts, scripts)
├── db/               # Database and backups
│   └── backups/      # Inventory snapshots (git-ignored)
├── docs/             # Documentation
│   ├── reference/    # Git/SSH workflow guides
│   └── SECURITY_HARDENING.md
├── scripts/          # Google Apps Script files
│   ├── config/       # Script configuration
│   └── update-db.gs  # AI agent inventory management (SECURE)
├── src/              # Source code for RAG and utilities
│   ├── .env.template # Environment variables template
│   └── standards_raw/# Raw educational standards data
└── .gitignore        # Security-compliant ignore patterns
```

---

## 🚀 Quick Start

### Prerequisites

- **Google Account:** `chebert4@ebrschools.org` or `cary.hebert@gmail.com`
- **Git:** Installed with SSH configured
- **Python 3.8+:** For RAG embeddings (future)
- **Node.js:** For any JavaScript tooling (future)

### Initial Setup

1. **Clone Repository**
   ```bash
   cd ~/Projects
   git clone git@github.com:chebe24/Nexus-AI.git
   cd Nexus-AI
   ```

2. **Configure Environment**
   ```bash
   # Copy environment template
   cp src/.env.template src/.env
   
   # Edit with your API keys
   nano src/.env
   ```

3. **Deploy Apps Script**
   - Open [Google Apps Script](https://script.google.com)
   - Create new project: "Nexus-AI-Orchestrator"
   - Copy contents of `scripts/update-db.gs`
   - Configure Script Properties (see docs/SECURITY_HARDENING.md)

---

## 🔐 Security

This project follows **Project Sentinel** security standards:

### ✅ Implemented

- **Zero-Code Storage:** All credentials in Script Properties / .env (git-ignored)
- **Identity Guardrail:** Email verification on all Apps Script functions
- **Audit Logging:** Security_Audit sheet tracks all operations
- **Fail-Safe Config:** Missing credentials throw explicit errors

### 🚨 NEVER Commit

- `.env` files
- API keys or credentials
- Sheet IDs or Folder IDs
- Service account JSON files

See [docs/SECURITY_HARDENING.md](docs/SECURITY_HARDENING.md) for details.

---

## 📚 Documentation

- **[Git Workflow Guide](docs/reference/git-workflow-guide.md)** - GitHub Flow and daily Git usage
- **[SSH Troubleshooting](docs/reference/ssh-troubleshooting.md)** - Advanced SSH debugging
- **[Security Hardening](docs/SECURITY_HARDENING.md)** - Project Sentinel implementation details

---

## 🛠️ Development

### Apps Script: update-db.gs

**Purpose:** Scan Google Drive folder, update inventory sheet, flag deprecated agents

**Required Script Properties:**
- `INVENTORY_SHEET_ID` - Google Sheets ID
- `DRIVE_FOLDER_ID` - Google Drive folder ID  
- `AUTHORIZED_EMAIL` - chebert4@ebrschools.org
- `DEPRECATED_DAYS` - 90

**Functions:**
- `updateInventory()` - Scan and update (run manually or via trigger)
- `createInventorySheet()` - Initialize tracking sheet
- `setupDailyTrigger()` - Schedule daily automation
- `validateConfiguration()` - Test Script Properties

### Python RAG (Planned)

```bash
# Future: Trilingual embedding generation
cd src/
python standards_embed.py
```

---

## 🔄 Git Workflow

### Daily Commits

```bash
# Create feature branch
git checkout -b feat/add-vocabulary-module

# Make changes, commit
git add .
git commit -m "feat: Add trilingual vocabulary generator"

# Push to GitHub
git push -u origin feat/add-vocabulary-module
```

### Syncing with Main

```bash
git checkout main
git pull origin main
git checkout feat/your-branch
git merge main
```

See [docs/reference/git-workflow-guide.md](docs/reference/git-workflow-guide.md) for full workflow.

---

## 📊 Current Status

### ✅ Completed

- [x] Security-hardened update-db.gs deployed
- [x] Git repository initialized with secure .gitignore
- [x] Documentation structure established
- [x] Reference guides for Git/SSH workflows

### 🔄 In Progress

- [ ] Python RAG embeddings system
- [ ] Trilingual vocabulary generator
- [ ] Agent template library

### 📅 Planned

- [ ] Automated backup system
- [ ] Claude Projects integration
- [ ] Multi-environment support (dev/prod)

---

## 🤝 Contributing

This is a personal educational project. If you're collaborating:

1. Follow [GitHub Flow](https://githubflow.github.io/) branching strategy
2. Use [Conventional Commits](https://www.conventionalcommits.org/) format
3. Never commit credentials or sensitive data
4. Test Script Properties before pushing Apps Script changes

---

## 📝 License

Personal Educational Project - Cary Hebert

---

## 📧 Contact

**Cary Hebert**  
- Work: chebert4@ebrschools.org
- Personal: cary.hebert@gmail.com  
- GitHub: [@chebe24](https://github.com/chebe24)

---

**Last Updated:** 2026-02-16  
**Version:** 1.0.0  
**Security Compliance:** Project Sentinel ✅
