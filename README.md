AutoFix AI
==========

End-to-end vehicle exterior damage detection and repair cost estimation pipeline.

## Overview

Pipeline: Image Upload -> Damage Detection (YOLO) -> Cost Estimation (AI Providers + Baseline Normalization) -> Report/UI.

### Key Components
| Layer | Path | Description |
|-------|------|-------------|
| Backend API | `backend/server.js` | Express server mounting upload, detect, estimate routes |
| Detection Controller | `backend/controllers/detectController.js` | Spawns Python YOLO script, parses JSON detections |
| YOLO Inference | `backend/ml_model/detect_ultra.py` | Ultralytics inference, class mapping, confidence fallback |
| Class Map | `backend/ml_model/class_map.json` | Maps numeric model classes to semantic part names |
| Cost Estimator | `backend/controllers/estimateHybrid.js` | OpenAI -> Gemini -> Local baseline heuristic with normalization |
| Baseline Costs | `backend/data/part_cost_baseline.inr.json` | INR min/avg/max + OEM/aftermarket ranges |
| Frontend | `frontend/src` | React UI: upload form, result display, normalization indicators |

## Detection
Ultralytics YOLO model invoked via child process. Output normalized to: `[{ name, confidence, box: {x1,y1,x2,y2} }]` plus `confidence_used` threshold.

## Cost Estimation Fallback Hierarchy
1. OpenAI Chat Completion (`OPENAI_API_KEY`)
2. Gemini (`GEMINI_API_KEY`)
3. Local heuristic using baseline averages

Each attempt recorded in `attempts`: `[ { provider, ok, error? } ]`.

## Baseline Normalization
File: `backend/data/part_cost_baseline.inr.json` provides per-part `{ min, aftermarket, avg, oem, max }`.

Rules applied to AI (OpenAI/Gemini) JSON output:
- Clamp any cost below `min` -> `min` (record normalization entry)
- Clamp any cost above `max` -> `max`
- Replace non-positive / invalid numbers with `avg`
- Add any detected parts missing from AI output using `avg` (marked with `added: true`)

Response fields:
```
{
	provider: 'openai' | 'gemini' | 'local',
	currency: 'INR',
	baselineVersion: '2025-09-24-v1',
	costBreakdown: [{ part, cost }],
	totalCost: number,
	normalization: [ { part, original, adjusted, min, max, added? } ],
	attempts: [...]
}
```

## Environment Variables (.env)
```
OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
PORT=5000
```

Create `backend/.env` and optionally `frontend/.env` (for proxy config if needed).

## Running (Development)
Backend:
```powershell
cd backend
npm install
node server.js
```

Frontend:
```powershell
cd frontend
npm install
npm start
```

Open http://localhost:3000.

## Adding New Parts
1. Update model / retrain if needed.
2. Add mapping in `class_map.json` (id -> name).
3. Add baseline entry in `part_cost_baseline.inr.json`.
4. Frontend automatically reflects new part in detection and cost breakdown.

## Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| `SyntaxError: Identifier 'detectedParts' has already been declared` | Duplicate destructuring | Fixed in `estimateHybrid.js` (remove second declaration) |
| Empty detections | Low confidence | Lower threshold logic in `detect_ultra.py` auto-retries |
| Cost looks unrealistic | Provider outlier | Normalization clamps to baseline ranges |

## Git Ignore & Large Files
Root `.gitignore` excludes uploads, model weights (`*.pt`), build output, env files. Commit small config and code only.

## GitHub Push Instructions
Initialize (if not already a repo):
```powershell
git init
git add .
git commit -m "Initial AutoFix AI baseline normalization"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

For updates:
```powershell
git add .
git commit -m "feat: normalize costs & add baseline dataset"
git push
```

## Future Enhancements
- Severity scoring influencing cost (min→avg→max interpolation)
- Caching identical part sets for cost estimation
- Support labor rate regional adjustments
- Authentication & user history

## History Reset & Secret Remediation (2025-09-24)
Earlier commits (now removed) accidentally contained real API keys inside `backend/.env`. The repository history was force-reinitialized (`git init` + fresh initial commit) to eliminate leaked blobs. Keys have been rotated. If you previously cloned the project before this date:

1. Discard your old clone and re-clone to get the new clean history.
2. Treat any keys you pulled as compromised and rotate them.
3. Keep real secrets only in an untracked `.env` (a `.env.example` can be added for placeholders).

GitHub secret scanning should no longer block pushes (legacy blob id removed). Open an issue if you notice any residual secrets.

## License
Add a license file (e.g., MIT) if you plan to open source.

