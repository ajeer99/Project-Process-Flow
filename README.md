# Process Flow Application

Welcome to the Process Flow Application! This system is designed to seamlessly track projects, manage complex modules, and automate bug lifecycles across your development and testing teams.

This guide provides the necessary training for **Project Managers**, **Developers**, and **Testers** to effectively use the platform.

---

## 1. Understanding the System Hierarchy
To keep your work organized, the application uses a strict three-tier hierarchy:

1. **Projects:** The top-level container for a specific application or major initiative. 
   - *Important:* Every Project **must** have a designated **Project Manager** assigned to oversee its lifecycle. 
2. **Modules:** Major feature sets or sections within a Project (e.g., "Authentication", "Checkout Flow").
3. **Sub-Modules:** Specific, granular components within a Module (e.g., "Login Screen", "Credit Card Form").

By breaking work down to the Sub-Module level, the system can automatically route bugs directly to the team members responsible for that specific code.

---

## 2. Reporting a Bug
When you encounter an issue, reporting it accurately is critical for a fast resolution. 

### How to submit a Bug:
1. Navigate to the **"Report Bug"** or **"New Issue"** screen.
2. Select the relevant **Project**, followed by the specific **Module** and **Sub-Module** where the issue occurred.
3. Provide a clear, descriptive **Title**.
4. Detail the **Steps to Reproduce**, **Expected Behavior**, and **Actual Behavior** in the description.
5. Set the appropriate **Severity** (e.g., Blocked, High, Medium, Low).

### ✨ AI Assistance Features
To make reporting effortless, the application includes powerful built-in **AI Functions**:
- **Smart Description Generation:** You can input a rough draft or just a few unformatted notes, and the AI will analyze your text to automatically structure it into professional "Steps to Reproduce", "Expected Results", and "Actual Results" fields.
- **Severity Prediction:** The AI can analyze the crash logs or descriptions you provide and suggest the most appropriate Severity rating based on the context.
- **Duplicate Detection (If Enabled):** The AI can scan existing open bugs within the project to warn you if a similar issue has already been reported, saving your team from redundant work.

---

## 3. Auto-Assignment Setup & Workflow
You do not need to manually figure out who should fix a bug! The system relies on an **Automated Assignment Flow**.

### How Routing Works:
- **Groups:** Developers and Testers are organized into specific Groups (e.g., "Frontend Core Team", "QA Automation").
- When a Project Manager or Team Lead sets up a Project, they map these Groups directly to specific Modules and Sub-Modules.
- **The Result:** When you report a bug and select its Sub-Module, the system instantly identifies the exact Developer (or Developer Group) responsible for that code and places the bug directly into their queue. 
- Once the Developer finishes fixing it, the system automatically forwards it to the designated Tester (or Tester Group) for that exact feature.

### The Standard Lifecycle:
1. **OPEN / IN_PROGRESS:** The bug is with the Developer. They investigate, write code, and resolve the issue.
2. **READY_FOR_RETEST:** The Developer marks the bug as "Fixed". It instantly leaves their queue and appears in the Tester's queue.
3. **VERIFIED:** The Tester confirms the fix works. The bug is closed.
4. **REOPENED:** The Tester finds the bug is still occurring. It is immediately returned to the Developer's queue with a penalty added to their "Reopened Count" metric.

---

## 4. Role-Specific Instructions

### For Project Managers (PMs)
As a PM, you oversee the health of your assigned Projects.
- **Triage Queue:** If a bug is reported *without* a specific Sub-Module (or if the Sub-Module lacks an assigned Developer), it will fall into your Triage queue. You must manually assign team members to resolve it.
- **Performance Dashboards:** You have access to Analytics and Time Tracking reports specifically for your Projects. You can monitor how long bugs remain in `OPEN` states and track the overall verify-to-fail ratio of your engineering teams.

### For Developers
Your primary workspace is your **Developer Dashboard**.
- Focus solely on the bugs assigned to you. 
- You will see bugs categorized by Priority and Severity.
- When you begin working on a bug, the system tracks your active lead time. 
- Once you resolve the code, simply change the status to `READY_FOR_RETEST`. The system will automatically hand it off to QA and pause your time clock.

### For Testers
Your primary workspace is your **Tester Dashboard**.
- You will only see bugs that Developers have marked as `READY_FOR_RETEST`.
- Carefully review the developer's notes.
- If the bug is truly fixed, mark it `VERIFIED`.
- If the bug persists or the fix caused a new regression, mark it `REOPENED` and leave a clear comment detailing how it failed.

---

*Note: Administrative functions such as creating new users, editing root system permissions, or configuring global SMTP settings are restricted to System Administrators and are not accessible from your workspace.*
