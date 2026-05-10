// Charming animation for the success rate wrapper
document.addEventListener("DOMContentLoaded", () => {
  const successSection = document.querySelector('.success-rate-section');
  if (successSection) {
    // Add floating particles
    for (let i = 0; i < 20; i++) {
      let particle = document.createElement('div');
      particle.className = 'success-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 5 + 's';
      particle.style.animationDuration = (Math.random() * 5 + 5) + 's';
      successSection.appendChild(particle);
    }
  }

  // Handle Chairman Image Loading
  const chairmanImg = document.getElementById('chairmanImg');
  const chairmanWrap = document.querySelector('.chairman-img-wrap');

  function handleImgLoad() {
    if (chairmanWrap) chairmanWrap.classList.remove('loading');
    if (chairmanImg) chairmanImg.classList.add('loaded');
  }

  if (chairmanImg) {
    if (chairmanImg.complete) {
      handleImgLoad();
    } else {
      chairmanImg.addEventListener('load', handleImgLoad);
    }
  }
});
