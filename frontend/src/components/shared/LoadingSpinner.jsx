import "./LoadingSpinner.css";

export default function LoadingSpinner({
  size = "medium",
  color = "primary",
  fullPage = false,
  className = "",
}) {
  // Construct the className string based on props
  const spinnerClassName = `
    loading-spinner 
    ${size} 
    ${color}
  `;

  return (
    <div
      className={`loading-spinner-container ${
        fullPage ? "full-page" : ""
      } ${className}`}
    >
      <div
        className={spinnerClassName.trim()}
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}
