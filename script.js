// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // First check if the rotating headings exist on this page
  const headings = gsap.utils.toArray('.rotate-h1');
  
  // Only run the animation code if headings exist
  if (headings.length > 0) {
    // Configuration
    const pauseDuration = 3.5; // Seconds to wait before switching
    const typingSpeed = 0.05; // Time between each character typed
    const deletingSpeed = 0.03; // Time between each character deleted
    
    let currentIndex = 0;

    // Store the original text for each heading
    const originalTexts = headings.map(heading => heading.textContent);
    
    // Pre-calculate dimensions to prevent layout shifts
    const calculateMaxWidth = () => {
      let maxWidth = 0;
      // Create a hidden element to measure text width
      const measurer = document.createElement('span');
      measurer.style.visibility = 'hidden';
      measurer.style.position = 'absolute';
      measurer.style.whiteSpace = 'nowrap';
      document.body.appendChild(measurer);
      
      // Find the widest text
      originalTexts.forEach(text => {
        measurer.textContent = text;
        maxWidth = Math.max(maxWidth, measurer.offsetWidth);
      });
      
      document.body.removeChild(measurer);
      return maxWidth + 20; // Add a small buffer
    };
    
    // Set fixed width to prevent layout shifts
    const maxWidth = calculateMaxWidth();
    headings.forEach(heading => {
      heading.style.minWidth = `${maxWidth}px`;
      heading.style.display = 'inline-block';
    });
    
    // Initialize elements efficiently
    const setupElements = () => {
      // Create a single reusable cursor element
      const cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      cursor.textContent = '|';
      
      headings.forEach((heading, index) => {
        // Create text container span
        const textSpan = document.createElement('span');
        textSpan.className = 'typing-text';
        
        // Clear original heading content
        heading.textContent = '';
        
        // Add text span
        heading.appendChild(textSpan);
        
        // Only add cursor to the active heading to reduce DOM elements
        if (index === 0) {
          const headingCursor = cursor.cloneNode(true);
          heading.appendChild(headingCursor);
          // Setup blinking cursor animation once
          gsap.to(headingCursor, {opacity: 0, duration: 0.5, repeat: -1, yoyo: true});
        }
        
        // Initial visibility
        gsap.set(heading, { autoAlpha: index === 0 ? 1 : 0 });
      });
    };
    
    setupElements();

    // Optimize the typing animation to use fewer operations
    function typeHeading(heading, text, onComplete) {
      const textSpan = heading.querySelector('.typing-text');
      const tl = gsap.timeline({onComplete});
      
      // Use fewer timeline operations by grouping characters (batch operations)
      const batchSize = 3; // Process characters in batches of 3
      const batches = Math.ceil(text.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const endIndex = Math.min((i + 1) * batchSize, text.length);
        tl.add(() => {
          textSpan.textContent = text.substring(0, endIndex);
        }, i * (typingSpeed * batchSize));
      }
      
      return tl;
    }

    // Similarly optimize the delete function
    function deleteHeading(heading, onComplete) {
      const textSpan = heading.querySelector('.typing-text');
      const tl = gsap.timeline({onComplete});
      const text = textSpan.textContent;
      
      // Use fewer timeline operations by grouping character deletions
      const batchSize = 3; 
      const batches = Math.ceil(text.length / batchSize);
      
      for (let i = batches - 1; i >= 0; i--) {
        const endIndex = Math.max(0, i * batchSize);
        tl.add(() => {
          textSpan.textContent = text.substring(0, endIndex);
        }, (batches - i) * (deletingSpeed * batchSize));
      }
      
      return tl;
    }

    // Switch cursors efficiently to avoid creating/destroying DOM elements
    function moveCursor(fromHeading, toHeading) {
      const cursor = fromHeading.querySelector('.typing-cursor');
      if (cursor) {
        fromHeading.removeChild(cursor);
        toHeading.appendChild(cursor);
      }
    }

    // Create a complete master timeline
    function cycleHeadings() {
      const currentHeading = headings[currentIndex];
      const nextIndex = (currentIndex + 1) % headings.length;
      const nextHeading = headings[nextIndex];
      
      // First delete the current heading text
      deleteHeading(currentHeading, () => {
        // Hide current heading, show next heading
        gsap.set(currentHeading, { autoAlpha: 0 });
        gsap.set(nextHeading, { autoAlpha: 1 });
        
        // Move cursor to next heading
        moveCursor(currentHeading, nextHeading);
        
        // Start typing the next heading
        typeHeading(nextHeading, originalTexts[nextIndex], () => {
          // After typing completes, pause before next cycle
          gsap.delayedCall(pauseDuration, () => {
            // Update the current index for the next cycle
            currentIndex = nextIndex;
            cycleHeadings();
          });
        });
      });
    }

    // Start with typing the first heading
    typeHeading(headings[0], originalTexts[0], () => {
      // After first heading is typed, wait and then start the cycle
      gsap.delayedCall(pauseDuration, cycleHeadings);
    });

    function setupIntersectionObserver() {
      // Get the element containing your animations
      const animationContainer = document.querySelector('.rotate-h1');
      
      // Only setup observer if element exists
      if (animationContainer) {
        // Create an observer
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // Element is visible, resume animation
              gsap.ticker.wake();
            } else {
              // Element is not visible, pause animation to save resources
              gsap.ticker.sleep();
            }
          });
        }, {
          threshold: 0.1 // Trigger when at least 10% visible
        });
        
        // Start observing
        observer.observe(animationContainer);
      }
    }

    // Call the function after your animation is set up
    setupIntersectionObserver();
  }
}); 