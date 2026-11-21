import { MAX_MESSAGE_CHARS, MAX_MESSAGES } from './limits';

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * 把对话历史裁到服务端肯收的范围：最多 MAX_MESSAGES 条、每条不超过 MAX_MESSAGE_CHARS 字，
 * 且从 user 开始（provider 要求），并去掉空消息。保留最近的消息；最后一条是当前提问，原样保留。
 * 不裁的话，一条长回答或聊得久一点就会让之后每次追问都 400。
 */
export function fitHistory(messages: HistoryMessage[]): HistoryMessage[] {
  // 流式失败会留下空的 assistant 占位，服务端不收空内容
  const clipped = messages.filter(m => m.content.trim()).slice(-MAX_MESSAGES).map((m, i, all) =>
    i === all.length - 1 || m.content.length <= MAX_MESSAGE_CHARS
      ? m
      : { ...m, content: m.content.slice(0, MAX_MESSAGE_CHARS - 1) + '…' });
  const firstUser = clipped.findIndex(m => m.role === 'user');
  return firstUser <= 0 ? clipped : clipped.slice(firstUser);
}
