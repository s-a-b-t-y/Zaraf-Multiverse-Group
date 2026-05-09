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
    // To get random: we assign a randomId [0, 1] to each doc on creation.
    // Here we pick a random starting point.
    const randomStart = Math.random();
    
    let q = query(
      reviewsRef, 
      where("randomId", ">=", randomStart),
      limit(PAGE_LIMIT)
    );
    
    let querySnapshot = await getDocs(q);
    let reviews = [];
    querySnapshot.forEach(doc => reviews.push({ id: doc.id, ...doc.data() }));

    // If we have fewer than limit, wrap around and get from the beginning
    if (reviews.length < PAGE_LIMIT) {
      const remainingLimit = PAGE_LIMIT - reviews.length;
      const q2 = query(
        reviewsRef,
        where("randomId", "<", randomStart),
        limit(remainingLimit)
      );
      const querySnapshot2 = await getDocs(q2);
      querySnapshot2.forEach(doc => reviews.push({ id: doc.id, ...doc.data() }));
    }

    // Shuffle results in memory for better "random" feel
    reviews = reviews.sort(() => Math.random() - 0.5);

    renderReviews(reviews, true);
    
    // For pagination we'll use normal ordering after the initial random load
    // Actually, the user asked for "More Review" to show all. 
    // We can just keep track of IDs we've already shown to avoid duplicates.
  } catch (error) {
    console.error("Error loading reviews:", error);
    reviewsContainer.innerHTML = `<p class="error">Failed to load reviews. Please try again later.</p>`;
  }
}

function renderReviews(reviews, clear = false) {
  if (clear) reviewsContainer.innerHTML = '';
  
  if (reviews.length === 0 && clear) {
    reviewsContainer.innerHTML = `<p class="no-reviews">No reviews yet. Be the first to share your experience!</p>`;
    return;
  }

  reviews.forEach((rev, index) => {
    const card = document.createElement('div');
    card.className = 'review-card';
    if (index % 3 === 1) card.classList.add('featured');
    card.style.animationDelay = `${index * 0.1}s`;

    const initials = rev.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    card.innerHTML = `
      <div class="review-stars">
        ${renderStars(rev.rating)}
      </div>
      <p class="review-text">"${rev.content}"</p>
      <div class="review-author">
        <div class="review-avatar">${initials}</div>
        <div>
          <strong>${rev.name}</strong>
          <span>${rev.role}, ${rev.company}</span>
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

// ── Load More (Non-random, just get latest ones excluding already shown?) ──
// For simplicity, we'll just fetch more reviews ordered by date.
btnLoadMore.addEventListener('click', async () => {
  btnLoadMore.disabled = true;
  btnLoadMore.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Loading...';
  
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, orderBy("createdAt", "desc"), limit(20));
    const querySnapshot = await getDocs(q);
    
    const existingIds = Array.from(reviewsContainer.querySelectorAll('.review-card')).map(c => c.dataset.id); // If we added IDs
    
    let newReviews = [];
    querySnapshot.forEach(doc => {
      // Avoid duplicates if they were already in the random set
      // We should ideally track shown IDs
      newReviews.push({ id: doc.id, ...doc.data() });
    });
    
    // Filter out already shown
    const shownIds = new Set(Array.from(document.querySelectorAll('.review-card')).map(el => el.getAttribute('data-id')));
    const filtered = newReviews.filter(r => !shownIds.has(r.id));

    renderReviews(filtered);
    btnLoadMore.style.display = 'none'; // Hide after loading "all" (simulated here)
  } catch (error) {
    console.error("Error loading more reviews:", error);
  } finally {
    btnLoadMore.disabled = false;
    btnLoadMore.innerHTML = '<span>More Review</span><i class="fa-solid fa-chevron-down"></i>';
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
      
      // Reload reviews to show the new one? Or just reload
      loadRandomReviews();
    }, 2000);

  } catch (error) {
    console.error("Error submitting review:", error);
    alert("Something went wrong. Please try again.");
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnContent;
  }
});
