const currentNavbarScript =
  document.currentScript ||
  Array.from(document.scripts).find((script) =>
    script.src.endsWith("/scripts/navbar.js") || script.src.endsWith("scripts/navbar.js")
  );
const navbarScriptUrl = new URL(
  currentNavbarScript?.src || "scripts/navbar.js",
  window.location.href
);
const siteRootUrl = new URL("../", navbarScriptUrl);
const isFileProtocol = siteRootUrl.protocol === "file:";
const navbarCssHref = new URL("components/navbar.css", siteRootUrl).href;
const navbarHtmlHref = new URL("components/navbar.html", siteRootUrl).href;
const navbarRoots = Array.from(document.querySelectorAll("[data-navbar-root]"));

const pageMap = {
  "": "home",
  "/": "home",
  "index": "home",
  "index.html": "home",
  "index-lab.html": "home",
  "servizi": "servizi",
  "chi-sono": "chi-sono",
  "faq": "faq",
  "contatti": "contatti",
  "scadenzapp": "scadenzapp",
};

let navbarMarkupPromise;

const hrefFromSiteRoot = (path) => new URL(path, siteRootUrl).href;

const getPageHref = (slug) => {
  if (!slug) {
    return isFileProtocol
      ? hrefFromSiteRoot("index.html")
      : hrefFromSiteRoot("");
  }

  return isFileProtocol
    ? hrefFromSiteRoot(`${slug}/index.html`)
    : hrefFromSiteRoot(slug);
};

const ensureNavbarStyles = () => {
  if (document.querySelector('link[data-navbar-styles="true"]')) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = navbarCssHref;
  link.dataset.navbarStyles = "true";
  document.head.append(link);
};

const inferCurrentPage = () => {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const slug = pathname === "/" ? "/" : pathname.split("/").pop() || "";
  return pageMap[slug] || "";
};

const getNavbarMarkup = async () => {
  if (!navbarMarkupPromise) {
    navbarMarkupPromise = fetch(navbarHtmlHref).then((response) => {
      if (!response.ok) {
        throw new Error(`Navbar fetch failed: ${response.status}`);
      }

      return response.text();
    });
  }

  return navbarMarkupPromise;
};

const setActiveNavItem = (root, currentPage) => {
  const links = Array.from(root.querySelectorAll(".nav-links a[data-nav-page]"));
  const pageHrefMap = {
    home: getPageHref(""),
    servizi: getPageHref("servizi"),
    "chi-sono": getPageHref("chi-sono"),
    faq: getPageHref("faq"),
    contatti: getPageHref("contatti"),
  };

  links.forEach((link) => {
    link.href = pageHrefMap[link.dataset.navPage] || link.href;
    const isActive = link.dataset.navPage === currentPage;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const configureHomeLink = (root, currentPage) => {
  const homeLink = root.querySelector('[data-nav-page="home"]');

  if (!homeLink) {
    return;
  }

  const hasHomeSection = Boolean(document.querySelector("#home"));
  homeLink.setAttribute(
    "href",
    currentPage === "home" && hasHomeSection
      ? "#home"
      : isFileProtocol
        ? hrefFromSiteRoot("index.html#home")
        : hrefFromSiteRoot("#home")
  );
};

const initMobileMenu = (root) => {
  const nav = root.querySelector(".nav");
  const navToggle = root.querySelector(".nav-toggle");
  const primaryNavigation = root.querySelector("#primary-navigation");
  const primaryNavigationLinks = Array.from(root.querySelectorAll(".nav-links a"));

  if (!nav || !navToggle || !primaryNavigation) {
    return;
  }

  const closeMobileMenu = () => {
    nav.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Apri il menu di navigazione");
  };

  const openMobileMenu = () => {
    nav.classList.add("menu-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Chiudi il menu di navigazione");
  };

  navToggle.addEventListener("click", () => {
    if (nav.classList.contains("menu-open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  primaryNavigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target)) {
      closeMobileMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) {
      closeMobileMenu();
    }
  });
};

const initNavbarRoot = async (root) => {
  try {
    const markup = await getNavbarMarkup();
    root.innerHTML = markup;
    const logo = root.querySelector(".nav-logo");

    if (logo) {
      logo.src = hrefFromSiteRoot("assets/logo-martina-ria.webp");
    }

    const currentPage = root.dataset.currentPage || inferCurrentPage();
    configureHomeLink(root, currentPage);
    setActiveNavItem(root, currentPage);
    initMobileMenu(root);
  } catch (error) {
    console.error("Unable to load shared navbar.", error);
  }
};

const mountSharedNavbar = () => {
  ensureNavbarStyles();
  navbarRoots.forEach((root) => {
    initNavbarRoot(root);
  });
};

if (navbarRoots.length) {
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", () => {
      mountSharedNavbar();
    });
  } else {
    mountSharedNavbar();
  }
}
