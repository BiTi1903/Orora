import "../styles/chat-button.css";
import useHomeContent from "../hooks/useHomeContent";
import { contactLinks } from "../lib/contact";

function ChatButton() {
  const home = useHomeContent();
  const { zalo } = contactLinks(home);
  if (!zalo) return null;
  return (
    <a
      className="chat-button"
      href={zalo}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat với chúng tôi"
    >
      <span className="chat-icon">💬</span>
      <span className="chat-text">Chat với chúng tôi</span>
    </a>
  );
}

export default ChatButton;