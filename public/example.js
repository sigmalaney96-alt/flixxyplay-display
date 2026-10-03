// App redirect mapping
const appRedirects = {
    'n': 'https://netflix.com',
    'd': 'https://disneyplus.com',
    'yt': 'https://youtube.com'
};

// Get query parameters from URL
function getQueryParam(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}

// Initialize on page load
window.addEventListener('load', () => {
    const appParam = getQueryParam('app');
    
    if (appParam && appRedirects[appParam]) {
        // Redirect to the specified app
        const url = appRedirects[appParam];
        document.getElementById('iframeWindow').src = __uv$config.prefix + __uv$config.encodeUrl(url);
    }
});

// Keep existing search functionality for manual input
document.getElementById("searchButton").onclick = function (event) {
    event.preventDefault();

    let url = document.getElementById("urlInput").value;
    let searchUrl = "https://www.google.com/search?q=";

    if (!url.includes(".")) {
        url = searchUrl + encodeURIComponent(url);
    } else {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
    }

    iframeWindow.src = __uv$config.prefix + __uv$config.encodeUrl(url);
};

// Makes it so you can press enter to submit
document
    .getElementById("urlInput")
    .addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById("searchButton").click();
        }
    });
