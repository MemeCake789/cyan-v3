(function () {
  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-6FBQ0CLQN0";
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", "G-6FBQ0CLQN0", {
    page_path: location.pathname,
    cookie_flags: "SameSite=None;Secure",
  });

  console.log("Analytics initialized for: " + location.pathname);
})();
