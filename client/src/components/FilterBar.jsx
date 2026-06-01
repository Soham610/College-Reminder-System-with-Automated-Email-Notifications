const defaultCategories = [
  { value: "", label: "All Types" },
  { value: "class", label: "Classes" },
  { value: "exam", label: "Exams" },
  { value: "study", label: "Study" },
  { value: "goal", label: "Goals" },
  { value: "club", label: "Clubs" },
];

const FilterBar = ({
  searchValue,
  onSearchChange,
  categoryValue,
  onCategoryChange,
  dateValue,
  onDateChange,
  categories = defaultCategories,
  hideCategory = false,
}) => (
  <div className="filter-bar">
    <label className="field">
      <span>Search</span>
      <input
        type="search"
        placeholder="Search title, details, or location"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </label>

    {!hideCategory ? (
      <label className="field">
        <span>Category</span>
        <select value={categoryValue} onChange={(event) => onCategoryChange(event.target.value)}>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
    ) : null}

    <label className="field">
      <span>Date</span>
      <input type="date" value={dateValue} onChange={(event) => onDateChange(event.target.value)} />
    </label>
  </div>
);

export default FilterBar;
