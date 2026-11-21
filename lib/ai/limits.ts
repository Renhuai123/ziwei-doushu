/** /api/interpret 与 /api/heming 的请求上限。服务端用来校验，客户端用来裁剪历史，两边共用一份。 */
export const MAX_MESSAGES = 40;
export const MAX_MESSAGE_CHARS = 8000;
export const MAX_QUESTION_CHARS = 1000;
