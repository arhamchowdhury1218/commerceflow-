// Reusable page header used on every page
// Props: title, description, children (buttons go here)

export default function PageHeader({ title, description, children }) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center
                    justify-between gap-3"
    >
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
