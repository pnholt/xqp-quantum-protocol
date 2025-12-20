"""
Daily task planner for the XQP roadmap.

This script converts long-horizon objectives into daily, actionable tasks
between today and a target finish date (default: summer 2026).

Usage:
  python planner.py                # show today's suggested tasks
  python planner.py --date 2024-12-01
  python planner.py --start 2024-11-01 --slots 4

The plan favors lawful, ethical steps: professional legal help, education,
community outreach, compliant business building, and personal stability.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Dict, Iterable, List


TARGET_DATE = date(2026, 8, 31)


@dataclass(frozen=True)
class Task:
    """Represents an actionable task."""

    epic: str
    description: str
    priority: int = 3  # lower is higher priority
    effort_days: int = 1


# High-level objectives broken into concrete, lawful tasks.
TASKS: List[Task] = [
    Task("Legal & Compliance", "Schedule a consult with a solicitor to review appeal/expungement options and timelines.", 1),
    Task("Legal & Compliance", "Collect case files, court outcomes, and evidence for the legal review.", 1),
    Task("Legal & Compliance", "Draft a clear personal statement focused on rehabilitation and future plans.", 2),
    Task("Legal & Compliance", "Enroll in a certified rehabilitation/character-building program and track completion.", 2),
    Task("Legal & Compliance", "Create a folder of references (mentors, employers, community leaders) for legal applications.", 2),
    Task("Education", "Request official transcripts and re-enrollment requirements from University of Salford.", 1),
    Task("Education", "Prepare a concise re-admission packet (statement of purpose, achievements, references).", 1),
    Task("Education", "Submit re-admission application and follow up with the registrar.", 1),
    Task("Education", "Plan a semester-by-semester course path to graduation.", 2),
    Task("Education", "Secure financial aid or scholarships; submit required forms.", 2),
    Task("AI Law Firm", "Outline the AI-first legal services model (practice areas, boundaries, compliance).", 1),
    Task("AI Law Firm", "Validate regulatory requirements (SRA guidelines, data protection, client intake policies).", 1),
    Task("AI Law Firm", "Draft a one-page go-to-market plan and pricing for the first service line.", 2),
    Task("AI Law Firm", "Select tooling for secure document handling and AI workflows; document the stack.", 2),
    Task("AI Law Firm", "Prepare a risk register and mitigation plan (privacy, accuracy, human review checkpoints).", 2),
    Task("AI Law Firm", "Create a basic website/landing copy and value proposition.", 3),
    Task("Community & Mentoring", "Prepare a mentoring proposal for local schools (broadoak/high schools).", 2),
    Task("Community & Mentoring", "Design two 45-minute workshop outlines: resilience and STEM/AI skills.", 2),
    Task("Community & Mentoring", "Draft outreach emails to school contacts; request pilot dates.", 2),
    Task("Community & Mentoring", "Collect personal achievements and awards to include as credibility markers.", 2),
    Task("Media & Reputation", "Storyboard a feature pitch (justice, reform, future plans, community impact).", 2),
    Task("Media & Reputation", "Identify reporters/editors and tailor a concise media email.", 2),
    Task("Media & Reputation", "Assemble a press kit: short bio, headshot, milestones, contact info.", 3),
    Task("Crypto / XQP", "Define XQP value proposition (gold-backed thesis, compliance, custody model).", 1),
    Task("Crypto / XQP", "Draft a regulatory checklist (KYC/AML, financial promotions, licensing needs).", 1),
    Task("Crypto / XQP", "Model token economics and reserve backing; stress test scenarios.", 2),
    Task("Crypto / XQP", "Prepare an OTC and treasury operations runbook.", 2),
    Task("Crypto / XQP", "Design an outreach script for prospective partners (e.g., bullion shops) focusing on compliance.", 2),
    Task("Crypto / XQP", "Create investor pitch v1 with milestones to summer 2026.", 2),
    Task("Finance & Housing", "Build a personal budget and debt/obligation payoff schedule.", 1),
    Task("Finance & Housing", "Engage a mortgage/lettings advisor for Manchester high-rise options.", 2),
    Task("Finance & Housing", "List requirements to rent out current flat (compliance, safety checks, tenancy agreements).", 2),
    Task("Finance & Housing", "Draft a savings/investment plan tied to monthly milestones.", 2),
    Task("Events & Personal", "Define engagement event scope: venue shortlist, guest list, budget.", 2),
    Task("Events & Personal", "Reach out to top venues for availability quotes; compare options.", 3),
    Task("Events & Personal", "Outline wellbeing plan with weekly check-ins and support resources.", 1),
]


WEEKLY_HABITS = [
    "One legal/procedural action (call, document collection, or form submission).",
    "Two deep-work blocks on AI law firm or XQP product development.",
    "One outreach touchpoint (school, media, partner, or advisor).",
    "One financial review (budget, savings, or investment checkpoint).",
    "Health/wellbeing check-in and support actions.",
]


def expand_tasks(tasks: Iterable[Task]) -> List[Task]:
    """Expand tasks into per-day effort units."""
    expanded: List[Task] = []
    for task in sorted(tasks, key=lambda t: t.priority):
        expanded.extend([task] * task.effort_days)
    return expanded


def generate_schedule(start: date, target: date, slots_per_day: int = 3) -> Dict[date, List[Task]]:
    """Generate a simple linear schedule from the task backlog."""
    schedule: Dict[date, List[Task]] = {}
    backlog = expand_tasks(TASKS)
    total_days = (target - start).days + 1
    day_index = 0
    for task in backlog:
        scheduled = False
        while not scheduled and day_index < total_days:
            current = start + timedelta(days=day_index)
            schedule.setdefault(current, [])
            if len(schedule[current]) < slots_per_day:
                schedule[current].append(task)
                scheduled = True
            else:
                day_index += 1
        if not scheduled:
            break
    return schedule


def format_day(day: date, tasks: List[Task]) -> str:
    header = f"{day.strftime('%A, %d %B %Y')} — top {len(tasks)} actions"
    lines = [header, "-" * len(header)]
    for idx, task in enumerate(tasks, start=1):
        lines.append(f"{idx}. [{task.epic}] {task.description}")
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a daily task list toward the 2026 finish line.")
    parser.add_argument("--date", help="Show tasks for a specific date (YYYY-MM-DD). Defaults to today.")
    parser.add_argument("--start", help="Start date for the plan (YYYY-MM-DD). Defaults to today.")
    parser.add_argument("--target", help="Target finish date (YYYY-MM-DD). Defaults to 2026-08-31.")
    parser.add_argument("--slots", type=int, default=3, help="Number of focus tasks per day.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    start_date = datetime.strptime(args.start, "%Y-%m-%d").date() if args.start else date.today()
    requested_date = datetime.strptime(args.date, "%Y-%m-%d").date() if args.date else date.today()
    if not args.start and requested_date < start_date:
        # If the user asked for an earlier date, anchor the plan there to avoid empty days.
        start_date = requested_date
    target_date = datetime.strptime(args.target, "%Y-%m-%d").date() if args.target else TARGET_DATE
    schedule = generate_schedule(start_date, target_date, slots_per_day=args.slots)
    day = requested_date

    tasks_for_day = schedule.get(day, [])
    print(format_day(day, tasks_for_day))
    print("\nWeekly habits to reinforce:")
    for habit in WEEKLY_HABITS:
        print(f"- {habit}")


if __name__ == "__main__":
    main()
