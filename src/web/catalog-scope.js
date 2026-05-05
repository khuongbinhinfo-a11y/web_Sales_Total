(function initCatalogScope(global) {
  function normalizeToken(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function includesAny(source, terms) {
    return terms.some(function (term) {
      return source.includes(term);
    });
  }

  function getProductScope(item) {
    var appId = normalizeToken(item && item.appId);
    var id = normalizeToken(item && item.id);
    var slug = normalizeToken(item && item.slug);
    var category = normalizeToken((item && item.category) || (item && item.group) || (item && item.type));
    var href = normalizeToken((item && item.href) || (item && item.route) || (item && item.ctaHref));
    var title = normalizeToken((item && item.title) || (item && item.name));
    var haystack = [appId, id, slug, category, href, title].join(" ");

    if (
      includesAny(haystack, [
        "app-web-demo-services",
        "web-demo",
        "thiet-ke-web",
        "thiet ke web",
        "mau-demo",
        "website",
        "landing page",
        "landing"
      ])
    ) {
      return "web_design";
    }

    return "software";
  }

  function getProductScopeLabel(scope) {
    if (scope === "web_design") {
      return "Web Design";
    }
    return "Software";
  }

  global.CatalogScope = {
    getProductScope: getProductScope,
    getProductScopeLabel: getProductScopeLabel
  };
})(window);
