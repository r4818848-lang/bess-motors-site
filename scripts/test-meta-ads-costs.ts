import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { summarizeMetaAds, validateMetaAdsRows, type MetaAdsDay } from "../src/lib/meta-ads-costs";

const rows: MetaAdsDay[] = [
  {date:"2026-11-17",account_id:"1111111111",account_name:"A",currency:"PLN",campaign:"Wymiana opon",campaign_id:"120252549849110706",spend:100.24,clicks:10,impressions:1000,meta_leads:2},
  {date:"2026-11-18",account_id:"1111111111",account_name:"A",currency:"PLN",campaign:"Wymiana opon",campaign_id:"120252549849110706",spend:200.12,clicks:20,impressions:2000,meta_leads:4},
  {date:"2026-11-18",account_id:"2222222222",account_name:"B",currency:"PLN",campaign:"Diagnostyka",campaign_id:"120252549849110707",spend:50.11,clicks:5,impressions:500,meta_leads:1},
];
const valid=validateMetaAdsRows(rows);
assert.equal(valid.length,3);
const totals=summarizeMetaAds(valid);
assert.equal(totals.spend,350.47);
assert.equal(totals.leads,7);
assert.equal(totals.campaigns.length,2);
assert.equal(totals.costPerMetaLead,50.07);
assert.equal(totals.campaigns.find(x=>x.name==="Wymiana opon")?.spend,300.36);
assert.throws(()=>validateMetaAdsRows([...rows,rows[0]]),/duplicate_meta_day/);
assert.throws(()=>validateMetaAdsRows([{...rows[0],currency:"EUR"}]),/unexpected_currency/);
assert.throws(()=>validateMetaAdsRows([{...rows[0],spend:-2}]),/invalid_meta_metric/);
assert.throws(()=>validateMetaAdsRows([{...rows[0],account_id:"not-an-account"}]),/invalid_meta_account/);

const route=readFileSync("src/app/api/crm/meta-ads/route.ts","utf8");
assert.match(route,/verifyToken/);
assert.match(route,/session\.role !== "admin"/);
assert.match(route,/WINDSOR_API_KEY/);
assert.match(route,/WINDSOR_META_ACCOUNT_IDS/);
assert.match(route,/Cache-Control":"private, no-store"/);
assert.match(route,/windsor_not_configured/);
assert.doesNotMatch(route,/metaAdsSnapshot|meta-ads-2026-11-18/);

const panel=readFileSync("src/components/crm/MetaAdsCostPanel.tsx","utf8");
assert.match(panel,/getItem\("bess-jwt"\)/);
assert.match(panel,/report\.dateFrom/);
assert.match(panel,/ROAS/);
assert.match(panel,/MetaAdsCostPanel/);
const helper=readFileSync("src/lib/meta-ads-costs.ts","utf8");
assert.doesNotMatch(helper,/src\/data|meta-ads-2026-11-18|1543185617320087/);
assert.match(readFileSync("src/components/crm/CrmExtendedReports.tsx","utf8"),/<MetaAdsCostPanel \/>/);
console.log("Meta Ads live connector: private API auth, PLN math and campaign aggregation OK");
