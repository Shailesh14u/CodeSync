import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Users, 
  Sparkles, 
  Layers, 
  GitBranch, 
  ShieldCheck, 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  Code2, 
  Cpu, 
  Database, 
  Lock, 
  Zap,
  RefreshCw,
  ExternalLink,
  Sliders,
  FileCode,
  MessageSquare
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { apiService } from '../services/api';
import { HealthResponse } from '../types';

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'python' | 'cpp' | 'javascript'>('python');
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  const fetchHealth = async () => {
    setIsHealthLoading(true);
    const start = performance.now();
    try {
      const data = await apiService.getHealth();
      setLatency(Math.round(performance.now() - start));
      setHealthData(data);
    } catch (err) {
      console.error('Failed to probe health', err);
    } finally {
      setIsHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const codeSnippets = {
    python: `# CodeSync AI - Real-time Collaborative Python Environment
from typing import List

def solve_optimal_path(grid: List[List[int]]) -> int:
    """Calculates min path sum using dynamic programming."""
    if not grid or not grid[0]:
        return 0
    m, n = len(grid), len(grid[0])
    dp = [float('inf')] * (n + 1)
    dp[1] = 0
    
    for row in grid:
        for j in range(len(row)):
            dp[j + 1] = min(dp[j], dp[j + 1]) + row[j]
            
    return int(dp[n])

# Input matrix
matrix = [
    [1, 3, 1],
    [1, 5, 1],
    [4, 2, 1]
]

result = solve_optimal_path(matrix)
print(f"Optimal Minimum Cost: {result}")  # Expected: 7`,

    cpp: `// CodeSync AI - Real-time Collaborative C++20 Sandbox
#include <iostream>
#include <vector>
#include <algorithm>

int solveOptimalPath(const std::vector<std::vector<int>>& grid) {
    int m = grid.size(), n = grid[0].size();
    std::vector<int> dp(n, 1e9);
    dp[0] = grid[0][0];

    for (int j = 1; j < n; ++j) dp[j] = dp[j - 1] + grid[0][j];

    for (int i = 1; i < m; ++i) {
        dp[0] += grid[i][0];
        for (int j = 1; j < n; ++j) {
            dp[j] = std::min(dp[j], dp[j - 1]) + grid[i][j];
        }
    }
    return dp[n - 1];
}

int main() {
    std::vector<std::vector<int>> matrix = {{1, 3, 1}, {1, 5, 1}, {4, 2, 1}};
    std::cout << "Optimal Minimum Cost: " << solveOptimalPath(matrix) << std::endl;
    return 0;
}`,

    javascript: `// CodeSync AI - Modern Node.js Sandbox Environment
const solveOptimalPath = (grid) => {
  const m = grid.length, n = grid[0].length;
  const dp = new Array(n).fill(Infinity);
  dp[0] = grid[0][0];

  for (let j = 1; j < n; j++) dp[j] = dp[j - 1] + grid[0][j];

  for (let i = 1; i < m; i++) {
    dp[0] += grid[i][0];
    for (let j = 1; j < n; j++) {
      dp[j] = Math.min(dp[j], dp[j - 1]) + grid[i][j];
    }
  }
  return dp[n - 1];
};

const matrix = [[1, 3, 1], [1, 5, 1], [4, 2, 1]];
console.log("Optimal Minimum Cost:", solveOptimalPath(matrix));`
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge variant="accent" size="md" className="gap-2 px-3 py-1">
              <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
              <span>Introducing CodeSync AI Platform</span>
              <span className="text-content-muted">|</span>
              <span className="text-content-secondary font-mono text-[11px]">Phase 1 Architecture Active</span>
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-content-main max-w-4xl mx-auto leading-tight sm:leading-none">
            Code Together in Real Time.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
              Execute Safely.
            </span>{' '}
            Supercharged by AI.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-content-secondary max-w-2xl mx-auto leading-relaxed">
            The next-generation browser development environment combining Monaco Editor, Yjs CRDT synchronization, isolated Docker multi-language runtimes, and contextual AI pair-programming.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                const ide = document.getElementById('ide-preview');
                if (ide) ide.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Live IDE Preview
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.open('/docs', '_blank')}
              leftIcon={<Database className="w-4 h-4 text-accent-primary" />}
            >
              FastAPI OpenAPI Specs
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const arch = document.getElementById('architecture');
                if (arch) arch.scrollIntoView({ behavior: 'smooth' });
              }}
              leftIcon={<Sliders className="w-4 h-4" />}
            >
              System Architecture
            </Button>
          </div>

          {/* Live System Health Strip */}
          <div className="mt-10 max-w-xl mx-auto">
            <div className="bg-background-panel border border-border-subtle rounded-xl p-3 px-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${healthData?.status === 'healthy' ? 'bg-status-success animate-pulse' : 'bg-status-warning'}`} />
                <span className="font-medium text-content-main">API System:</span>
                <span className="font-mono text-content-secondary">
                  {healthData ? `${healthData.app} v${healthData.version}` : 'Connecting...'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {latency !== null && (
                  <span className="text-content-muted font-mono">{latency}ms latency</span>
                )}
                <Badge variant={healthData?.status === 'healthy' ? 'success' : 'warning'} size="sm">
                  {healthData?.database.connected ? `DB: ${healthData.database.dialect}` : 'DB Standalone Mode'}
                </Badge>
                <button
                  onClick={fetchHealth}
                  disabled={isHealthLoading}
                  className="text-content-secondary hover:text-content-main transition-colors"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isHealthLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive IDE Mockup Teaser */}
        <div id="ide-preview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="bg-background-panel rounded-2xl border border-border-subtle shadow-panel overflow-hidden">
            {/* IDE Top Bar */}
            <div className="bg-background-secondary border-b border-border-subtle px-4 py-2.5 flex items-center justify-between">
              {/* Left window buttons & workspace title */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="h-4 w-px bg-border-subtle mx-1" />
                <span className="text-xs font-mono font-medium text-content-secondary flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-accent-primary" />
                  codesync-demo-workspace
                </span>
              </div>

              {/* Collaborator Presence Indicator */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5 overflow-hidden">
                  <span className="inline-block w-6 h-6 rounded-full ring-2 ring-background-secondary bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center" title="Alex (Owner)">
                    AL
                  </span>
                  <span className="inline-block w-6 h-6 rounded-full ring-2 ring-background-secondary bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center" title="Elena (Collaborator)">
                    EL
                  </span>
                  <span className="inline-block w-6 h-6 rounded-full ring-2 ring-background-secondary bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center" title="CodeSync AI Assistant">
                    AI
                  </span>
                </div>
                <Badge variant="success" size="sm" className="hidden sm:inline-flex text-[10px]">
                  3 Active Now
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-1.5 h-7 text-xs bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500"
                  leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                  onClick={() => alert("Code execution engine will be connected to Docker sandboxes in Phase 5!")}
                >
                  Run
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => alert("AI assistant side panel opens in Phase 6!")}
                  leftIcon={<Sparkles className="w-3 h-3 text-accent-secondary" />}
                >
                  AI Review
                </Button>
              </div>
            </div>

            {/* IDE Tabs */}
            <div className="flex items-center bg-background-main border-b border-border-subtle px-2 pt-1 gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1.5 text-xs font-mono rounded-t-md flex items-center gap-2 transition-colors border-t-2 ${
                  activeTab === 'python'
                    ? 'bg-background-panel text-content-main border-accent-primary font-semibold'
                    : 'text-content-secondary hover:text-content-main border-transparent'
                }`}
              >
                <span className="text-amber-400">🐍</span> main.py
              </button>
              <button
                onClick={() => setActiveTab('cpp')}
                className={`px-3 py-1.5 text-xs font-mono rounded-t-md flex items-center gap-2 transition-colors border-t-2 ${
                  activeTab === 'cpp'
                    ? 'bg-background-panel text-content-main border-accent-primary font-semibold'
                    : 'text-content-secondary hover:text-content-main border-transparent'
                }`}
              >
                <span className="text-blue-400">⚡</span> solution.cpp
              </button>
              <button
                onClick={() => setActiveTab('javascript')}
                className={`px-3 py-1.5 text-xs font-mono rounded-t-md flex items-center gap-2 transition-colors border-t-2 ${
                  activeTab === 'javascript'
                    ? 'bg-background-panel text-content-main border-accent-primary font-semibold'
                    : 'text-content-secondary hover:text-content-main border-transparent'
                }`}
              >
                <span className="text-yellow-400">📜</span> worker.js
              </button>
            </div>

            {/* Editor Body with Code + Floating Collaborator Tooltips */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
              {/* Main Code Window */}
              <div className="lg:col-span-8 p-4 font-mono text-xs text-slate-300 bg-[#0E1524] overflow-x-auto relative leading-relaxed">
                {/* Floating live collaborator cursor simulation */}
                <div className="absolute top-28 left-48 z-20 pointer-events-none">
                  <div className="flex items-center gap-1 bg-purple-600 text-white text-[10px] font-sans px-1.5 py-0.5 rounded shadow">
                    Elena is editing
                  </div>
                  <div className="w-0.5 h-5 bg-purple-400 animate-pulse" />
                </div>

                {/* Floating AI recommendation hint */}
                <div className="absolute top-52 right-8 z-20 max-w-xs bg-background-panel/95 border border-accent-primary/40 rounded-lg p-2.5 shadow-glow-primary text-[11px] font-sans text-content-main backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-accent-secondary font-semibold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Optimization Suggestion
                  </div>
                  <p className="text-content-secondary text-[11px] leading-tight">
                    Current dynamic programming space complexity is O(N). Consider space compression for 1D rolling array.
                  </p>
                </div>

                <pre className="select-text whitespace-pre overflow-x-auto">
                  {codeSnippets[activeTab]}
                </pre>
              </div>

              {/* Side Output & Integrated Terminal */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-border-subtle bg-background-secondary p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle mb-3">
                    <span className="text-xs font-mono text-content-secondary flex items-center gap-1.5 font-medium">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      Sandbox Terminal Output
                    </span>
                    <Badge variant="outline" size="sm" className="text-[10px] font-mono">
                      Docker Worker #01
                    </Badge>
                  </div>

                  <div className="font-mono text-xs space-y-2">
                    <div className="text-content-muted text-[11px]">
                      $ codesync-runner --lang={activeTab} --timeout=10s
                    </div>
                    <div className="text-emerald-400">
                      [Container Created] memory_limit=256mb cpu_limit=1.0
                    </div>
                    <div className="text-content-main pl-2 border-l-2 border-border-light py-1">
                      Optimal Minimum Cost: 7
                    </div>
                    <div className="text-content-muted text-[11px]">
                      Process exited with code 0 in 124ms (RSS: 14.8 MB)
                    </div>
                  </div>
                </div>

                {/* Live Activity Feed */}
                <div className="mt-6 pt-3 border-t border-border-subtle">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-content-secondary mb-2">
                    <MessageSquare className="w-3 h-3 text-accent-primary" />
                    Live Collaboration Stream
                  </div>
                  <div className="space-y-1.5 text-[11px] font-sans">
                    <div className="flex items-center justify-between text-content-muted">
                      <span>Alex updated matrix input</span>
                      <span className="font-mono text-[10px]">Just now</span>
                    </div>
                    <div className="flex items-center justify-between text-content-muted">
                      <span>Elena joined session</span>
                      <span className="font-mono text-[10px]">2m ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Core Product Pillars Section */}
      <section id="features" className="py-20 bg-background-secondary/50 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="accent" size="sm" className="mb-3">
              Production Capabilities
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-content-main">
              Engineered for Serious Development
            </h2>
            <p className="mt-4 text-base text-content-secondary leading-relaxed">
              Every component is built around real-world concurrency, isolated sandboxing, and non-destructive AI assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Real-time CRDT */}
            <Card hoverEffect className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-accent-primary">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-content-main font-sans">
                Real-Time CRDT Synchronization
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Conflict-free replicated data types using Yjs and y-monaco over persistent Hocuspocus WebSockets. Concurrent edits merge mathematically without race conditions.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-accent-primary">
                <span>Sub-15ms delta latency</span>
              </div>
            </Card>

            {/* Card 2: Isolated Docker Sandbox */}
            <Card hoverEffect className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-content-main font-sans">
                Docker Isolated Execution
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Untrusted code is strictly executed inside isolated ephemeral Docker containers with CPU limits, memory limits, read-only root filesystems, and disabled network access.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                <span>Python, Java, C++, Node.js</span>
              </div>
            </Card>

            {/* Card 3: AI Pair Programmer */}
            <Card hoverEffect className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-accent-secondary">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-content-main font-sans">
                AI Pair Programmer & Diff Review
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Provider-agnostic AI layer (Gemini, OpenAI, Anthropic). Explains code, generates tests, identifies edge cases, and presents non-destructive reviewable diffs.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-accent-secondary">
                <span>Accept / Reject Diffs</span>
              </div>
            </Card>

            {/* Card 4: Version Snapshots & Time Machine */}
            <Card hoverEffect className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-content-main font-sans">
                Snapshot Time Machine & Rollback
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Capture immutable project snapshots at any milestone. Compare full-tree unified diffs and restore previous workspace states with atomic transactions.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-amber-400">
                <span>Atomic Workspace Rollback</span>
              </div>
            </Card>

            {/* Card 5: Team Chat & Live Presence */}
            <Card hoverEffect className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-content-main font-sans">
                Live Cursors & Awareness
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                See collaborator cursor coordinates, line selections, and active files in real-time. Discuss implementation details with contextual team chat.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-blue-400">
                <span>Color-coded presence states</span>
              </div>
            </Card>

            {/* Card 6: Collaborative Interview Mode */}
            <Card hoverEffect className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-content-main font-sans">
                Technical Interview Mode
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Host live coding interviews with hidden test cases, countdown timers, candidate role permissions, and automated complexity evaluation.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-rose-400">
                <span>Automated Candidate Scoring</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="architecture" className="py-20 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" size="sm" className="mb-3">
              Workflow Mechanics
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-content-main">
              How CodeSync AI Operates
            </h2>
            <p className="mt-4 text-base text-content-secondary leading-relaxed">
              From the keystroke to container execution, here is the lifecycle of collaborative interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-background-panel border border-border-subtle rounded-xl p-5 relative">
              <div className="text-xs font-mono font-bold text-accent-primary mb-3">STEP 01</div>
              <h4 className="text-sm font-semibold text-content-main mb-2">Workspace Spin-Up</h4>
              <p className="text-xs text-content-secondary leading-relaxed">
                JWT-authenticated user initializes a collaborative workspace. PostgreSQL registers member roles and file tree structures.
              </p>
            </div>

            <div className="bg-background-panel border border-border-subtle rounded-xl p-5 relative">
              <div className="text-xs font-mono font-bold text-accent-secondary mb-3">STEP 02</div>
              <h4 className="text-sm font-semibold text-content-main mb-2">CRDT Delta Sync</h4>
              <p className="text-xs text-content-secondary leading-relaxed">
                Monaco Editor connects to Hocuspocus via WebSocket. Yjs merges distributed document state updates with vector clocks.
              </p>
            </div>

            <div className="bg-background-panel border border-border-subtle rounded-xl p-5 relative">
              <div className="text-xs font-mono font-bold text-emerald-400 mb-3">STEP 03</div>
              <h4 className="text-sm font-semibold text-content-main mb-2">Isolated Run Job</h4>
              <p className="text-xs text-content-secondary leading-relaxed">
                FastAPI queues an execution task. Ephemeral Docker sandbox mounts code, compiles/runs, and streams stdout/stderr back.
              </p>
            </div>

            <div className="bg-background-panel border border-border-subtle rounded-xl p-5 relative">
              <div className="text-xs font-mono font-bold text-amber-400 mb-3">STEP 04</div>
              <h4 className="text-sm font-semibold text-content-main mb-2">AI Code Diff</h4>
              <p className="text-xs text-content-secondary leading-relaxed">
                Developers ask AI for refactoring or debugging. Proposed changes render as an interactive diff with Accept/Reject controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Blueprint Table */}
      <section id="tech-stack" className="py-20 bg-background-secondary/40 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="accent" size="sm" className="mb-3">
              Standardized Stack
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-content-main">
              Architectural Specifications
            </h2>
            <p className="mt-4 text-base text-content-secondary leading-relaxed">
              Carefully chosen industry-standard primitives to ensure zero lock-in and high maintainability.
            </p>
          </div>

          <div className="bg-background-panel rounded-xl border border-border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-background-secondary border-b border-border-subtle text-content-muted font-mono uppercase">
                  <tr>
                    <th className="py-3 px-5">Tier</th>
                    <th className="py-3 px-5">Technology</th>
                    <th className="py-3 px-5">Purpose</th>
                    <th className="py-3 px-5">Phase Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-sans">
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Frontend UI</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">React 18, TypeScript, Vite, Tailwind CSS</td>
                    <td className="py-3.5 px-5 text-content-secondary">Dark-first IDE interface, Zustand state, responsive shell</td>
                    <td className="py-3.5 px-5"><Badge variant="success" size="sm">Phase 1 Configured</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Code Editor</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">Monaco Editor (@monaco-editor/react)</td>
                    <td className="py-3.5 px-5 text-content-secondary">VS Code-grade syntax highlighting, multiple tabs, formatting</td>
                    <td className="py-3.5 px-5"><Badge variant="default" size="sm">Phase 3 Integration</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Real-time CRDT</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">Yjs, y-monaco, Hocuspocus WebSocket</td>
                    <td className="py-3.5 px-5 text-content-secondary">Live cursor positions, selections, conflict-free state merge</td>
                    <td className="py-3.5 px-5"><Badge variant="default" size="sm">Phase 4 Integration</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Backend API</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">FastAPI, Python 3.12+, Pydantic v2</td>
                    <td className="py-3.5 px-5 text-content-secondary">RESTful API endpoints, JWT authentication, OpenAPI schema</td>
                    <td className="py-3.5 px-5"><Badge variant="success" size="sm">Phase 1 Online</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Persistence</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">PostgreSQL 16 + SQLAlchemy 2.0 (Alembic)</td>
                    <td className="py-3.5 px-5 text-content-secondary">Normalized models: users, workspaces, files, snapshots</td>
                    <td className="py-3.5 px-5"><Badge variant="success" size="sm">Schema Ready</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Execution Workers</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">Docker Isolated Containers (Alpine/Slim)</td>
                    <td className="py-3.5 px-5 text-content-secondary">Sandboxed execution for Python, Java, C++, JavaScript</td>
                    <td className="py-3.5 px-5"><Badge variant="default" size="sm">Phase 5 Integration</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">AI Pair Programmer</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">Modular LLM Service (Gemini / OpenAI)</td>
                    <td className="py-3.5 px-5 text-content-secondary">Explain, debug, generate, optimize, and Big-O review</td>
                    <td className="py-3.5 px-5"><Badge variant="default" size="sm">Phase 6 Integration</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 border-t border-border-subtle bg-gradient-to-b from-background-main to-background-secondary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-content-main">
            Ready for Collaborative Software Engineering?
          </h3>
          <p className="mt-3 text-sm text-content-secondary max-w-xl mx-auto">
            CodeSync AI combines the power of modern web standards, strict container security, and collaborative editing.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const ide = document.getElementById('ide-preview');
                if (ide) ide.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Test Interactive Preview
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => window.open('/docs', '_blank')}
            >
              Explore REST API
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
