import "../styles/chat-button.css";

function ChatButton() {
  return (
    <a
      className="chat-button"
      href="https://zalo.me/0822466800"
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