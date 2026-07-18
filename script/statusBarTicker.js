const MARQUEE_SEPARATOR = '•';

function appendSeparator(paragraph) {
    const separator = document.createElement('span');
    separator.className = 'marquee-separator';
    separator.setAttribute('aria-hidden', 'true');
    separator.textContent = MARQUEE_SEPARATOR;
    paragraph.appendChild(separator);
}

function initStatusBarMarquee(statusBar) {
    const originalParagraph = statusBar.querySelector('p');
    if (!originalParagraph) return;

    appendSeparator(originalParagraph);

    const track = document.createElement('div');
    track.className = 'marquee-track';
    statusBar.appendChild(track);
    track.appendChild(originalParagraph);

    const clone = originalParagraph.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);

    const clone2 = originalParagraph.cloneNode(true);
    clone2.setAttribute('aria-hidden', 'true');
    track.appendChild(clone2);
}

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.status-bar').forEach(initStatusBarMarquee);
});

// 마퀴는 원본 + 클론(aria-hidden) 세 개의 <p>로 이루어져 있어 트랙 안의 <p> 전체를 갱신해야 어긋나지 않는다
function updateText(html) {
    document.querySelectorAll('.status-bar .marquee-track p').forEach((paragraph) => {
        paragraph.innerHTML = html;
        appendSeparator(paragraph);
    });
}

function flash() {
    document.querySelectorAll('.status-bar').forEach((statusBar) => {
        statusBar.classList.remove('status-bar--updated');
        void statusBar.offsetWidth;
        statusBar.classList.add('status-bar--updated');
    });
}

document.addEventListener('animationend', (event) => {
    if (event.animationName === 'status-bar-flash') {
        event.target.classList.remove('status-bar--updated');
    }
});

window.StatusBarTicker = { updateText, flash };
