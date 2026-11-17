import React from 'react';
import { Code2, Github, Terminal, Shield, Cpu, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border-subtle bg-background-secondary py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center text-white">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="font-semibold text-lg text-content-main font-sans">CodeSync AI</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Real-time collaborative cloud IDE powered by Yjs CRDTs, Monaco Editor, isolated Docker containers, and an intelligent AI pair programmer.
            </p>
            <div className="flex items-center gap-3 text-content-secondary text-xs">
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-accent-primary" />
                Isolated Sandbox
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Multi-Language
              </span>
            </div>
          </div>

          {/* Architecture Links */}
          <div>
            <h4 className="text-xs font-semibold text-content-main uppercase tracking-wider mb-3">Core Pillars</h4>
            <ul className="space-y-2 text-xs text-content-secondary">
              <li><a href="#features" className="hover:text-content-main transition-colors">CRDT State Sync</a></li>
              <li><a href="#execution" className="hover:text-content-main transition-colors">Docker Sandbox Workers</a></li>
              <li><a href="#ai-assistant" className="hover:text-content-main transition-colors">AI Contextual Diff Engine</a></li>
              <li><a href="#architecture" className="hover:text-content-main transition-colors">Hocuspocus WebSocket Mesh</a></li>
            </ul>
          </div>

          {/* Supported Languages */}
          <div>
            <h4 className="text-xs font-semibold text-content-main uppercase tracking-wider mb-3">Execution Runtimes</h4>
            <ul className="space-y-2 text-xs text-content-secondary font-mono">
              <li>Python 3.12+ (CPython)</li>
              <li>JavaScript (Node.js LTS)</li>
              <li>C++ (GCC 13 / C++20)</li>
              <li>Java (OpenJDK 21 LTS)</li>
            </ul>
          </div>

          {/* Documentation & Resources */}
          <div>
            <h4 className="text-xs font-semibold text-content-main uppercase tracking-wider mb-3">Developers</h4>
            <ul className="space-y-2 text-xs text-content-secondary">
              <li>
                <a href="/docs" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-content-main transition-colors">
                  <BookOpen className="w-3.5 h-3.5" />
                  FastAPI OpenAPI Specs
                </a>
              </li>
              <li>
                <a href="#tech-stack" className="hover:text-content-main transition-colors">
                  Architecture Blueprint
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-content-main transition-colors">
                  <Github className="w-3.5 h-3.5" />
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between text-xs text-content-muted gap-4">
          <p>© {new Date().getFullYear()} CodeSync AI. Engineered for collaborative excellence.</p>
          <div className="flex items-center gap-6">
            <span>Built with React 18, TypeScript, Tailwind, FastAPI & Monaco</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
