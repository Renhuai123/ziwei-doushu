import assert from 'node:assert/strict';
import { fitHistory, type HistoryMessage } from '../../lib/ai/history';
import { MAX_MESSAGE_CHARS, MAX_MESSAGES, parseMessages } from '../../lib/ai/request';

const u = (content: string): HistoryMessage => ({ role: 'user', content });
const a = (content: string): HistoryMessage => ({ role: 'assistant', content });

// 1. 一条超长回答之后再追问：裁剪后服务端照收
const longAnswer = [u('命格总览'), a('长'.repeat(MAX_MESSAGE_CHARS + 500)), u('今年适合换工作吗？')];
assert.equal(parseMessages(longAnswer).ok, false, 'untrimmed history is rejected (the bug)');
const fitted = fitHistory(longAnswer);
assert.ok(parseMessages(fitted).ok, 'trimmed history is accepted');
assert.equal(fitted[1].content.length, MAX_MESSAGE_CHARS);
assert.equal(fitted[2].content, '今年适合换工作吗？', 'the current question is kept verbatim');

// 2. 聊了很多轮：只留最近 MAX_MESSAGES 条，且从 user 开始
const long: HistoryMessage[] = [];
for (let i = 0; i < 30; i++) long.push(u(`问${i}`), a(`答${i}`));
long.push(u('最后一问'));
assert.equal(parseMessages(long).ok, false);
const recent = fitHistory(long);
assert.ok(parseMessages(recent).ok);
assert.ok(recent.length <= MAX_MESSAGES);
assert.equal(recent[0].role, 'user');
assert.equal(recent.at(-1)!.content, '最后一问');

// 3. 流式失败留下的空 assistant 占位被去掉
const withBlank = [u('命格'), a(''), u('再试一次')];
assert.equal(parseMessages(withBlank).ok, false);
assert.ok(parseMessages(fitHistory(withBlank)).ok);

// 4. 正常短对话原样通过
const short = [u('命格'), a('七杀坐命…'), u('事业呢？')];
assert.deepEqual(fitHistory(short), short);

console.log('AI history fitting passed');
