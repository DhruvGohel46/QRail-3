import React from 'react';

const Loader = ({ 
  size = 'medium', // 'small', 'medium', 'large'
  text = '',
  fullscreen = false 
}) => {
  const sizeMap = {
    small: 24,
    medium: 48,
    large: 72
  };

  const loaderContent = (
    <div className={`loader-content loader-${size}`}>
      <div className="spinner" style={{ width: sizeMap[size], height: sizeMap[size] }}></div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="loader-fullscreen">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default Loader;

// Add to your CSS:
/*
.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--md-sys-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loader-text {
  color: var(--md-sys-color-on-surface);
  font-size: 14px;
}

.loader-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
*/
