# ZiweiHub – AI-Assisted Zi Wei Dou Shu Chart Platform (PRD)

Team: Yikang Liu, Yizhang Cao · Approved P2 proposal · Acceptance criteria for each story are in its GitHub Issue.

## Problem
Zi Wei Dou Shu (紫微斗数) maps a person's birth date and hour onto a chart of 12 palaces. People who are curious about their charts use free calculators that forget everything once the page closes, paste chart screenshots into chat apps to ask friends or practitioners, and have no easy way to keep readings, compare two charts, or follow up on an earlier question. Birth details are personal data, but they often end up in public group chats.

## Solution
A private, account-based platform. Members create accurate charts with an open-source engine (MIT), save charts, get a streamed AI reading that continues as a saved conversation, and compare two charts. Members can share a chart with a practitioner, who adds palace notes and replies in a real-time consultation thread. Admins manage roles, review reported readings, and set AI limits. A documented public API returns charts as JSON. Readings are for cultural interest and self-reflection, not predictions, and never medical, legal, or financial advice.

## Users and roles
Guest · Member · Practitioner · Admin (permissions in AGENTS.md, "Roles and authorization").

## User stories
1. As a member, I want to sign up and log in with my GitHub account, so that my charts and readings are saved privately to my account.
2. As a member, I want to create, save, rename, and delete charts for myself and people I know, so that I can come back to them without re-entering birth details.
3. As a member, I want an AI reading of my chart that streams in, and to ask follow-up questions in a saved conversation, so that I can understand my chart and continue later.
4. As a member, I want to compare two of my saved charts for compatibility, so that I can understand my relationships with a partner, friend, or family member.
5. As a member, I want to share a chart with a practitioner and see their notes and replies appear in real time, so that I can get personal advice without copying my birth details into chat apps.
6. As a practitioner, I want to see the charts clients have shared with me, add notes to specific palaces, and reply to their questions, so that I can give clear, personalized consultations.
7. As an administrator, I want to manage users and roles, review readings that users report, and set daily AI usage limits, so that the platform stays safe, fair, and affordable.
8. As a developer, I want a documented public API that returns a chart as JSON from birth data, so that I can use the charting engine in my own projects.

## Release scope (Nov 12)
**In:** stories 1, 2, 3, 5, 7, 8; for story 6, practitioners see shared charts and reply in the real-time thread.
**Stretch, only if time allows:** story 4 (compatibility), practitioner palace notes, reporting readings, email/Google login.

## Out of scope
Payments, mobile apps, real-money services, and any change to the charting engine's results.
