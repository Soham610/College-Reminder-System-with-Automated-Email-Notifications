const formatDateTime = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));

const AnnouncementBoard = ({ announcements, actions }) => {
  if (!announcements.length) {
    return <div className="empty-state">No announcements have been posted yet.</div>;
  }

  return (
    <div className="announcement-list">
      {announcements.map((announcement) => (
        <article key={announcement.id} className="announcement-card">
          <div className="announcement-header">
            <h3>{announcement.title}</h3>
            <span>{formatDateTime(announcement.createdAt)}</span>
          </div>
          <p>{announcement.content}</p>
          <div className="announcement-footer">
            <small>Posted by {announcement.authorName}</small>
            {actions ? <div className="button-row compact">{actions(announcement)}</div> : null}
          </div>
        </article>
      ))}
    </div>
  );
};

export default AnnouncementBoard;
