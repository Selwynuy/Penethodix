# Engagement Phases Explained

## Purpose of Phases

Phases in Penethodix represent the different stages of a penetration testing engagement. They help you:

1. **Organize your workflow** - Track where you are in the testing process
2. **Filter and categorize** - Knowledge base entries and rules can be phase-specific
3. **Generate contextual suggestions** - Rules can activate based on current phase
4. **Reporting organization** - Group findings by phase in your final report

## The 5 Phases

### 1. **Reconnaissance** (Recon)
- **What**: Information gathering about the target
- **Activities**: OSINT, DNS enumeration, subdomain discovery, social media research
- **Tools**: `nmap`, `theHarvester`, `recon-ng`, `shodan`
- **Example**: "Found exposed S3 bucket via subdomain enumeration"

### 2. **Enumeration**
- **What**: Active scanning and service identification
- **Activities**: Port scanning, service version detection, directory bruteforcing
- **Tools**: `nmap`, `gobuster`, `nikto`, `enum4linux`
- **Example**: "Discovered Apache 2.4.41 on port 80 with exposed /admin directory"

### 3. **Exploitation**
- **What**: Attempting to gain unauthorized access
- **Activities**: Exploiting vulnerabilities, gaining initial access, privilege escalation
- **Tools**: `metasploit`, `sqlmap`, custom exploits
- **Example**: "SQL injection in login form led to database access"

### 4. **Post-Exploitation**
- **What**: Maintaining access and exploring the compromised system
- **Activities**: Persistence, lateral movement, data exfiltration, pivoting
- **Tools**: `mimikatz`, `bloodhound`, `crackmapexec`
- **Example**: "Dumped credentials and moved laterally to domain controller"

### 5. **Reporting**
- **What**: Documenting findings and preparing deliverables
- **Activities**: Writing reports, creating executive summaries, risk assessment
- **Tools**: Documentation, risk matrices
- **Example**: "Compiled all findings into executive report with CVSS scores"

## How Phases Are Used in Penethodix

### 1. **Rule Activation**
Rules can be configured to only suggest actions during specific phases:
- Example: "Only suggest SQL injection tests during Enumeration phase"
- This prevents premature exploitation suggestions

### 2. **Knowledge Base Filtering**
Knowledge entries can be tagged with phases:
- Filter techniques by phase
- See what's relevant for your current stage

### 3. **Findings Organization**
Findings can be associated with phases:
- Group findings by phase in reports
- Track which phase each vulnerability was discovered in

### 4. **Workflow Tracking**
The phase badge in the header shows your current stage:
- Helps team members understand engagement status
- Useful for project management

## Relevance for Reporting

**Yes, phases are highly relevant for reporting:**

1. **Executive Summary**: "During the Enumeration phase, we discovered..."
2. **Chronological Order**: Findings organized by phase show the attack progression
3. **Risk Assessment**: Early-phase findings (Recon/Enum) are often lower risk; Exploitation findings are critical
4. **Remediation Priority**: Phase-based organization helps prioritize fixes
5. **Compliance**: Some frameworks (OWASP, PTES) require phase-based reporting

## Categories vs Phases: Understanding the Difference

It's important to understand the distinction between **Categories** and **Phases** in the Knowledge Base:

### Categories (Domain)
- **What**: The topic/domain of knowledge (e.g., "Web Apps", "Network", "Cloud", "Mobile")
- **Purpose**: Organize entries by subject area or technology type
- **Usage**: **Required** - Every knowledge entry must have a category
- **Scope**: Knowledge base organization
- **Example**: "SSH Enumeration" → Category: "Network Security"

### Phases
- **What**: The stage in your methodology/engagement (e.g., "Reconnaissance", "Enumeration", "Exploitation")
- **Purpose**: Track when/where in your workflow a technique applies
- **Usage**: **Optional** - Entries can have a phase or not
- **Scope**: Engagement workflow and methodology
- **Example**: "SSH Enumeration" → Phase: "Enumeration"

### Why They Sometimes Overlap

You might notice that some users create categories with phase names (e.g., "Reconnaissance" as a category). This is valid, but understanding the distinction helps:

- **Categories** answer: *"What domain/topic is this?"*
- **Phases** answer: *"When in my methodology does this apply?"*

A single technique can belong to a category (what) AND have a phase (when). For example:
- Entry: "SQL Injection Testing"
- Category: "Web Applications" (what)
- Phase: "Enumeration" (when)

### Best Practice

**Recommended approach:**
- **Categories** = What (domain/topic) - e.g., "Web Apps", "Network", "Cloud", "Mobile", "API Security"
- **Phases** = When (methodology stage) - e.g., "Reconnaissance", "Enumeration", "Exploitation", "Post-Exploitation", "Reporting"

This separation allows you to:
- Filter by topic (category) to find all web app techniques
- Filter by phase to find all enumeration techniques
- Combine both filters for maximum precision

**Note**: If you create a category with the same name as a phase, the system will automatically detect this and set the phase for you to avoid redundancy.

## Best Practice

- **Start in Reconnaissance** when beginning a new engagement
- **Progress through phases** as you discover more
- **Switch to Reporting** when you're ready to document everything
- **Use Alt+P** to quickly cycle through engagement phases (or open phase dialog in Knowledge Base)
- **Use Alt+C** to add categories in Knowledge Base
- **Use Alt+E** to add entries in Knowledge Base

## Optional vs Required

Phases are **optional** in most places:
- Knowledge entries can have a phase (or not)
- Findings don't require a phase
- Rules can work across all phases

But they're **useful** for:
- Organizing large engagements
- Filtering suggestions
- Professional reporting
