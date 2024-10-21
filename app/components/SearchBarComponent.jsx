import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "@remix-run/react";
import debounce from "lodash/debounce";

export default function SearchBar({ initialSearch }) {
  const [searched, setSearched] = useState(initialSearch || "");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleSearch = debounce((value) => {
    searchParams.set("search", value);
    searchParams.set("page", 1);
    navigate(`?${searchParams.toString()}`);
  }, 1000);

  useEffect(() => {
    handleSearch(searched);
  }, [searched]);

  const onChange = (e) => {
    const value = e.target.value;
    setSearched(value);
  };

  return (
    <input
      type="text"
      value={searched}
      onChange={onChange}
      placeholder="Search QR codes by title"
      style={{
        border: "1px solid #ccc",
        borderRadius: "10px",
        padding: "8px",
        width: "220px",
        marginBottom: "30px",
        marginLeft: "730px",
      }}
    />
  );
}
