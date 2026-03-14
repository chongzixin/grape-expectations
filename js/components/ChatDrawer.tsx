import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, RecommendedWine } from '../types';
import { stripWinesJson } from '../utils';

interface ChatDrawerProps {
  chatOpen: boolean;
  setChatOpen: (b: boolean) => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (s: string) => void;
  chatLoading: boolean;
  chatMsg: string;
  chatMsgVisible: boolean;
  copiedIdx: number | null;
  wineFeedback: Record<string, 'thumbs_up' | 'thumbs_down'>;
  sendChat: (prefill?: string) => void;
  submitWineFeedback: (msg: ChatMessage, wine: RecommendedWine, thumbs: 'thumbs_up' | 'thumbs_down') => void;
  copyMessage: (text: string, idx: number) => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
  chatInputRef: React.RefObject<HTMLInputElement>;
}

const QUICK_PROMPTS = [
  'White for Teochew suckling pig and chai poh kway teow',
  'Light red for zichar tonight',
  'Red to pair with rendang and nasi lemak',
  'Sparkling for dim sum brunch',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MD_COMPONENTS: any = {
  strong: ({ children }: { children: React.ReactNode }) => <strong style={{ color: 'var(--gold)' }}>{children}</strong>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
};

export function ChatDrawer({
  chatOpen, setChatOpen, chatMessages, chatInput, setChatInput,
  chatLoading, chatMsg, chatMsgVisible, copiedIdx, wineFeedback,
  sendChat, submitWineFeedback, copyMessage, chatEndRef, chatInputRef,
}: ChatDrawerProps) {
  return (
    <>
      {!chatOpen && (
        <button className="sommelier-fab" onClick={() => setChatOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2h8l2 6H6L8 2z"/>
            <path d="M6 8v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/>
            <line x1="12" y1="12" x2="12" y2="18"/>
          </svg>
          Ask Sommelier
        </button>
      )}

      <div className={`ge-chat-drawer${chatOpen ? ' open' : ''}`}>
        <div className="ge-chat-drawer-drag" />
        <div className="ge-chat-drawer-hdr">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ge-chat-drawer-icon">🤵</div>
            <div>
              <div className="ge-chat-drawer-title">Your Sommelier</div>
              <div className="ge-chat-drawer-sub">Pairing advice · Cellar insights · Wine discovery</div>
            </div>
          </div>
          <button className="ge-chat-drawer-close" onClick={() => setChatOpen(false)}>×</button>
        </div>

        <div className="ge-chat-msgs">
          {chatMessages.length === 0 && (
            <div style={{ paddingBottom: 8 }}>
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-md)', fontWeight: 700, letterSpacing: 0.5, padding: '12px 0 6px' }}>
                ✦ What shall we open tonight? ✦
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p} className="ge-fbtn" style={{ fontSize: 'var(--fs-xs)' }}
                    onClick={() => { setChatInput(p); sendChat(p); }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chatMessages.map((msg, i) => {
            const displayContent = msg.role === 'assistant' ? stripWinesJson(msg.content) : msg.content;

            let beforeVerdict: string | null = null;
            let verdictBullets: string[] = [];
            if (msg.role === 'assistant' && msg.recommendedWines && msg.recommendedWines.length > 0 && msg.messageId) {
              const verdictMatch = displayContent.match(/^([\s\S]*?)\n(\*{0,2}Verdict\*{0,2}[\s\S]*)$/);
              if (verdictMatch) {
                beforeVerdict = verdictMatch[1];
                const verdictBody = verdictMatch[2];
                verdictBullets = verdictBody
                  .split('\n')
                  .slice(1)
                  .filter(l => /^\s*([•\-\*]|\d+\.)\s/.test(l));
              }
            }

            return (
              <div key={i} className={`cm ${msg.role}`}>
                <div className="cr">{msg.role === 'user' ? 'You' : '✦ Sommelier'}</div>
                <div className="cb">
                  {msg.role === 'assistant' ? (
                    beforeVerdict !== null && verdictBullets.length > 0 ? (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{beforeVerdict}</ReactMarkdown>
                        <div style={{ marginTop: 8 }}>
                          <strong style={{ color: 'var(--gold)' }}>Verdict</strong>
                          {verdictBullets.map((line, idx) => {
                            const wine = msg.recommendedWines![idx];
                            const fbKey = wine ? `${msg.messageId}:${wine.name}` : null;
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, margin: '4px 0' }}>
                                <div style={{ flex: 1 }}>
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{line}</ReactMarkdown>
                                </div>
                                {wine && fbKey && (
                                  <div className="cm-feedback" style={{ flexShrink: 0, marginTop: 2 }}>
                                    <button
                                      className={`cm-fb ${wineFeedback[fbKey] === 'thumbs_up' ? 'active' : ''}`}
                                      onClick={() => submitWineFeedback(msg, wine, 'thumbs_up')}
                                      title="Like this recommendation"
                                    >👍</button>
                                    <button
                                      className={`cm-fb ${wineFeedback[fbKey] === 'thumbs_down' ? 'active' : ''}`}
                                      onClick={() => submitWineFeedback(msg, wine, 'thumbs_down')}
                                      title="Dislike this recommendation"
                                    >👎</button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{displayContent}</ReactMarkdown>
                    )
                  ) : displayContent}
                </div>
                {msg.role === 'assistant' && (
                  <div className="cm-actions">
                    <button
                      className={`cm-copy ${copiedIdx === i ? 'copied' : ''}`}
                      onClick={() => copyMessage(displayContent, i)}
                      title="Copy to clipboard"
                    >
                      {copiedIdx === i ? 'Copied!' : '⎘'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {chatLoading && (
            <div className="cm assistant">
              <div className="cr">✦ Sommelier</div>
              <div className="cb">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="tdots"><span /><span /><span /></div>
                  <div className={`witty-msg${chatMsgVisible ? '' : ' wm-hidden'}`}>{chatMsg}</div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="ge-chat-bar">
          <input
            ref={chatInputRef}
            className="ge-ci"
            placeholder="Ask your sommelier..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
          />
          <button className="ge-cs" onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()}>
            {chatLoading ? <div className="spin" /> : '→'}
          </button>
        </div>
      </div>
    </>
  );
}

