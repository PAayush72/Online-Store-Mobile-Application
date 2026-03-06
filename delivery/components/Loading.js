function createLoadingDots() {
  const loadingContainer = document.createElement('div');
  loadingContainer.className = 'loading-dots';

  // Create 4 dots
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    loadingContainer.appendChild(dot);
  }

  return loadingContainer;
}

function showLoading(parentElement) {
  const loadingElement = createLoadingDots();
  parentElement.appendChild(loadingElement);
  return loadingElement;
}

function hideLoading(loadingElement) {
  if (loadingElement && loadingElement.parentNode) {
    loadingElement.parentNode.removeChild(loadingElement);
  }
}

export { showLoading, hideLoading }; 