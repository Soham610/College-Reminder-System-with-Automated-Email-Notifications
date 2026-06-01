import { useEffect, useState } from "react";
import { getMessageContacts, getMessageThread, sendMessage } from "../services/messageService";

const formatMessageTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "";

const StudentMessagesPanel = ({ currentUser }) => {
  const [officials, setOfficials] = useState([]);
  const [counterpart, setCounterpart] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadPanel = async () => {
      try {
        const contacts = await getMessageContacts();
        setOfficials(contacts);
        const thread = await getMessageThread(contacts[0]?.id);
        setCounterpart(thread.counterpart);
        setMessages(thread.messages);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadPanel();
  }, []);

  useEffect(() => {
    if (!counterpart?.id) {
      return undefined;
    }

    const poller = window.setInterval(async () => {
      try {
        const thread = await getMessageThread(counterpart.id);
        setCounterpart(thread.counterpart);
        setMessages(thread.messages);
      } catch (_error) {
        // Keep polling silent so the panel stays calm.
      }
    }, 10000);

    return () => window.clearInterval(poller);
  }, [counterpart?.id]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !counterpart?.id) {
      return;
    }

    setSending(true);
    try {
      const result = await sendMessage({
        recipientId: counterpart.id,
        body: draft,
      });
      setDraft("");
      setCounterpart(result.counterpart || counterpart);
      setMessages((current) => [...current, result.message].filter(Boolean));
      setStatus("Your message has been sent to the officials.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-panel">
      {status ? <div className="status-banner compact">{status}</div> : null}

      <div className="message-panel-header">
        <div>
          <strong>{counterpart?.name || "Administration Desk"}</strong>
          <small>{counterpart?.department || "Administration"}</small>
        </div>
        <span className="message-chip">{officials.length} official{officials.length === 1 ? "" : "s"}</span>
      </div>

      {loading ? (
        <div className="empty-state">Loading official messages...</div>
      ) : (
        <>
          <div className="message-thread">
            {messages.length ? (
              messages.map((message) => {
                const isOwn = Number(message.senderId) === Number(currentUser?.id);
                return (
                  <article key={message.id} className={`message-bubble ${isOwn ? "outgoing" : "incoming"}`}>
                    <strong>{isOwn ? "You" : message.senderName}</strong>
                    <p>{message.body}</p>
                    <small>{formatMessageTime(message.createdAt)}</small>
                  </article>
                );
              })
            ) : (
              <div className="empty-state">No messages yet. Reach out to the officials here.</div>
            )}
          </div>

          <form className="message-compose" onSubmit={handleSend}>
            <label className="field field-wide">
              <span>Message to Officials</span>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows="4"
                placeholder="Ask about deadlines, classes, timetable changes, or any official help you need."
              />
            </label>

            <div className="button-row">
              <button type="submit" className="button-primary" disabled={sending || !counterpart?.id}>
                {sending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default StudentMessagesPanel;
