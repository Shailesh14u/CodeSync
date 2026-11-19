import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  MessageSquare,
  Check,
  Split,
  Clock,
  Activity,
  Boxes,
  Workflow,
  RotateCcw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { apiService } from '../services/api';
import { HealthResponse } from '../types';
import { useAuthStore } from '../stores/authStore';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'python' | 'cpp' | 'javascript' | 'java'>('python');
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  // Interactive IDE states
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [runSuccessTimestamp, setRunSuccessTimestamp] = useState<string>('12:00:00 PM');
  const [showAiDiff, setShowAiDiff] = useState(false);
  const [codeApplied, setCodeApplied] = useState(false);

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
    setRunSuccessTimestamp(new Date().toLocaleTimeString());
  }, []);

  const baseCodeSnippets = {
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
console.log("Optimal Minimum Cost:", solveOptimalPath(matrix));`,

    java: `// CodeSync AI - OpenJDK 17 Sandbox Environment
import java.util.*;

public class Main {
    public static int solveOptimalPath(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int[] dp = new int[n];
        dp[0] = grid[0][0];
        for (int j = 1; j < n; j++) dp[j] = dp[j - 1] + grid[0][j];
        
        for (int i = 1; i < m; i++) {
            dp[0] += grid[i][0];
            for (int j = 1; j < n; j++) {
                dp[j] = Math.min(dp[j], dp[j - 1]) + grid[i][j];
            }
        }
        return dp[n - 1];
    }

    public static void main(String[] args) {
        int[][] matrix = {{1, 3, 1}, {1, 5, 1}, {4, 2, 1}};
        System.out.println("Optimal Minimum Cost: " + solveOptimalPath(matrix));
    }
}`
  };

  const optimizedCodeSnippets = {
    python: `# CodeSync AI Pair - Space-Optimized O(N) In-Place Dynamic Programming
from typing import List

def solve_optimal_path(grid: List[List[int]]) -> int:
    """Optimized: Calculates min path sum in O(M*N) time & O(N) extra space."""
    if not grid or not grid[0]:
        return 0
    m, n = len(grid), len(grid[0])
    dp = [0] * n
    dp[0] = grid[0][0]
    for j in range(1, n):
        dp[j] = dp[j - 1] + grid[0][j]
        
    for i in range(1, m):
        dp[0] += grid[i][0]
        for j in range(1, n):
            dp[j] = min(dp[j], dp[j - 1]) + grid[i][j]
            
    return dp[-1]

matrix = [[1, 3, 1], [1, 5, 1], [4, 2, 1]]
print(f"Optimal Minimum Cost: {solve_optimal_path(matrix)}")`,

    cpp: `// CodeSync AI Pair - Ultra-Fast O(N) Space Vector Buffer
#include <iostream>
#include <vector>
#include <algorithm>

int solveOptimalPath(const std::vector<std::vector<int>>& grid) {
    if (grid.empty() || grid[0].empty()) return 0;
    int m = grid.size(), n = grid[0].size();
    std::vector<int> dp(n, 0);
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

    javascript: `// CodeSync AI Pair - High Performance Typed Buffer Solution
const solveOptimalPath = (grid) => {
  if (!grid.length || !grid[0].length) return 0;
  const m = grid.length, n = grid[0].length;
  const dp = new Int32Array(n);
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
console.log("Optimal Minimum Cost:", solveOptimalPath(matrix));`,

    java: `// CodeSync AI Pair - Zero-Allocation Primitive Array Implementation
public class Main {
    public static int solveOptimalPath(int[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length, n = grid[0].length;
        int[] dp = new int[n];
        dp[0] = grid[0][0];
        for (int j = 1; j < n; j++) dp[j] = dp[j - 1] + grid[0][j];
        for (int i = 1; i < m; i++) {
            dp[0] += grid[i][0];
            for (int j = 1; j < n; j++) {
                dp[j] = Math.min(dp[j], dp[j - 1]) + grid[i][j];
            }
        }
        return dp[n - 1];
    }

    public static void main(String[] args) {
        int[][] matrix = {{1, 3, 1}, {1, 5, 1}, {4, 2, 1}};
        System.out.println("Optimal Minimum Cost: " + solveOptimalPath(matrix));
    }
}`
  };

  const handleSimulatedRun = () => {
    setIsRunningCode(true);
    setTimeout(() => {
      setIsRunningCode(false);
      setRunSuccessTimestamp(new Date().toLocaleTimeString());
    }, 600);
  };

  const handleApplyAiDiff = () => {
    setCodeApplied(true);
    setShowAiDiff(false);
    setTimeout(() => setCodeApplied(false), 3000);
  };

  const currentCode = codeApplied ? optimizedCodeSnippets[activeTab] : baseCodeSnippets[activeTab];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-accent-primary/15 to-accent-secondary/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge variant="accent" size="md" className="gap-2 px-3 py-1 bg-accent-primary/10 border-accent-primary/30">
              <Sparkles className="w-3.5 h-3.5 text-accent-primary animate-pulse" />
              <span className="font-semibold">CodeSync AI v1.0 Production Release</span>
              <span className="text-content-muted">|</span>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                All 8 Core Systems Live
              </span>
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-content-main max-w-4xl mx-auto leading-tight sm:leading-none">
            Code Together in Real Time.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary via-indigo-400 to-accent-secondary">
              Execute Safely.
            </span>{' '}
            Supercharged by AI.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-content-secondary max-w-2xl mx-auto leading-relaxed">
            The unified browser engineering platform combining Monaco Editor, mathematical Yjs CRDT synchronization, isolated Docker execution runtimes, and contextual AI pair-programming with 1-click reviewable diffs.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/dashboard')}
                className="shadow-glow-primary"
              >
                Go to Workspaces ({user?.username || 'Dashboard'})
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/register')}
                className="shadow-glow-primary"
              >
                Start Coding for Free
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const ide = document.getElementById('ide-preview');
                if (ide) ide.scrollIntoView({ behavior: 'smooth' });
              }}
              leftIcon={<Play className="w-4 h-4 text-emerald-400" />}
            >
              Test Interactive Sandbox
            </Button>

            {!isAuthenticated && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Live System Health Strip */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="bg-background-panel border border-border-subtle rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-panel">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${healthData?.status === 'healthy' ? 'bg-status-success animate-pulse' : 'bg-status-warning'}`} />
                <span className="font-medium text-content-main">API Gateway:</span>
                <span className="font-mono text-content-secondary">
                  {healthData ? `${healthData.app} v${healthData.version}` : 'Connecting...'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {latency !== null && (
                  <span className="text-content-muted font-mono">{latency}ms ping</span>
                )}
                <Badge variant={healthData?.status === 'healthy' ? 'success' : 'warning'} size="sm">
                  {healthData?.database.connected ? `DB: ${healthData.database.dialect}` : 'DB Active'}
                </Badge>
                <Badge variant="outline" size="sm" className="font-mono text-[10px] text-accent-primary">
                  CRDT Port: 1234
                </Badge>
                <button
                  onClick={fetchHealth}
                  disabled={isHealthLoading}
                  className="text-content-secondary hover:text-content-main transition-colors p-1"
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
            <div className="bg-background-secondary border-b border-border-subtle px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
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
                  codesync-live-preview
                </span>
                {codeApplied && (
                  <Badge variant="success" size="sm" className="animate-fade-in text-[10px]">
                    <Check className="w-3 h-3 mr-1" /> AI Diff Applied
                  </Badge>
                )}
              </div>

              {/* Collaborator Presence Indicator */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5 overflow-hidden">
                  <span className="inline-block w-6 h-6 rounded-full ring-2 ring-background-secondary bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center" title="You (Editor)">
                    YO
                  </span>
                  <span className="inline-block w-6 h-6 rounded-full ring-2 ring-background-secondary bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center" title="Elena (Collaborator)">
                    EL
                  </span>
                  <span className="inline-block w-6 h-6 rounded-full ring-2 ring-background-secondary bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center" title="CodeSync AI Pair">
                    AI
                  </span>
                </div>
                <Badge variant="success" size="sm" className="hidden sm:inline-flex text-[10px]">
                  3 Active Peers
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-1.5 h-7 text-xs bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500"
                  leftIcon={isRunningCode ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  onClick={handleSimulatedRun}
                  disabled={isRunningCode}
                >
                  {isRunningCode ? 'Executing...' : 'Run Code'}
                </Button>

                <Button
                  variant={showAiDiff ? 'primary' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setShowAiDiff(!showAiDiff)}
                  leftIcon={<Sparkles className="w-3 h-3 text-accent-secondary" />}
                >
                  {showAiDiff ? 'Hide AI Diff' : 'AI Review & Diff'}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-accent-primary hover:text-white"
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                  rightIcon={<ArrowRight className="w-3 h-3" />}
                >
                  Open in Full IDE
                </Button>
              </div>
            </div>

            {/* IDE Tabs */}
            <div className="flex items-center bg-background-main border-b border-border-subtle px-2 pt-1 gap-1 overflow-x-auto">
              <button
                onClick={() => { setActiveTab('python'); setShowAiDiff(false); setCodeApplied(false); }}
                className={`px-3 py-1.5 text-xs font-mono rounded-t-md flex items-center gap-2 transition-colors border-t-2 ${
                  activeTab === 'python'
                    ? 'bg-background-panel text-content-main border-accent-primary font-semibold'
                    : 'text-content-secondary hover:text-content-main border-transparent'
                }`}
              >
                <span className="text-amber-400">🐍</span> main.py
              </button>
              <button
                onClick={() => { setActiveTab('cpp'); setShowAiDiff(false); setCodeApplied(false); }}
                className={`px-3 py-1.5 text-xs font-mono rounded-t-md flex items-center gap-2 transition-colors border-t-2 ${
                  activeTab === 'cpp'
                    ? 'bg-background-panel text-content-main border-accent-primary font-semibold'
                    : 'text-content-secondary hover:text-content-main border-transparent'
                }`}
              >
                <span className="text-blue-400">⚡</span> solution.cpp
              </button>
              <button
                onClick={() => { setActiveTab('javascript'); setShowAiDiff(false); setCodeApplied(false); }}
                className={`px-3 py-1.5 text-xs font-mono rounded-t-md flex items-center gap-2 transition-colors border-t-2 ${
                  activeTab === 'javascript'
                    ? 'bg-background-panel text-content-main border-accent-primary font-semibold'
                    : 'text-content-secondary hover:text-content-main border-transparent'
                }`}
              >
                <span className="text-yellow-400">📜</span> worker.js
              </button>
              <button
                onClick={() => { setActiveTab('java'); setShowAiDiff(false); setCodeApplied(false); }}
                className={`px-3 py-1.5 text-xs font-mono rounded-t-md flex items-center gap-2 transition-colors border-t-2 ${
                  activeTab === 'java'
                    ? 'bg-background-panel text-content-main border-accent-primary font-semibold'
                    : 'text-content-secondary hover:text-content-main border-transparent'
                }`}
              >
                <span className="text-rose-400">☕</span> Main.java
              </button>
            </div>

            {/* Editor Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
              {/* Main Code Window */}
              <div className="lg:col-span-8 p-4 font-mono text-xs text-slate-300 bg-[#0E1524] overflow-x-auto relative leading-relaxed">
                {/* Floating live collaborator cursor simulation */}
                <div className="absolute top-24 left-44 z-20 pointer-events-none">
                  <div className="flex items-center gap-1 bg-purple-600 text-white text-[10px] font-sans px-1.5 py-0.5 rounded shadow">
                    Elena editing
                  </div>
                  <div className="w-0.5 h-5 bg-purple-400 animate-pulse" />
                </div>

                {/* AI Review Banner / Diff Controls if Active */}
                {showAiDiff ? (
                  <div className="mb-4 bg-background-panel/90 border border-accent-secondary/50 rounded-lg p-3 text-xs text-content-main backdrop-blur">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-semibold text-accent-secondary">
                        <Sparkles className="w-4 h-4" />
                        <span>AI Suggestion: Optimize space complexity from O(M*N) to O(N)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-6 text-[11px] bg-emerald-600 hover:bg-emerald-500"
                          onClick={handleApplyAiDiff}
                          leftIcon={<Check className="w-3 h-3" />}
                        >
                          Accept & Apply Diff
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px]"
                          onClick={() => setShowAiDiff(false)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                    <div className="text-content-secondary text-[11px]">
                      Reduced auxiliary space by 67% using a rolling 1D DP buffer. Safe to execute in production.
                    </div>
                  </div>
                ) : (
                  /* Floating AI recommendation hint */
                  <div className="absolute top-44 right-6 z-20 max-w-xs bg-background-panel/95 border border-accent-primary/40 rounded-lg p-2.5 shadow-glow-primary text-[11px] font-sans text-content-main backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-accent-secondary font-semibold mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Pair-Programmer Active
                    </div>
                    <p className="text-content-secondary text-[11px] leading-tight">
                      Click <strong className="text-white">AI Review & Diff</strong> above to preview non-destructive algorithmic refactoring.
                    </p>
                  </div>
                )}

                <pre className="select-text whitespace-pre overflow-x-auto">
                  {showAiDiff ? (
                    <div>
                      <div className="text-emerald-400 font-bold mb-1">// Proposed AI Changes (Unified Diff Preview):</div>
                      {optimizedCodeSnippets[activeTab]}
                    </div>
                  ) : (
                    currentCode
                  )}
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
                    <div className="text-emerald-400 text-[11px]">
                      [Container Created] memory_limit=256mb cpu_limit=1.0 net=none
                    </div>
                    <div className="text-content-main pl-2 border-l-2 border-emerald-500 py-1 font-semibold">
                      Optimal Minimum Cost: 7
                    </div>
                    <div className="text-content-muted text-[11px]">
                      [{runSuccessTimestamp}] Process exited with code 0 in 74ms (RSS: 12.4 MB)
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
                      <span>You ran code in container</span>
                      <span className="font-mono text-[10px]">{runSuccessTimestamp}</span>
                    </div>
                    <div className="flex items-center justify-between text-content-muted">
                      <span>Elena joined CRDT room</span>
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
              Every component is built around real-world concurrency, isolated container sandboxing, and non-destructive AI assistance.
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
                <CheckCircle2 className="w-3.5 h-3.5" />
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
                <CheckCircle2 className="w-3.5 h-3.5" />
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
                Provider-agnostic AI layer (Offline Heuristic, Gemini 1.5, OpenAI GPT). Explains code, generates unit tests, identifies edge cases, and applies changes directly.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-accent-secondary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1-Click Diff Acceptance</span>
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
                <CheckCircle2 className="w-3.5 h-3.5" />
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
                See collaborator cursor coordinates, line selections, and active files in real-time. Discuss implementation details with contextual team chat and token invites.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-blue-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
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
                Host live coding interviews with hidden test suites, countdown timers, candidate role permissions, and automated algorithmic complexity evaluation.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-rose-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Automated Candidate Scoring</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Code Execution Deep Dive Section */}
      <section id="execution" className="py-20 border-t border-border-subtle bg-background-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <Badge variant="accent" size="sm">
                Isolated Sandbox Architecture
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-content-main leading-tight">
                Multi-Language Execution Engine with Hardened Isolation
              </h2>
              <p className="text-sm text-content-secondary leading-relaxed">
                CodeSync runs code in hardened, non-root sandbox workers. Every execution spins up an ephemeral environment with strict resource limits, isolating untrusted user code from host infrastructure.
              </p>
              
              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background-panel border border-border-subtle">
                  <Cpu className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-content-main">Strict Resource Constraints:</span>
                    <span className="text-content-secondary ml-1">Hard CPU capping (1.0 core), 256MB RAM ceiling, and 10-second execution kill switch prevent runaway infinite loops or resource exhaustion.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-background-panel border border-border-subtle">
                  <Lock className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-content-main">Zero Network Access:</span>
                    <span className="text-content-secondary ml-1">Containers run with <code className="font-mono text-accent-primary">--network none</code> to eliminate socket binding, egress scans, or external data exfiltration.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-background-panel border border-border-subtle">
                  <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-content-main">Sub-100ms Cold Start:</span>
                    <span className="text-content-secondary ml-1">Pre-warmed runner pools and optimized runtime images ensure instantaneous output streaming to the Monaco bottom console.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <Badge variant="outline" size="sm">Python 3.12</Badge>
                <Badge variant="outline" size="sm">GCC 13 (C++20)</Badge>
                <Badge variant="outline" size="sm">Node.js 20 LTS</Badge>
                <Badge variant="outline" size="sm">OpenJDK 17</Badge>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-background-panel rounded-xl border border-border-subtle p-5 shadow-panel font-mono text-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle text-content-muted">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-content-main font-semibold">Sandbox Execution Spec</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    CONTAINER OK
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <p className="text-content-muted"># Runner dispatch payload</p>
                  <p className="text-accent-primary">&#123;</p>
                  <p className="pl-4 text-indigo-300">"language": <span className="text-amber-300">"python"</span>,</p>
                  <p className="pl-4 text-indigo-300">"entrypoint": <span className="text-amber-300">"main.py"</span>,</p>
                  <p className="pl-4 text-indigo-300">"limits": &#123; "memory_mb": 256, "cpu": 1.0, "timeout": 10 &#125;,</p>
                  <p className="pl-4 text-indigo-300">"security": &#123; "network": "none", "read_only": true, "user": "sandbox" &#125;</p>
                  <p className="text-accent-primary">&#125;</p>
                </div>

                <div className="p-3 rounded bg-background-main border border-border-subtle space-y-1 text-[11px]">
                  <div className="text-emerald-400">⚡ Execution Result:</div>
                  <div className="text-content-main pl-2">Optimal Minimum Cost: 7</div>
                  <div className="text-content-muted">Status: SUCCESS | Exit Code: 0 | Execution Time: 82ms</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Engine Deep Dive Section */}
      <section id="ai-assistant" className="py-20 border-t border-border-subtle bg-background-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="accent" size="sm" className="mb-3">
              Intelligent Pair Programmer
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-content-main">
              Context-Aware AI Assistant & Reviewable Diffs
            </h2>
            <p className="mt-4 text-base text-content-secondary leading-relaxed">
              Unlike generic chat tools, CodeSync AI deeply understands your active editor buffer, analyzes algorithmic efficiency, and produces clean unified diffs that you can inspect and apply in 1 click.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-accent-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-base font-semibold text-content-main">Multi-Model Flexibility</h4>
              <p className="text-xs text-content-secondary leading-relaxed">
                Connect your own Google Gemini 1.5 Pro / Flash or OpenAI GPT keys for world-class reasoning, or rely on our built-in offline heuristic synthesizer that requires zero external API keys.
              </p>
            </Card>

            <Card className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-accent-secondary">
                <Split className="w-4 h-4" />
              </div>
              <h4 className="text-base font-semibold text-content-main">Side-by-Side Diff Viewer</h4>
              <p className="text-xs text-content-secondary leading-relaxed">
                Never fear unintended code overwrites. Every AI suggestion appears in an interactive side-by-side or inline diff with highlighted additions, deletions, and risk assessments.
              </p>
            </Card>

            <Card className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-base font-semibold text-content-main">One-Click Workflows</h4>
              <p className="text-xs text-content-secondary leading-relaxed">
                Single-button actions for Explain Code, Find Bugs, Optimize Time & Space, Calculate Big-O Complexity, and Generate Pytest/Jest Unit Tests right inside your sidebar.
              </p>
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
              <h4 className="text-sm font-semibold text-content-main mb-2">AI Code Diff & Apply</h4>
              <p className="text-xs text-content-secondary leading-relaxed">
                Developers ask AI for refactoring or debugging. Proposed changes render as an interactive diff with 1-click Accept & Apply controls.
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
              Carefully chosen industry-standard primitives to ensure zero lock-in, ultra-low latency, and high maintainability.
            </p>
          </div>

          <div className="bg-background-panel rounded-xl border border-border-subtle overflow-hidden shadow-panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-background-secondary border-b border-border-subtle text-content-muted font-mono uppercase">
                  <tr>
                    <th className="py-3 px-5">Tier</th>
                    <th className="py-3 px-5">Technology</th>
                    <th className="py-3 px-5">Purpose</th>
                    <th className="py-3 px-5">Production Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-sans">
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Frontend UI</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">React 18, TypeScript, Vite, Tailwind CSS</td>
                    <td className="py-3.5 px-5 text-content-secondary">Dark-first IDE interface, Zustand state, resizable splitters</td>
                    <td className="py-3.5 px-5"><Badge variant="success" size="sm">Phase 1-8 Complete</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Code Editor</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">Monaco Editor (@monaco-editor/react)</td>
                    <td className="py-3.5 px-5 text-content-secondary">VS Code-grade syntax highlighting, multi-tab sessions, auto-formatting</td>
                    <td className="py-3.5 px-5"><Badge variant="success" size="sm">Phase 3 Operational</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Real-time CRDT</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">Yjs, y-monaco, Hocuspocus WebSocket</td>
                    <td className="py-3.5 px-5 text-content-secondary">Live cursor positions, selections, zero-conflict state merge</td>
                    <td className="py-3.5 px-5"><Badge variant="success" size="sm">Phase 4 Operational</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Backend API</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">FastAPI, Python 3.12+, Pydantic v2</td>
                    <td className="py-3.5 px-5 text-content-secondary">RESTful API endpoints, JWT authentication, OpenAPI schema</td>
                    <td className="py-3.5 px-5"><Badge variant="success" size="sm">Phase 2 Online</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Persistence</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">PostgreSQL 16 + SQLAlchemy 2.0 (Alembic)</td>
                    <td className="py-3.5 px-5 text-content-secondary">Normalized models: users, workspaces, files, snapshots</td>
                    <td className="py-3.5 px-5"><Badge variant="success" size="sm">Schema Verified</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Execution Workers</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">Docker Isolated Containers & Runners</td>
                    <td className="py-3.5 px-5 text-content-secondary">Sandboxed execution for Python, Java, C++, JavaScript</td>
                    <td className="py-3.5 px-5"><Badge variant="success" size="sm">Phase 5 Operational</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">AI Pair Programmer</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">Gemini 1.5, OpenAI GPT & Offline Synthesizer</td>
                    <td className="py-3.5 px-5 text-content-secondary">Explain, debug, optimize, Big-O, and 1-click diff application</td>
                    <td className="py-3.5 px-5"><Badge variant="success" size="sm">Phase 6 Operational</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-content-main">Time Machine</td>
                    <td className="py-3.5 px-5 font-mono text-content-secondary">Workspace Snapshot Engine</td>
                    <td className="py-3.5 px-5 text-content-secondary">Immutable version history, visual rollback, and branch recovery</td>
                    <td className="py-3.5 px-5"><Badge variant="success" size="sm">Phase 7 Operational</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-20 border-t border-border-subtle bg-gradient-to-b from-background-main to-background-secondary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge variant="accent" size="sm" className="mb-4">
            Production Ready
          </Badge>
          <h3 className="text-3xl sm:text-4xl font-bold text-content-main">
            Ready to Build Together in Real Time?
          </h3>
          <p className="mt-4 text-base text-content-secondary max-w-xl mx-auto leading-relaxed">
            Create your collaborative workspace in seconds. Invite teammates, execute untrusted code in isolated runtimes, and accelerate development with CodeSync AI.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-glow-primary"
              >
                Open Dashboard
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/register')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-glow-primary"
              >
                Create Free Account
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.open('/docs', '_blank')}
              leftIcon={<ExternalLink className="w-4 h-4 text-accent-primary" />}
            >
              Explore OpenAPI Specs
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
