onkeyup = (event) => {
    const code = event.code;
    let element;
    if (code === 'ArrowLeft' || code === 'KeyA') {
        element = document.getElementById('prev');
    } else if (code === 'ArrowRight' || code === 'KeyD') {
        element = document.getElementById('next');
    } else if (code === 'KeyE') {
        element = document.getElementById('edit');
    } else if (code === 'KeyR') {
        element = document.getElementById('delete');
    }

    if (element) {
        element.click();
    }
};
