import React from "react";
import "./style.css";

const LoadingSpinner = ({
  size = "medium",
  message = "",
  overlay = false,
  color = "primary",
  className = "",
}) => {
  const spinnerClasses = [
    "loading-spinner",
    `loading-spinner--${size}`,
    `loading-spinner--${color}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <div
      className={`loading-spinner-container ${
        overlay ? "loading-spinner-container--overlay" : ""
      }`}
    >
      <div className={spinnerClasses}>
        <div className="loading-spinner__circle"></div>
      </div>
      {message && <div className="loading-spinner__message">{message}</div>}
    </div>
  );

  if (overlay) {
    return <div className="loading-spinner-overlay">{content}</div>;
  }

  return content;
};

export default LoadingSpinner;
