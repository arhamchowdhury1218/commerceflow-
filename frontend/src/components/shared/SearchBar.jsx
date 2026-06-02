import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

// Reusable search bar with clear button
// Props: value, onChange, placeholder

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2
                         w-4 h-4 text-muted-foreground"
      />
      <Input
        placeholder={placeholder || "Search..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2
                     text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
