onkeyup = (event) => {
    const code = event.code;
    let element;
    if (code === 'ArrowLeft') {
        element = document.getElementById('prev');
    } else if (code === 'ArrowRight') {
        element = document.getElementById('next');
    }

    if (element) {
        element.click();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".toggle-button").forEach((button) => {
      let showLongRanges = false;
  
      button.addEventListener("click", () => {
        showLongRanges = !showLongRanges;
        button.textContent = showLongRanges ? "Hide Longer Ranges" : "Show Longer Ranges";
  
        const rangeList = button.nextElementSibling;
        rangeList.querySelectorAll("[data-long-range='true']").forEach((range) => {
          range.style.display = showLongRanges ? "list-item" : "none";
        });
      });
  
      // Initially hide long ranges
      button.nextElementSibling.querySelectorAll("[data-long-range='true']").forEach((range) => {
        range.style.display = "none";
      });
    });
  });
  