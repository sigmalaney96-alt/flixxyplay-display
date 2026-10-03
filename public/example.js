// App redirect mapping
const appRedirects = {
    'n': 'https://netflix.com',
    'd': 'https://disneyplus.com',
    'yt': 'https://youtube.com',
    'flixbrowser': 'https://search.yahoo.com'
};

// Apps that show the navbar
const appsWithNavbar = ['flixbrowser'];

// Get query parameters from URL
function getQueryParam(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}

// Toggle navbar visibility based on app
function toggleNavbar(appParam) {
    const navbar = document.getElementById('navbar');
    const iframe = document.getElementById('iframeWindow');
    
    if (appsWithNavbar.includes(appParam)) {
        navbar.classList.remove('hidden');
        iframe.classList.add('with-navbar');
        iframe.classList.remove('no-navbar');
    } else {
        navbar.classList.add('hidden');
        iframe.classList.add('no-navbar');
        iframe.classList.remove('with-navbar');
    }
}

// Initialize on page load
window.addEventListener('load', () => {
    const appParam = getQueryParam('app');
    
    if (appParam && appRedirects[appParam]) {
        // Toggle navbar visibility
        toggleNavbar(appParam);
        
        // Load the specified app
        const url = appRedirects[appParam];
        document.getElementById('iframeWindow').src = __uv$config.prefix + __uv$config.encodeUrl(url);
    } else {
        // Default: hide navbar
        toggleNavbar(null);
    }
});

// Search button functionality
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

    document.getElementById('iframeWindow').src = __uv$config.prefix + __uv$config.encodeUrl(url);
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
