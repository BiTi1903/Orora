import { useEffect, useRef, useState } from "react";
import { CHAT_HISTORY_LIMIT, CHAT_MESSAGE_LIMIT, safeChatHref } from "../lib/chat";

const history = (messages) => messages.slice(-CHAT_HISTORY_LIMIT).map((m) => ({ role: m.role, content: `${m.products?.length ? `[Sản phẩm đã gợi ý theo thứ tự: ${m.products.map((p) => `${p.name} (ID ${p.id})`).join("; ")}]\n` : ""}${m.content}`.slice(0, CHAT_MESSAGE_LIMIT) }));

export default function useChatConversation(open, path) {
  const [metadata, setMetadata] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const request = useRef(null);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch("/api/chat", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      if (!controller.signal.aborted && data.settings) setMetadata(data);
    }).catch(() => {});
    return () => controller.abort();
  }, [open]);
  useEffect(() => () => request.current?.controller.abort(), []);

  const attempt = async (next) => {
    if (request.current) return;
    const pending = { controller: new AbortController() };
    request.current = pending; setSending(true); setError(null);
    const timeout = setTimeout(() => pending.controller.abort(), 28_000);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, signal: pending.controller.signal, body: JSON.stringify({ messages: history(next), path }) });
      let data;
      try { data = await response.json(); } catch { throw new Error("Chưa kết nối được trợ lý. Bạn thử lại sau nhé."); }
      if (!response.ok) throw new Error(data.message || "Chưa gửi được tin nhắn.");
      if (typeof data.answer !== "string" || !data.answer.trim()) throw new Error("Trợ lý chưa trả lời được. Bạn thử lại nhé.");
      if (request.current !== pending) return;
      const products = (Array.isArray(data.products) ? data.products : []).filter((p) => p && typeof p.name === "string" && /^\/product\/[a-z0-9-]+$/.test(p.url)).slice(0, 3);
      const links = (Array.isArray(data.links) ? data.links : []).filter((link) => link && typeof link.label === "string" && safeChatHref(link.href)).slice(0, 4);
      const suggestions = (Array.isArray(data.suggestions) ? data.suggestions : []).filter((s) => typeof s === "string" && s.trim()).slice(0, 3).map((s) => s.slice(0, 100));
      setMessages([...next, { id: crypto.randomUUID(), role: "assistant", content: data.answer.slice(0, 2400), products, links, suggestions, mode: data.mode === "ai" ? "ai" : "guided", notice: typeof data.notice === "string" ? data.notice.slice(0, 300) : "" }]);
    } catch (err) {
      if (request.current === pending) setError({ message: err.name === "AbortError" ? "Trợ lý đang phản hồi chậm. Bạn có thể thử gửi lại." : err instanceof TypeError ? "Kết nối bị gián đoạn. Bạn kiểm tra mạng rồi thử lại nhé." : err.message, messages: next });
    } finally {
      clearTimeout(timeout);
      if (request.current === pending) { request.current = null; setSending(false); }
    }
  };
  const send = (content) => {
    const text = content.trim();
    if (request.current || !text || text.length > CHAT_MESSAGE_LIMIT) return false;
    const next = [...messages, { id: crypto.randomUUID(), role: "user", content: text }];
    setMessages(next); void attempt(next); return true;
  };
  const retry = () => { if (error) void attempt(error.messages); };
  const reset = () => { request.current?.controller.abort(); request.current = null; setMessages([]); setError(null); setSending(false); };
  return { metadata, messages, sending, error, send, retry, reset };
}
