// Subscription plan definitions and access-control helpers.
// The current plan is persisted on the user via base44.auth.updateMe({ subscription }).

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    projects: 1,
    buildsPerMonth: 3,
    storage: "100 MB",
    support: "Community",
    featureList: ["APK builds", "1 project", "3 builds/mo", "Basic loader", "Community support"],
    features: {
      apk: true, aab: false, branding: false, loadingAnimations: false,
      pushNotifications: false, admob: false, firebase: false,
      priorityQueue: false, premiumSupport: false,
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 499,
    projects: 3,
    buildsPerMonth: 25,
    storage: "1 GB",
    support: "Email",
    featureList: ["APK + AAB builds", "3 projects", "25 builds/mo", "Custom branding", "Custom loaders", "Email support"],
    features: {
      apk: true, aab: true, branding: true, loadingAnimations: true,
      pushNotifications: false, admob: false, firebase: false,
      priorityQueue: false, premiumSupport: false,
    },
  },
  professional: {
    id: "professional",
    name: "Professional",
    price: 1499,
    projects: 10,
    buildsPerMonth: 100,
    storage: "5 GB",
    support: "Priority email",
    featureList: ["Everything in Starter", "10 projects", "100 builds/mo", "Push notifications", "AdMob + Firebase", "Priority support"],
    features: {
      apk: true, aab: true, branding: true, loadingAnimations: true,
      pushNotifications: true, admob: true, firebase: true,
      priorityQueue: false, premiumSupport: true,
    },
  },
  business: {
    id: "business",
    name: "Business",
    price: 3499,
    projects: 50,
    buildsPerMonth: 500,
    storage: "20 GB",
    support: "24/7 chat",
    featureList: ["Everything in Professional", "50 projects", "500 builds/mo", "Priority build queue", "24/7 chat support"],
    features: {
      apk: true, aab: true, branding: true, loadingAnimations: true,
      pushNotifications: true, admob: true, firebase: true,
      priorityQueue: true, premiumSupport: true,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 9999,
    projects: Infinity,
    buildsPerMonth: Infinity,
    storage: "Unlimited",
    support: "Dedicated manager",
    featureList: ["Everything in Business", "Unlimited projects", "Unlimited builds", "Dedicated manager", "Custom SLA"],
    features: {
      apk: true, aab: true, branding: true, loadingAnimations: true,
      pushNotifications: true, admob: true, firebase: true,
      priorityQueue: true, premiumSupport: true,
    },
  },
};

export const PLAN_ORDER = ["free", "starter", "professional", "business", "enterprise"];

export const featureLabel = {
  aab: "AAB generation",
  branding: "Custom branding",
  loadingAnimations: "Custom loading animations",
  pushNotifications: "Push notifications",
  admob: "AdMob integration",
  firebase: "Firebase integration",
  priorityQueue: "Priority build queue",
  premiumSupport: "Premium support",
};

export const getCurrentPlanId = (user) => {
  const id = String(user?.subscription || "free").toLowerCase();
  return PLANS[id] ? id : "free";
};

export const getPlan = (user) => PLANS[getCurrentPlanId(user)];

export const canUseFeature = (user, feature) => !!getPlan(user).features[feature];

/**
 * Returns the first premium feature the project form enables that the user's
 * plan doesn't allow, or null if everything is permitted.
 */
export const findBlockedFeature = (user, form) => {
  const checks = [
    { key: "aab", on: form.build_type === "aab", feature: "aab" },
    { key: "branding", on: Boolean(form.app_icon || form.splash_logo || form.splash_background || form.feature_image || form.banner), feature: "branding" },
    { key: "loadingAnimations", on: form.loading_animation?.type && form.loading_animation.type !== "material_circular", feature: "loadingAnimations" },
    { key: "push", on: form.enable_push_notifications, feature: "pushNotifications" },
    { key: "admob", on: form.enable_ads, feature: "admob" },
    { key: "firebase", on: form.enable_firebase, feature: "firebase" },
  ];
  for (const c of checks) {
    if (c.on && !canUseFeature(user, c.feature)) return c.feature;
  }
  return null;
};

/** Next plan up that includes a given feature. */
export const planNeededFor = (feature) =>
  PLAN_ORDER.find((id) => PLANS[id].features[feature]) || "enterprise";