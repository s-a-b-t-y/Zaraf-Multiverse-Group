import { db, collection, addDoc, getDocs, query, limit, where, orderBy, serverTimestamp } from "../database/firestore.js";

// ── DOM Elements ──
const reviewsContainer = document.getElementById('reviews-container');
const btnLoadMore = document.getElementById('btn-load-more');
const reviewModalOverlay = document.getElementById('reviewModalOverlay');
const reviewForm = document.getElementById('review-form');
const starRating = document.getElementById('star-rating');
const ratingInput = document.getElementById('rev-rating');

let lastVisible = null;
const PAGE_LIMIT = 6;

// ── Initialization ──
document.addEventListener('DOMContentLoaded', () => {
  loadRandomReviews();
  setupStarRating();
  setupAutoResizeTextarea();
});

function setupAutoResizeTextarea() {
  const textarea = document.getElementById('rev-text');
  if (!textarea) return;

  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });
}


// ── Star Rating Logic ──
function setupStarRating() {
  const stars = starRating.querySelectorAll('i');
  
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.value);
      stars.forEach(s => {
        if (parseInt(s.dataset.value) <= val) s.classList.add('hover');
        else s.classList.remove('hover');
      });
    });

    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hover'));
    });

    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.value);
      ratingInput.value = val;
      stars.forEach(s => {
        if (parseInt(s.dataset.value) <= val) {
          s.classList.add('active');
          s.classList.replace('fa-regular', 'fa-solid');
        } else {
          s.classList.remove('active');
          s.classList.replace('fa-solid', 'fa-regular');
        }
      });
    });
  });
}

// ── Fetching Logic ──
async function loadRandomReviews() {
  reviewsContainer.innerHTML = `
    <div class="loading-spinner">
      <i class="fa-solid fa-circle-notch fa-spin"></i> Loading Reviews...
    </div>
  `;

  try {
    const reviewsRef = collection(db, "reviews");
    
    // Order by rating descending
    const q = query(
      reviewsRef, 
      orderBy("rating", "desc"),
      limit(PAGE_LIMIT)
    );
    
    const querySnapshot = await getDocs(q);
    let reviews = [];
    querySnapshot.forEach(doc => reviews.push({ id: doc.id, ...doc.data() }));

    renderReviews(reviews, true);
    
    // If we have fewer reviews than the limit, hide the load more button
    if (reviews.length < PAGE_LIMIT) {
      btnLoadMore.style.display = 'none';
    } else {
      btnLoadMore.style.display = 'flex';
    }
  } catch (error) {
    console.error("Error loading reviews:", error);
    reviewsContainer.innerHTML = `
      <div class="error-message">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Failed to load reviews. Please check your internet connection or try again later.</p>
      </div>
    `;
  }
}

function renderReviews(reviews, clear = false) {
  if (clear) reviewsContainer.innerHTML = '';
  
  if (reviews.length === 0 && clear) {
    reviewsContainer.innerHTML = `<p class="no-reviews">No reviews yet. Be the first to share your experience!</p>`;
    return;
  }

  reviews.forEach((rev, index) => {
    // Avoid duplicates if already rendered
    if (document.querySelector(`[data-id="${rev.id}"]`)) return;

    const card = document.createElement('div');
    card.className = 'review-card';
    card.setAttribute('data-id', rev.id);
    
    // Maintain the staggered grid look: every 2nd card in a 3-col layout is featured
    // In mobile (1-col) it just adds variety
    if (index % 3 === 1) card.classList.add('featured');
    card.style.animationDelay = `${(index % PAGE_LIMIT) * 0.1}s`;

    // Robust initials logic
    const nameParts = rev.name ? rev.name.trim().split(/\s+/) : ['U'];
    const initials = nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0][0].toUpperCase();
    
    card.innerHTML = `
      <div class="review-stars">
        ${renderStars(rev.rating)}
      </div>
      <p class="review-text">"${rev.content}"</p>
      <div class="review-author">
        <div class="review-avatar">${initials}</div>
        <div>
          <strong>${rev.name}</strong>
          <span>${rev.role}${rev.company ? ', ' + rev.company : ''}</span>
        </div>
      </div>
    `;
    reviewsContainer.appendChild(card);
  });
}

function renderStars(rating) {
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) starsHtml += '<i class="fa-solid fa-star"></i>';
    else starsHtml += '<i class="fa-regular fa-star"></i>';
  }
  return starsHtml;
}

// ── Load More (Fetch all remaining) ──
btnLoadMore.addEventListener('click', async () => {
  btnLoadMore.disabled = true;
  const originalContent = btnLoadMore.innerHTML;
  btnLoadMore.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Loading All Reviews...';
  
  try {
    const reviewsRef = collection(db, "reviews");
    // Fetch all reviews ordered by rating
    const q = query(reviewsRef, orderBy("rating", "desc"));
    const querySnapshot = await getDocs(q);
    
    let fetchedReviews = [];
    querySnapshot.forEach(doc => {
      fetchedReviews.push({ id: doc.id, ...doc.data() });
    });
    
    // Render all of them (renderReviews already handles duplicates)
    renderReviews(fetchedReviews);

    // Hide the button after loading all
    btnLoadMore.style.display = 'none';

  } catch (error) {
    console.error("Error loading more reviews:", error);
    btnLoadMore.innerHTML = '<span>Error Loading</span>';
    btnLoadMore.disabled = false;
    setTimeout(() => {
      if (btnLoadMore.style.display !== 'none') {
        btnLoadMore.innerHTML = originalContent;
      }
    }, 2000);
  }
});

// ── Modal Logic ──
window.openReviewModal = () => {
  reviewModalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeReviewModal = (e) => {
  if (e && e.target !== reviewModalOverlay && !e.target.closest('.modal-close')) return;
  reviewModalOverlay.classList.remove('active');
  document.body.style.overflow = '';
};

// ── Form Submission ──
reviewForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = reviewForm.querySelector('.btn-submit');
  const originalBtnContent = submitBtn.innerHTML;
  
  const rating = parseInt(ratingInput.value);
  if (rating === 0) {
    alert("Please select a rating!");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';

  const formData = {
    name: document.getElementById('rev-name').value,
    role: document.getElementById('rev-role').value,
    company: document.getElementById('rev-company').value,
    rating: rating,
    content: document.getElementById('rev-text').value,
    createdAt: serverTimestamp(),
    randomId: Math.random() // For random fetching
  };

  try {
    await addDoc(collection(db, "reviews"), formData);
    
    // Success UI
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Submitted Successfully!';
    submitBtn.style.background = '#22c55e';
    
    setTimeout(() => {
      closeReviewModal();
      reviewForm.reset();
      // Reset textarea height
      const textarea = document.getElementById('rev-text');
      if (textarea) textarea.style.height = 'auto';
      
      // Reset stars
      const stars = starRating.querySelectorAll('i');
      stars.forEach(s => {
        s.classList.remove('active');
        s.classList.replace('fa-solid', 'fa-regular');
      });
      ratingInput.value = "0";
      
      // Reset button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
      submitBtn.style.background = '';
      
      // Reload reviews to show the new one
      loadRandomReviews();
    }, 2000);

  } catch (error) {
    console.error("Error submitting review:", error);
    alert("Something went wrong. Please try again.");
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnContent;
  }
});
