onkeyup = (event) => {
    const code = event.code;
    if (code === 'ArrowLeft') {
        document.getElementById('prev').click();
    } else if (code === 'ArrowRight') {
        document.getElementById('next').click();
    }
};
