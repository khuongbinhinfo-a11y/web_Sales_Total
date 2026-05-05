(function initWebDemoCatalogMap(global) {
  var TEMPLATE_BY_INDUSTRY = {
    company: "company",
    shop: "shop",
    salon: "salon",
    industry: "industry",
    landing: "landing"
  };

  var PLAN_PRODUCT_IDS = {
    company: {
      "co-ban": "prod-web-demo-company-basic",
      "chuyen-nghiep": "prod-web-demo-company-pro",
      "thuong-hieu": "prod-web-demo-company-brand"
    },
    shop: {
      "shop-gioi-thieu": "prod-web-demo-shop-showcase",
      "shop-ban-hang": "prod-web-demo-shop-sales",
      "shop-nang-cao": "prod-web-demo-shop-advanced"
    },
    salon: {
      "spa-mini": "prod-web-demo-salon-mini",
      "spa-chuyen-nghiep": "prod-web-demo-salon-pro",
      "spa-ban-hang-dat-lich": "prod-web-demo-salon-booking"
    },
    industry: {
      "local-co-ban": "prod-web-demo-industry-basic",
      "menu-chuyen-nghiep": "prod-web-demo-industry-pro",
      "dat-ban-dat-mon": "prod-web-demo-industry-booking"
    },
    landing: {
      "tuyen-sinh-co-ban": "prod-web-demo-landing-basic",
      "trung-tam-dao-tao": "prod-web-demo-landing-pro",
      "he-thong-khoa-hoc": "prod-web-demo-landing-system"
    }
  };

  function getTemplateSlugForIndustry(industrySlug) {
    return TEMPLATE_BY_INDUSTRY[industrySlug] || industrySlug || "";
  }

  function getPlanProductId(industrySlug, planSlug) {
    var byIndustry = PLAN_PRODUCT_IDS[industrySlug] || {};
    return byIndustry[planSlug] || "";
  }

  global.WebDemoCatalogMap = {
    templateByIndustry: TEMPLATE_BY_INDUSTRY,
    planProductIds: PLAN_PRODUCT_IDS,
    getTemplateSlugForIndustry: getTemplateSlugForIndustry,
    getPlanProductId: getPlanProductId
  };
})(window);
