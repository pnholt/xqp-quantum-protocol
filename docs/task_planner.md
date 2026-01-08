# XQP Long-Horizon Daily Planner

Use `planner.py` to translate long-term objectives into 3 focus actions per day through summer 2026.

## Quick start
```bash
python planner.py               # today's tasks
python planner.py --date 2024-12-01
python planner.py --slots 4     # adjust daily focus blocks
python planner.py --start 2024-11-01 --target 2026-08-31
```

## What it does
- Encodes lawful, ethical objectives across legal clean-up, education, AI law firm launch, community mentoring, media/reputation, XQP compliance/go-to-market, finance/housing, and events.
- Breaks each objective into actionable units and spreads them evenly across days.
- Surfaces weekly habits to reinforce consistency (legal/admin touchpoints, product work, outreach, finance, wellbeing).

## Extending the plan
- Edit `TASKS` or `WEEKLY_HABITS` in `planner.py` to add/remove actions.
- Tweak `TARGET_DATE` or pass `--target` to shift the finish line.
- Use `--slots` to change how many focus tasks you want per day.

The script avoids any shortcuts; it assumes proper legal counsel, compliant fintech practices, and constructive community engagement.
