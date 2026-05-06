(function initCatalogScope(global) {
  var PRODUCT_SCOPE = {
    SOFTWARE: "software",
    WEB_DESIGN_CONSULTING: "web_design_consulting",
    QUICK_WEB_TEMPLATE_PRODUCT: "quick_web_template_product",
    LEGACY_WEB_DESIGN: "web_design"
  };

  function normalizeToken(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function normalizeScopeValue(value) {
    var normalized = normalizeToken(value);
    if (!normalized) return "";

    if (normalized === PRODUCT_SCOPE.SOFTWARE) return PRODUCT_SCOPE.SOFTWARE;
    if (normalized === PRODUCT_SCOPE.WEB_DESIGN_CONSULTING) return PRODUCT_SCOPE.WEB_DESIGN_CONSULTING;
    if (normalized === PRODUCT_SCOPE.QUICK_WEB_TEMPLATE_PRODUCT) return PRODUCT_SCOPE.QUICK_WEB_TEMPLATE_PRODUCT;
    if (normalized === PRODUCT_SCOPE.LEGACY_WEB_DESIGN) return PRODUCT_SCOPE.WEB_DESIGN_CONSULTING;

    return "";
  }

  function includesAny(source, terms) {
    return terms.some(function (term) {
      return source.includes(term);
    });
  }

  function getProductScope(item) {
    var explicitScope = normalizeScopeValue((item && item.productScope) || (item && item.scope));
    if (explicitScope) {
      return explicitScope;
    }

    var appId = normalizeToken(item && item.appId);
    var id = normalizeToken(item && item.id);
    var slug = normalizeToken(item && item.slug);
    var category = normalizeToken((item && item.category) || (item && item.group) || (item && item.type));
    var href = normalizeToken((item && item.href) || (item && item.route) || (item && item.ctaHref));
    var title = normalizeToken((item && item.title) || (item && item.name));
    var haystack = [appId, id, slug, category, href, title].join(" ");

    if (
      includesAny(haystack, [
        "quick_web_template_product",
        "/kho-mau",
        "kho-mau",
        "kho mau",
        "/thiet-ke-web/kho-mau",
        "web preview",
        "preview/",
        "app-web-demo-services",
        "web-demo"
      ])
    ) {
      return PRODUCT_SCOPE.QUICK_WEB_TEMPLATE_PRODUCT;
    }

    if (
      includesAny(haystack, [
        "web_design_consulting",
        "/thiet-ke-web/theo-nganh",
        "thiet-ke-web/theo-nganh",
        "theo-nganh",
        "theo nganh",
        "/thiet-ke-web",
        "thiet-ke-web",
        "thiet ke web",
        "tu van",
        "bao gia"
      ])
    ) {
      return PRODUCT_SCOPE.WEB_DESIGN_CONSULTING;
    }

    if (
      includesAny(haystack, [
        "/phan-mem",
        "phan-mem",
        "phan mem",
        "/san-pham",
        "software",
        "license",
        "download",
        "app-",
        "key"
      ])
    ) {
      return PRODUCT_SCOPE.SOFTWARE;
    }

    // Legacy web_design should be treated as consulting.
    if (includesAny(haystack, [PRODUCT_SCOPE.LEGACY_WEB_DESIGN])) {
      return PRODUCT_SCOPE.WEB_DESIGN_CONSULTING;
    }

    return PRODUCT_SCOPE.SOFTWARE;
  }

  function getProductScopeLabel(scope) {
    if (scope === PRODUCT_SCOPE.QUICK_WEB_TEMPLATE_PRODUCT) {
      return "Web nhanh / Kho mẫu";
    }
    if (scope === PRODUCT_SCOPE.WEB_DESIGN_CONSULTING || scope === PRODUCT_SCOPE.LEGACY_WEB_DESIGN) {
      return "Thiết kế web tư vấn";
    }
    if (scope === PRODUCT_SCOPE.SOFTWARE) {
      return "Phần mềm";
    }
    return "Phần mềm";
  }

  global.CatalogScope = {
    PRODUCT_SCOPE: PRODUCT_SCOPE,
    getProductScope: getProductScope,
    getProductScopeLabel: getProductScopeLabel
  };
})(window);
