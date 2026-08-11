import { base44 } from "@/api/base44Client";
import { PLANS, PLAN_ORDER, getPlan as getStaticPlan, canUseFeature as staticCanUseFeature, getCurrentPlanId as getStaticPlanId } from "@/lib/plans";

let cache = { plans: null, currencies: null, offers: null, paymentMethods: null, config: null, configMap: null };
let loaded = false;
let loadingPromise = null;

export async function loadPricingData(force = false) {
  if (loaded && !force) return cache;
  if (loadingPromise && !force) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const [plans, currencies, offers, paymentMethods, config] = await Promise.all([
        base44.entities.Plan.list().catch(() => []),
        base44.entities.Currency.list().catch(() => []),
        base44.entities.Offer.list().catch(() => []),
        base44.entities.PaymentMethod.list().catch(() => []),
        base44.entities.PricingConfig.list().catch(() => []),
      ]);
      cache = { plans, currencies, offers, paymentMethods, config, configMap: {} };
      config.forEach(c => { cache.configMap[c.key] = c.value; });
      loaded = true;
      loadingPromise = null;
      return cache;
    } catch {
      loadingPromise = null;
      return cache;
    }
  })();
  return loadingPromise;
}

export function clearPricingCache() {
  loaded = false;
  cache = { plans: null, currencies: null, offers: null, paymentMethods: null, config: null, configMap: null };
}

export async function getDynamicPlans() {
  const { plans } = await loadPricingData();
  if (!plans || plans.length === 0) return [];
  return plans.filter(p => p.status === "active").sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getAllDynamicPlans() {
  const { plans } = await loadPricingData();
  return (plans || []).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getDynamicCurrencies() {
  const { currencies } = await loadPricingData();
  if (!currencies || currencies.length === 0) return [];
  return currencies.filter(c => c.enabled).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getDefaultCurrency() {
  const { currencies } = await loadPricingData();
  if (!currencies || currencies.length === 0) return null;
  return currencies.find(c => c.is_default) || currencies.find(c => c.enabled) || currencies[0];
}

export async function getDynamicOffers() {
  const { offers } = await loadPricingData();
  if (!offers || offers.length === 0) return [];
  const now = new Date();
  return offers.filter(o => {
    if (o.status !== "active") return false;
    if (o.start_date && new Date(o.start_date) > now) return false;
    if (o.end_date && new Date(o.end_date) < now) return false;
    if (o.max_uses > 0 && o.used_count >= o.max_uses) return false;
    return true;
  });
}

export async function getPaymentMethodsForCurrency(currencyCode) {
  const { paymentMethods } = await loadPricingData();
  if (!paymentMethods || paymentMethods.length === 0) return [];
  return paymentMethods
    .filter(m => m.currency_code === currencyCode && m.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getPlanPrice(plan, currencyCode, billingPeriod = "monthly") {
  if (!plan?.billing_periods) return 0;
  const period = plan.billing_periods[billingPeriod];
  if (!period || !period.enabled) return 0;
  return period.prices?.[currencyCode] || 0;
}

export function formatPrice(amount, currency) {
  if (!currency) return String(amount);
  const safe = Number(amount) || 0;
  const formatted = currency.decimals > 0
    ? safe.toFixed(currency.decimals)
    : String(Math.round(safe));
  return currency.position === "after"
    ? `${formatted} ${currency.symbol}`
    : `${currency.symbol}${formatted}`;
}

export async function getConfig(key, defaultValue = "") {
  await loadPricingData();
  return cache.configMap?.[key] ?? defaultValue;
}

export async function getAllConfig() {
  await loadPricingData();
  return cache.configMap || {};
}

export async function getEffectivePlan(user) {
  const dynamicPlans = await getDynamicPlans();
  if (dynamicPlans.length === 0) return getStaticPlan(user);
  const subId = user?.subscription || "free";
  return dynamicPlans.find(p => p.internal_id === subId) || dynamicPlans[0];
}

export async function canUseFeatureDynamic(user, featureKey) {
  const plan = await getEffectivePlan(user);
  if (plan?.features) {
    const val = plan.features[featureKey];
    return val === true || (typeof val === "number" && val > 0) || (typeof val === "string" && val !== "" && val !== "0" && val.toLowerCase() !== "disabled");
  }
  return staticCanUseFeature(user, featureKey);
}

export async function getCurrentPlanIdDynamic(user) {
  const dynamicPlans = await getDynamicPlans();
  if (dynamicPlans.length === 0) return getStaticPlanId(user);
  return user?.subscription || "free";
}

export const BILLING_PERIODS = [
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "half_yearly", label: "Half-Yearly" },
  { id: "yearly", label: "Yearly" },
  { id: "lifetime", label: "Lifetime" },
  { id: "trial", label: "Trial" },
  { id: "custom", label: "Custom" },
];

export const COMMON_FEATURES = [
  "buildsPerMonth", "apkDownloads", "aabDownloads", "storage", "projects",
  "privateProjects", "priorityQueue", "buildSpeed", "apiAccess", "teamMembers",
  "customDomain", "whiteLabel", "supportLevel", "analytics",
];