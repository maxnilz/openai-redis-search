import React, { useState, KeyboardEvent, ChangeEvent } from "react";

interface SearchInputProps {
  onSearch: (query: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
  };

  const handleSearch = () => {
    onSearch(searchTerm);
    setSearchTerm("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onSearch(searchTerm);
      setSearchTerm("");
    }
  };

  return (
    <div className="row">
      <div className="col-md-9">
        <input
          className="form-control"
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="col-md-1">
        <button className="btn btn-primary" onClick={handleSearch}>
          Search
        </button>
      </div>
    </div>
  );
};

export default SearchInput;
