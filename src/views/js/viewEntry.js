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
