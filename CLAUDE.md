# Gateway-OS — Project Boundaries & Build Reference

## Purpose

Gateway-OS is a **local file-processing agent** that acts as a validation gatekeeper for a downstream **Hazel 5** routing engine. It monitors a Google Drive staging folder, validates/sanitizes filenames against the FLAIM V6.0 standard, optionally runs Docker-based OCR, and hands off valid files to the Hazel Inbox.

---

## Architecture: Linear Handoff Model

```
Monitor (chokidar)
  └─▶ Sanitize  (strip spaces, normalize accents, lowercase ext)
        └─▶ Validate  (FLAIM V6.0 regex)
              └─▶ OCR Intercept  (optional — MATH+Annot files only)
                    └─▶ Handoff  (move to Hazel Inbox)
                          └─▶ Error Path  (move to /errors on failure)
```

---

## Naming Standard: FLAIM V6.0

**Format:** `[Prefix]-[Date]_[SubjectCode]_[FileType]_[Description].[ext]`

**Regex:**
```
^\d{2}-\d{4}-\d{2}-\d{2}_(MATH|Sci|SS|Fren|Comm)_[A-Za-z0-9]+_[A-Za-z0-9]+\.[a-z]{2,4}$
```

**Valid Subject Codes:** `MATH`, `Sci`, `SS`, `Fren`, `Comm`

**Example valid filenames:**
- `01-2024-09-15_MATH_Annot_worksheet.pdf`
- `07-2025-01-20_Sci_Lab_report123.txt`
- `03-2024-06-01_Fren_Vocab_lecon1.mp4`

---

## I/O Paths

| Path | Description |
|------|-------------|
| `/Users/caryhebert/Library/CloudStorage/GoogleDrive-cary.hebert@gmail.com/My Drive/03_scannedinbox` | **Staging** — monitored input folder |
| `/Users/caryhebert/Library/CloudStorage/GoogleDrive-cary.hebert@gmail.com/My Drive/03_scannedinbox/errors` | **Error** — invalid filenames land here |
| `/Users/caryhebert/Library/CloudStorage/GoogleDrive-chebert4@ebrschools.org/My Drive/00_Inbox` | **Hazel Inbox** — handoff destination |

---

## Build Commands

```bash
# Install dependencies
npm install

# Type-check only (no emit)
npm run lint

# Compile TypeScript → dist/
npm run build

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run watcher (development)
npm run dev

# Run watcher (production, after build)
npm start
```

---

## Source Structure

```
src/
├── index.ts                  # Entry point — starts the chokidar watcher
├── logic/
│   ├── namingValidator.ts    # FLAIM V6.0 regex validation
│   └── sanitizer.ts          # Filename sanitization (spaces, accents, ext)
├── services/
│   └── ocrService.ts         # Docker OCR intercept (MATH+Annot only)
└── __tests__/
    ├── namingValidator.test.ts
    └── sanitizer.test.ts
```

---

## OCR Intercept Rule

**Trigger condition:** `SubjectCode === 'MATH' && FileType === 'Annot'`

**Docker command:**
```bash
docker run --rm -i jbarlow83/ocrmypdf --language eng+fra --deskew --clean <INPUT> <OUTPUT>
```

Execution is **synchronous/blocking** via `child_process.execSync` before the file is moved.

---

## Constraints

- **Language:** Node.js with strict TypeScript (`noImplicitAny`, `strictNullChecks`)
- **No `any` types** — ever
- **Error handling:** All errors must route the file to the `/errors` subfolder, never crash the watcher
- **Blocking OCR:** The Docker process must complete before handoff proceeds

---

## Security

- This project follows **Project Sentinel** standards
- No credentials committed — use environment variables or `.env` (git-ignored)
- The `.gitignore` covers all sensitive files
