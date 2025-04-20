// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

  // Configuration
  const pauseDuration = 3.5; // Seconds to wait before switching
  const typingSpeed = 0.05; // Time between each character typed
  const deletingSpeed = 0.03; // Time between each character deleted
  const initialDelay = 0.5; // Delay before starting to type

  // Select all headings with the class
  const headings = gsap.utils.toArray('.rotate-h1');
  let currentIndex = 0;

  // Store the original text for each heading
  const originalTexts = headings.map(heading => heading.textContent);
  
  // Prepare all headings
  headings.forEach((heading, index) => {
    // Create text container span
    const textSpan = document.createElement('span');
    textSpan.className = 'typing-text';
    
    // Create cursor element
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '|';
    
    // Clear original heading content
    heading.textContent = '';
    
    // Add both elements to heading
    heading.appendChild(textSpan);
    heading.appendChild(cursor);
    
    // Initial setup - first heading visible, others hidden
    if (index === 0) {
      gsap.set(heading, { autoAlpha: 1 });
      // Start with empty text for the first heading too
      textSpan.textContent = '';
    } else {
      gsap.set(heading, { autoAlpha: 0 });
    }
    
    // Setup blinking cursor for all headings
    gsap.to(cursor, {opacity: 0, duration: 0.5, repeat: -1, yoyo: true});
  });

  function typeHeading(heading, text, onComplete) {
    const tl = gsap.timeline({onComplete});
    const textSpan = heading.querySelector('.typing-text');
    
    // Type each character one by one
    for (let i = 0; i < text.length; i++) {
      tl.add(() => {
        textSpan.textContent = text.substring(0, i + 1);
      }, i * typingSpeed);
    }
    
    return tl;
  }

  function deleteHeading(heading, onComplete) {
    const tl = gsap.timeline({onComplete});
    const textSpan = heading.querySelector('.typing-text');
    const text = textSpan.textContent;
    
    // Delete each character one by one
    for (let i = text.length; i >= 0; i--) {
      tl.add(() => {
        textSpan.textContent = text.substring(0, i);
      }, (text.length - i) * deletingSpeed);
    }
    
    return tl;
  }

  function cycleHeadings() {
    const currentHeading = headings[currentIndex];
    const nextIndex = (currentIndex + 1) % headings.length;
    const nextHeading = headings[nextIndex];
    
    // First delete the current heading text
    deleteHeading(currentHeading, () => {
      // Hide current heading, show next heading
      gsap.set(currentHeading, { autoAlpha: 0 });
      gsap.set(nextHeading, { autoAlpha: 1 });
      
      // Start typing the next heading
      typeHeading(nextHeading, originalTexts[nextIndex], () => {
        // After typing completes, pause before next cycle
        gsap.delayedCall(pauseDuration, cycleHeadings);
      });
    });
    
    // Update the current index for the next cycle
    currentIndex = nextIndex;
  }

  // Start with typing the first heading
  typeHeading(headings[0], originalTexts[0], () => {
    // After first heading is typed, wait and then start the cycle
    gsap.delayedCall(pauseDuration, cycleHeadings);
  });

}); 