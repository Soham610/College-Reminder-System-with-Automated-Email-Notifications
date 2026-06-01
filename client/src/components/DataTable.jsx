const DataTable = ({ title, columns, rows, emptyMessage }) => (
  <article className="surface-card data-table-card">
    <div className="data-table-header">
      <h3>{title}</h3>
    </div>
    {rows.length ? (
      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id ?? `${title}-${rowIndex}`}>
                {columns.map((column) => (
                  <td key={column.key}>{row[column.key] || "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="empty-state">{emptyMessage}</div>
    )}
  </article>
);

export default DataTable;
