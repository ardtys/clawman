/**
 * Moltbook Integration for CLAWMAN
 *
 * Moltbook is a social network for AI agents.
 * Agent: ClawManArcade
 * Profile: https://moltbook.com/u/ClawManArcade
 */

const MOLTBOOK_API_BASE = 'https://www.moltbook.com/api/v1';

interface MoltbookConfig {
  apiKey: string;
  agentId: string;
  agentName: string;
}

interface MoltbookPost {
  title: string;
  content: string;
  submolt?: string;
}

interface MoltbookComment {
  postId: string;
  content: string;
}

function getConfig(): MoltbookConfig {
  const apiKey = process.env.MOLTBOOK_API_KEY;
  const agentId = process.env.MOLTBOOK_AGENT_ID;
  const agentName = process.env.MOLTBOOK_AGENT_NAME;

  if (!apiKey || !agentId || !agentName) {
    throw new Error('Moltbook configuration missing. Check .env.local');
  }

  return { apiKey, agentId, agentName };
}

async function moltbookRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
): Promise<Response> {
  const config = getConfig();

  const response = await fetch(`${MOLTBOOK_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response;
}

export async function checkAgentStatus(): Promise<{
  claimed: boolean;
  verified: boolean;
  karma: number;
}> {
  const response = await moltbookRequest('/agents/status');
  return response.json();
}

export async function createPost(post: MoltbookPost): Promise<{ success: boolean; postId?: string }> {
  const response = await moltbookRequest('/posts', 'POST', {
    title: post.title,
    content: post.content,
    submolt: post.submolt || 'gaming',
  });
  return response.json();
}

export async function createComment(comment: MoltbookComment): Promise<{ success: boolean }> {
  const response = await moltbookRequest(`/posts/${comment.postId}/comments`, 'POST', {
    content: comment.content,
  });
  return response.json();
}

export async function getFeed(sort: 'hot' | 'new' | 'top' = 'hot'): Promise<unknown[]> {
  const response = await moltbookRequest(`/feed?sort=${sort}`);
  const data = await response.json();
  return data.posts || [];
}

export async function heartbeat(): Promise<{ ok: boolean; notifications?: unknown[] }> {
  const response = await moltbookRequest('/agents/heartbeat', 'POST');
  return response.json();
}

export async function shareGameScore(playerName: string, score: number, level: number): Promise<void> {
  const config = getConfig();

  await createPost({
    title: `New CLAWMAN High Score: ${score} points!`,
    content: `Player "${playerName}" just achieved ${score} points on level ${level} in CLAWMAN - the retro arcade crab harvester game!\n\nPlay now and try to beat this score!`,
    submolt: 'gaming',
  });
}

export const MOLTBOOK_PROFILE_URL = 'https://moltbook.com/u/ClawManArcade';
export const MOLTBOOK_CLAIM_URL = 'https://moltbook.com/claim/moltbook_claim_HYw_YgFjGsjd3WzE2s3HUm8gsv4pF-E_';
