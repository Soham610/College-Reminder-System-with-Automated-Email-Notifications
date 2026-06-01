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

const AdminMessagesPanel = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [counterpart, setCounterpart] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadContacts = async () => {
    const studentContacts = await getMessageContacts();
    setContacts(studentContacts);
    return studentContacts;
  };

  const loadThread = async (userId) => {
    if (!userId) {
      setCounterpart(null);
      setMessages([]);
      return;
    }

    const thread = await getMessageThread(userId);
    setCounterpart(thread.counterpart);
    setMessages(thread.messages);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const studentContacts = await loadContacts();
        const nextUserId = studentContacts[0]?.id ? String(studentContacts[0].id) : "";
        setSelectedUserId(nextUserId);
        await loadThread(nextUserId);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      return undefined;
    }

    const poller = window.setInterval(async () => {
      try {
        await loadThread(selectedUserId);
        await loadContacts();
      } catch (_error) {
        // Silent polling keeps the admin view responsive without noisy banners.
      }
    }, 10000);

    return () => window.clearInterval(poller);
  }, [selectedUserId]);

  const handleSelectUser = async (event) => {
    const nextUserId = event.target.value;
    setSelectedUserId(nextUserId);

    try {
      await loadThread(nextUserId);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !selectedUserId) {
      return;
    }

    setSending(true);
    try {
      const result = await sendMessage({
        recipientId: Number(selectedUserId),
        body: draft,
      });
      setDraft("");
      setCounterpart(result.counterpart || counterpart);
      setMessages((current) => [...current, result.message].filter(Boolean));
      setStatus("Your message has been sent to the selected user.");
      await loadContacts();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-panel admin-message-panel">
      {status ? <div className="status-banner compact">{status}</div> : null}

      {loading ? (
        <div className="empty-state">Loading user conversations...</div>
      ) : (
        <>
          <label className="field field-wide">
            <span>Select Student</span>
            <select value={selectedUserId} onChange={handleSelectUser}>
              <option value="">Choose a student</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} {contact.department ? `· ${contact.department}` : ""}
                </option>
              ))}
            </select>
          </label>

          {counterpart ? (
            <>
              <div className="message-panel-header">
                <div>
                  <strong>{counterpart.name}</strong>
                  <small>{counterpart.email}</small>
                </div>
                <span className="message-chip">{counterpart.department || "Student"}</span>
              </div>

              <div className="message-thread">
                {messages.length ? (
                  messages.map((message) => {
                    const isOwn = message.senderRole === "admin";
                    return (
                      <article key={message.id} className={`message-bubble ${isOwn ? "outgoing" : "incoming"}`}>
                        <strong>{isOwn ? "You" : message.senderName}</strong>
                        <p>{message.body}</p>
                        <small>{formatMessageTime(message.createdAt)}</small>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state">No messages with this student yet.</div>
                )}
              </div>

              <form className="message-compose" onSubmit={handleSend}>
                <label className="field field-wide">
                  <span>Reply to Student</span>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows="4"
                    placeholder="Write a reply, clarification, or official guidance for the selected student."
                  />
                </label>

                <div className="button-row">
                  <button type="submit" className="button-primary" disabled={sending || !selectedUserId}>
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="empty-state">Select a student to read messages and send a reply.</div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminMessagesPanel;
