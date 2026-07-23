import React, { useState, useEffect, useRef } from "react";
import "./SearchableInput.css";

interface SearchableInputProps {
    initialValue: string;
    onClick: (value: string) => void;
    onChange: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
    className?: string;
}

/**
 * searchable input component with filtered dropdown suggestions.
 *
 * allows freeform text entry while showing matching suggestions from a list.
 * suggestions are filtered by case-insensitive substring match.
 */
export function SearchableInput({
    initialValue,
    onClick,
    onChange,
    suggestions,
    placeholder,
    className,
}: SearchableInputProps): React.ReactElement {
    const [value, setValue] = useState<string>(initialValue);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // sync internal value with initialValue prop
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    // filter suggestions based on current value
    const filteredSuggestions = value.trim() === ""
        ? suggestions
        : suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()));

    // close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSelectedIndex(-1);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleInputChange(newValue: string) {
        setValue(newValue);
        onChange(newValue);
        setIsOpen(true);
        setSelectedIndex(-1);
    }

    function handleSuggestionClick(suggestion: string) {
        setValue(suggestion);
        onChange(suggestion);
        onClick(suggestion);
        setIsOpen(false);
        setSelectedIndex(-1);
    }

    function handleKeyDown(event: React.KeyboardEvent) {
        if (!isOpen && filteredSuggestions.length > 0 && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            setIsOpen(true);
            return;
        }

        if (!isOpen) return;

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                event.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                event.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
                    const selected = filteredSuggestions[selectedIndex];
                    handleSuggestionClick(selected);
                }
                break;
            case "Escape":
                event.preventDefault();
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
        }
    }

    return (
        <div ref={containerRef} className={`searchable-input ${className ?? ""}`}>
            <input
                type="text"
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="searchable-input-field"
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                aria-controls="searchable-input-listbox"
            />
            {isOpen && filteredSuggestions.length > 0 && (
                <ul
                    id="searchable-input-listbox"
                    className="searchable-input-dropdown"
                    role="listbox"
                >
                    {filteredSuggestions.map((suggestion, index) => (
                        <li
                            key={suggestion}
                            className={`searchable-input-option ${
                                index === selectedIndex ? "selected" : ""
                            }`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            role="option"
                            aria-selected={index === selectedIndex}
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

