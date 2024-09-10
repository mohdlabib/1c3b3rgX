(function () {
    let isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    let isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    let scrollbarDiv = document.querySelector('.scrollbar');
    if (!isChrome && !isSafari) {
        scrollbarDiv.innerHTML = 'You need Webkit browser to run this code';
    }
})();

function formatTitle(text) {
    if (text.length > 44) {
        return text.substring(0, 23) + '<br>' + text.substring(23, 44) + '...';
    } else if (text.length > 24) {
        return text.substring(0, 23) + '<br>' + text.substring(23);
    } else {
        return text;
    }
}

function backLink() {
    sessionStorage.setItem('linkBefore', window.location.href);
}
