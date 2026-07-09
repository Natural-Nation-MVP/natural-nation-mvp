function polishBuildStudioMetrics() {
  document.querySelectorAll('.metric span').forEach((label) => {
    if (label.textContent.trim() === 'R') label.textContent = 'Release';
  });
}

polishBuildStudioMetrics();
setTimeout(polishBuildStudioMetrics, 250);
setTimeout(polishBuildStudioMetrics, 900);
