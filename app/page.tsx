"use client"

import { useState } from "react"
import { AppHeader } from "@/components/pentest/app-header"
import { Sidebar, type SidebarView } from "@/components/pentest/sidebar"
import { TargetPanel } from "@/components/pentest/target-panel"
import { FindingsEditor } from "@/components/pentest/findings-editor"
import { SuggestionPanel } from "@/components/pentest/suggestion-panel"
import { TechniqueDrawer } from "@/components/pentest/technique-drawer"
import { KeyboardShortcuts } from "@/components/pentest/keyboard-shortcuts"
import { KnowledgeBase } from "@/components/pentest/knowledge-base"
import { RulesEditor } from "@/components/pentest/rules-editor"
import type { Engagement, Target, Suggestion, Technique, KnowledgeEntry, Rule } from "@/lib/types"

const mockEngagements: Engagement[] = [
  { id: "1", name: "ACME Corp Assessment", phase: "enumeration", status: "active" },
  { id: "2", name: "Internal Network Audit", phase: "exploitation", status: "active" },
  { id: "3", name: "Web App Pentest", phase: "reporting", status: "completed" },
]

const initialTargets: Target[] = [
  {
    id: "1",
    ip: "192.168.1.100",
    label: "web-server-01",
    inScope: true,
    discoveredDuringRecon: false,
    ports: [
      { port: 22, service: "ssh", version: "OpenSSH 8.2p1", status: "open" },
      { port: 80, service: "http", version: "nginx 1.18.0", status: "open" },
      { port: 443, service: "https", version: "nginx 1.18.0", status: "open" },
      { port: 3306, service: "mysql", version: "MySQL 8.0.26", status: "filtered" },
    ],
  },
  {
    id: "2",
    ip: "192.168.1.101",
    label: "db-server-01",
    inScope: true,
    discoveredDuringRecon: true,
    ports: [
      { port: 22, service: "ssh", version: "OpenSSH 7.9p1", status: "open" },
      { port: 5432, service: "postgresql", version: "PostgreSQL 13.4", status: "open" },
    ],
  },
]

const mockSuggestions: Suggestion[] = [
  {
    id: "1",
    title: "SSH User Enumeration",
    service: "ssh",
    owaspTag: "A07:2021",
    confidence: "high",
    description: "Enumerate valid usernames via timing attack",
  },
  {
    id: "2",
    title: "HTTP Directory Bruteforce",
    service: "http",
    owaspTag: "A01:2021",
    confidence: "medium",
    description: "Discover hidden directories and files",
  },
  {
    id: "3",
    title: "SSL/TLS Configuration Check",
    service: "https",
    owaspTag: "A02:2021",
    confidence: "high",
    description: "Check for weak ciphers and protocols",
  },
  {
    id: "4",
    title: "MySQL Authentication Bypass",
    service: "mysql",
    owaspTag: "A07:2021",
    confidence: "low",
    description: "Attempt authentication bypass techniques",
  },
  {
    id: "5",
    title: "PostgreSQL Default Credentials",
    service: "postgresql",
    owaspTag: "A07:2021",
    confidence: "medium",
    description: "Test for default or weak credentials",
  },
]

const mockTechnique: Technique = {
  id: "1",
  title: "SSH User Enumeration",
  description: "Enumerate valid usernames on the SSH server using timing-based attacks. This technique exploits the difference in response times when attempting to authenticate with valid vs invalid usernames.",
  inputs: [
    { name: "TARGET_IP", placeholder: "192.168.1.100", description: "Target IP address" },
    { name: "WORDLIST", placeholder: "/usr/share/wordlists/users.txt", description: "Username wordlist" },
  ],
  commands: [
    "nmap --script ssh-brute --script-args userdb={{WORDLIST}} -p 22 {{TARGET_IP}}",
    "hydra -L {{WORDLIST}} -p test -t 4 ssh://{{TARGET_IP}}",
    "msf> use auxiliary/scanner/ssh/ssh_enumusers",
  ],
  expectedOutput: "Valid usernames will show different response times or explicit confirmation messages.",
  notes: "This technique may trigger IDS/IPS alerts. Use with caution and ensure proper authorization.",
}

const mockKnowledgeEntries: KnowledgeEntry[] = [
  {
    id: "1",
    title: "SSH Enumeration",
    domain: "enumeration",
    phase: "enumeration",
    service: "ssh",
    tags: ["network", "authentication", "brute-force"],
    owaspTags: ["A07:2021"],
    description: "SSH enumeration involves identifying valid usernames and testing authentication mechanisms on SSH servers. This is typically done through timing attacks, banner grabbing, and authentication testing.",
    steps: [
      "Identify SSH service using port scanning (typically port 22)",
      "Grab SSH banner for version information",
      "Attempt user enumeration using timing attacks",
      "Test for default credentials",
      "Check for key-based authentication vulnerabilities",
    ],
    commands: [
      { command: "nmap -sV -p 22 <target>", description: "Identify SSH service and version" },
      { command: "ssh -v <target>", description: "Verbose connection to grab banner" },
      { command: "hydra -L users.txt -p test ssh://<target>", description: "User enumeration via timing" },
    ],
    notes: "SSH enumeration may trigger account lockouts or IDS alerts. Always ensure proper authorization before testing.",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "2",
    title: "Web Directory Bruteforce",
    domain: "enumeration",
    phase: "enumeration",
    service: "http",
    tags: ["web", "discovery", "bruteforce"],
    owaspTags: ["A01:2021", "A05:2021"],
    description: "Directory bruteforcing is a technique used to discover hidden files and directories on web servers that are not linked from the main application.",
    steps: [
      "Identify the web server technology",
      "Select appropriate wordlist based on technology",
      "Run directory bruteforce tool",
      "Analyze results for interesting endpoints",
      "Recursively scan discovered directories",
    ],
    commands: [
      { command: "gobuster dir -u http://<target> -w /usr/share/wordlists/dirb/common.txt", description: "Basic directory scan" },
      { command: "feroxbuster -u http://<target> -w wordlist.txt -x php,html,js", description: "Recursive scan with extensions" },
      { command: "dirsearch -u http://<target> -e php,asp,aspx,jsp", description: "Alternative with extension support" },
    ],
    notes: "Large wordlists can generate significant traffic. Consider rate limiting to avoid detection or service disruption.",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-18T11:45:00Z",
  },
  {
    id: "3",
    title: "SQL Injection Testing",
    domain: "exploitation",
    phase: "exploitation",
    service: "http",
    tags: ["web", "injection", "database"],
    owaspTags: ["A03:2021"],
    description: "SQL injection is a code injection technique used to attack data-driven applications by inserting malicious SQL statements into entry fields.",
    steps: [
      "Identify input points that interact with databases",
      "Test for error-based SQL injection",
      "Test for blind SQL injection (boolean and time-based)",
      "Attempt to extract data or escalate privileges",
      "Document the vulnerability and impact",
    ],
    commands: [
      { command: "sqlmap -u 'http://<target>/page?id=1' --dbs", description: "Automated SQL injection testing" },
      { command: "' OR '1'='1", description: "Basic authentication bypass payload" },
      { command: "sqlmap -u 'http://<target>/page?id=1' --dump -T users", description: "Extract table data" },
    ],
    notes: "SQL injection can cause data loss or corruption. Always test in a controlled environment and backup data when possible.",
    createdAt: "2024-01-05T08:00:00Z",
    updatedAt: "2024-01-22T16:20:00Z",
  },
  {
    id: "4",
    title: "Nmap Scanning Techniques",
    domain: "tools",
    service: "network",
    tags: ["scanning", "discovery", "network"],
    owaspTags: [],
    description: "Nmap is a powerful network scanning tool used for host discovery, port scanning, service detection, and vulnerability assessment.",
    steps: [
      "Start with host discovery to identify live targets",
      "Perform port scanning on discovered hosts",
      "Use service detection to identify running services",
      "Run vulnerability scripts on identified services",
    ],
    commands: [
      { command: "nmap -sn <target>/24", description: "Host discovery (ping scan)" },
      { command: "nmap -sS -sV -p- <target>", description: "Full port scan with service detection" },
      { command: "nmap --script vuln <target>", description: "Run vulnerability scripts" },
      { command: "nmap -sU -p 53,161,500 <target>", description: "UDP scan on common ports" },
    ],
    notes: "Full port scans can take significant time. Consider using --min-rate for faster scans in time-constrained scenarios.",
    createdAt: "2024-01-02T07:00:00Z",
    updatedAt: "2024-01-25T10:00:00Z",
  },
  {
    id: "5",
    title: "OWASP Top 10 - A01 Broken Access Control",
    domain: "owasp",
    tags: ["web", "authorization", "access-control"],
    owaspTags: ["A01:2021"],
    description: "Broken Access Control occurs when users can act outside of their intended permissions. This includes accessing unauthorized functions or data.",
    steps: [
      "Identify all access control mechanisms",
      "Test horizontal privilege escalation (accessing other users' data)",
      "Test vertical privilege escalation (accessing admin functions)",
      "Check for IDOR vulnerabilities",
      "Verify JWT/session token security",
    ],
    commands: [
      { command: "curl -X GET 'http://<target>/api/users/2' -H 'Authorization: Bearer <user1_token>'", description: "Test IDOR" },
      { command: "curl -X GET 'http://<target>/admin' -H 'Authorization: Bearer <user_token>'", description: "Test admin access" },
    ],
    notes: "Access control testing requires understanding the application's user roles and permissions model.",
    createdAt: "2024-01-01T06:00:00Z",
    updatedAt: "2024-01-28T09:30:00Z",
  },
]

const mockRules: Rule[] = [
  {
    id: "1",
    name: "SSH User Enumeration",
    description: "Suggests SSH user enumeration techniques when an SSH service is detected on a target.",
    phase: "enumeration",
    enabled: true,
    tags: ["ssh", "enumeration", "authentication"],
    conditions: [
      { type: "service_detected", field: "service", operator: "equals", value: "ssh" },
      { type: "port_open", field: "port", operator: "equals", value: "22" },
    ],
    suggestions: [
      {
        title: "SSH User Enumeration",
        description: "Enumerate valid usernames via timing attack",
        confidence: "high",
        owaspTag: "A07:2021",
        commands: ["nmap --script ssh-brute -p 22 <target>"],
      },
    ],
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "2",
    name: "HTTP Directory Discovery",
    description: "Suggests directory bruteforcing when HTTP/HTTPS services are detected.",
    phase: "enumeration",
    enabled: true,
    tags: ["http", "web", "discovery"],
    conditions: [
      { type: "service_detected", field: "service", operator: "contains", value: "http" },
    ],
    suggestions: [
      {
        title: "Directory Bruteforce",
        description: "Discover hidden directories and files",
        confidence: "medium",
        owaspTag: "A01:2021",
        commands: ["gobuster dir -u http://<target> -w wordlist.txt"],
      },
    ],
    createdAt: "2024-01-08T09:00:00Z",
    updatedAt: "2024-01-18T11:45:00Z",
  },
  {
    id: "3",
    name: "MySQL Default Credentials",
    description: "Tests for default or weak MySQL credentials when MySQL service is detected.",
    phase: "exploitation",
    enabled: true,
    tags: ["mysql", "database", "credentials"],
    conditions: [
      { type: "service_detected", field: "service", operator: "equals", value: "mysql" },
      { type: "port_open", field: "port", operator: "equals", value: "3306" },
    ],
    suggestions: [
      {
        title: "MySQL Default Credentials",
        description: "Test for default or weak MySQL credentials",
        confidence: "medium",
        owaspTag: "A07:2021",
        commands: ["hydra -L users.txt -P passwords.txt mysql://<target>"],
      },
    ],
    createdAt: "2024-01-05T08:00:00Z",
    updatedAt: "2024-01-22T16:20:00Z",
  },
  {
    id: "4",
    name: "SSL/TLS Weakness Check",
    description: "Analyzes SSL/TLS configuration for weak ciphers and protocols.",
    phase: "enumeration",
    enabled: false,
    tags: ["ssl", "tls", "crypto"],
    conditions: [
      { type: "service_detected", field: "service", operator: "equals", value: "https" },
      { type: "port_open", field: "port", operator: "equals", value: "443" },
    ],
    suggestions: [
      {
        title: "SSL/TLS Configuration Analysis",
        description: "Check for weak ciphers, protocols, and certificate issues",
        confidence: "high",
        owaspTag: "A02:2021",
        commands: ["testssl.sh <target>", "sslscan <target>"],
      },
    ],
    createdAt: "2024-01-12T11:00:00Z",
    updatedAt: "2024-01-25T10:00:00Z",
  },
  {
    id: "5",
    name: "PostgreSQL Enumeration",
    description: "Suggests PostgreSQL enumeration techniques when the service is detected.",
    phase: "enumeration",
    enabled: true,
    tags: ["postgresql", "database", "enumeration"],
    conditions: [
      { type: "service_detected", field: "service", operator: "equals", value: "postgresql" },
      { type: "port_open", field: "port", operator: "equals", value: "5432" },
    ],
    suggestions: [
      {
        title: "PostgreSQL Default Credentials",
        description: "Test for default or weak PostgreSQL credentials",
        confidence: "medium",
        owaspTag: "A07:2021",
        commands: ["hydra -L users.txt -P passwords.txt postgres://<target>"],
      },
    ],
    createdAt: "2024-01-15T12:00:00Z",
    updatedAt: "2024-01-28T09:30:00Z",
  },
]

export default function PentestNotebook() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeView, setActiveView] = useState<SidebarView>("engagements")
  const [activeEngagement, setActiveEngagement] = useState<Engagement>(mockEngagements[0])
  const [targets, setTargets] = useState<Target[]>(initialTargets)
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(initialTargets[0])
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>(mockKnowledgeEntries)
  const [rules, setRules] = useState<Rule[]>(mockRules)
  const [findings, setFindings] = useState(`# Engagement: ACME Corp Assessment

## Phase: Enumeration

### Target: 192.168.1.100 (web-server-01)

#### Port Scan Results
\`\`\`
PORT     STATE    SERVICE     VERSION
22/tcp   open     ssh         OpenSSH 8.2p1
80/tcp   open     http        nginx 1.18.0
443/tcp  open     https       nginx 1.18.0
3306/tcp filtered mysql       MySQL 8.0.26
\`\`\`

#### Findings
- SSH service is running on default port
- Web server (nginx) is exposed on ports 80 and 443
- MySQL port is filtered (possible firewall rule)

### Next Steps
- [ ] Enumerate SSH users
- [ ] Directory bruteforce on web server
- [ ] Check SSL/TLS configuration
`)

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion)
    setDrawerOpen(true)
  }

  const handleMarkAsTried = (suggestionId: string) => {
    console.log("[v0] Marking suggestion as tried:", suggestionId)
  }

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
  }

  const handleAddTarget = (newTarget: Omit<Target, "id" | "ports">) => {
    const target: Target = {
      id: String(Date.now()),
      ...newTarget,
      ports: [],
    }
    setTargets((prev) => [...prev, target])
  }

  const handleAddPort = (targetId: string, port: Port) => {
    setTargets((prev) =>
      prev.map((target) => {
        if (target.id === targetId) {
          // Check if port already exists
          if (target.ports.some((p) => p.port === port.port)) {
            return target
          }
          return {
            ...target,
            ports: [...target.ports, port],
          }
        }
        return target
      })
    )
  }

  const handleToggleRule = (id: string, enabled: boolean) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, enabled } : rule))
    )
  }

  const handleUpdateRule = (id: string, updates: Partial<Rule>) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule))
    )
  }

  const handleUpdateKnowledgeEntry = (id: string, updates: Partial<KnowledgeEntry>) => {
    setKnowledgeEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates, updatedAt: new Date().toISOString() } : entry))
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader
        activeEngagement={activeEngagement}
        syncStatus="synced"
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          engagements={mockEngagements}
          activeEngagement={activeEngagement}
          onEngagementSelect={setActiveEngagement}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        
        {activeView === "engagements" && (
          <main className="flex flex-1 overflow-hidden">
            <TargetPanel
              targets={targets}
              selectedTarget={selectedTarget}
              onTargetSelect={setSelectedTarget}
              onAddTarget={handleAddTarget}
              onAddPort={handleAddPort}
            />
            
            <FindingsEditor
              value={findings}
              onChange={setFindings}
              phase={activeEngagement.phase}
            />
            
            <SuggestionPanel
              suggestions={mockSuggestions}
              onSuggestionClick={handleSuggestionClick}
              onMarkAsTried={handleMarkAsTried}
              onCopyCommand={handleCopyCommand}
            />
          </main>
        )}

        {activeView === "knowledge" && (
          <KnowledgeBase
            entries={knowledgeEntries}
            onUpdateEntry={handleUpdateKnowledgeEntry}
          />
        )}

        {activeView === "rules" && (
          <RulesEditor
            rules={rules}
            onToggleRule={handleToggleRule}
            onUpdateRule={handleUpdateRule}
          />
        )}
      </div>

      <TechniqueDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        technique={selectedSuggestion ? mockTechnique : null}
        onCopyCommand={handleCopyCommand}
      />

      <KeyboardShortcuts
        onSwitchPhase={() => console.log("[v0] Switch phase")}
        onNewFinding={() => setFindings(prev => prev + "\n\n### New Finding\n")}
        onFocusSuggestions={() => document.getElementById("suggestion-panel")?.focus()}
      />
    </div>
  )
}
