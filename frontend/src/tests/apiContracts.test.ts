import { describe, it, expect } from 'vitest';
import {
  AIResponse,
  InterviewSession,
  SnapshotItem,
  ChatMessage,
} from '../services/api';
import { ExecutionResponse } from '../types';

describe('Frontend API Schema Contracts', () => {
  it('validates AIResponse contract structure', () => {
    const mockAIResponse: AIResponse = {
      request_id: 'req-001',
      action: 'explain',
      explanation: 'Algorithm solves problem in linear time.',
      suggested_code: 'def test(): pass',
      reasoning: 'Clean syntax',
      risks: 'None',
      complexity: {
        time_complexity: 'O(N)',
        space_complexity: 'O(1)',
      },
      provider: 'MockAIService',
    };

    expect(mockAIResponse.request_id).toBe('req-001');
    expect(mockAIResponse.complexity?.time_complexity).toBe('O(N)');
    expect(mockAIResponse.complexity?.space_complexity).toBe('O(1)');
  });

  it('validates SnapshotItem structure', () => {
    const mockSnapshot: SnapshotItem = {
      id: 'snap-1',
      workspace_id: 'ws-1',
      name: 'v1.0 Milestone',
      description: 'Production release',
      file_count: 5,
      created_at: new Date().toISOString(),
    };

    expect(mockSnapshot.file_count).toBe(5);
    expect(mockSnapshot.name).toContain('v1.0');
  });

  it('validates ChatMessage structure', () => {
    const mockMessage: ChatMessage = {
      id: 'msg-1',
      workspace_id: 'ws-1',
      user_id: 'usr-1',
      username: 'alice',
      content: 'Hello collaborative team!',
      created_at: new Date().toISOString(),
    };

    expect(mockMessage.username).toBe('alice');
    expect(mockMessage.content).toBe('Hello collaborative team!');
  });

  it('validates InterviewSession structure', () => {
    const mockInterview: InterviewSession = {
      id: 'int-1',
      workspace_id: 'ws-1',
      title: 'Two Sum Challenge',
      description: 'Find two numbers adding to target',
      difficulty: 'Easy',
      language: 'python',
      time_limit_minutes: 45,
      test_cases: [
        { id: 1, input: '2 7 11 15\n9', expected_output: '0 1', hidden: false },
      ],
      status: 'in_progress',
      created_at: new Date().toISOString(),
    };

    expect(mockInterview.test_cases.length).toBe(1);
    expect(mockInterview.time_limit_minutes).toBe(45);
  });
});
