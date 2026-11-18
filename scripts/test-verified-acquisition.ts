import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mergeStoredDb, type ServiceLead, type WorkOrder } from "../src/lib/store";
import {
  parseVerifiedAcquisition,
  summarizeVerifiedAcquisition,
  ACQUISITION_CHANNELS,
} from "../src/lib/verified-acquisition";

const now = "2026-11-18T18:00:00.000Z";
const lead = {
  id:"lead-1", createdAt:"2026-11-15T10:00:00.000Z",
  updatedAt:"2026-11-15T10:00:00.000Z",firstName:"Test",
  lastName:"User",phone:"+48000000000",make:"",model:"",plate:"",vin:"",
  services:[],totalText:"",desiredDate:"",desiredTime:"",siteLocale:"pl",
  source:"meta_instant_form",sourceUrl:"",status:"booked",managerId:"",
  contacts:[],notifyStatus:"pending",notifyAttempts:0,
} as ServiceLead;
const db = mergeStoredDb({leads:[lead],appointments:[],workOrders:[]});
assert.equal(ACQUISITION_CHANNELS.length,6);
const payload = {
  channel:"instagram_direct",nature:"meta_paid",evidence:"client_confirmed",
  campaignId:"120252007744340373",leadId:"lead-1",
  manuallyConfirmed:true,confirmLeadMatch:true,
};
const confirmed = parseVerifiedAcquisition(payload,db,now);
assert.deepEqual(confirmed,{
  channel:"instagram_direct",nature:"meta_paid",evidence:"client_confirmed",
  campaignId:"120252007744340373",leadId:"lead-1",
  confirmedAt:now,confirmedBy:"admin",
});
assert.equal(parseVerifiedAcquisition({...payload,manuallyConfirmed:false},db,now),null);
assert.equal(parseVerifiedAcquisition({...payload,confirmLeadMatch:false},db,now),null);
assert.equal(parseVerifiedAcquisition({...payload,leadId:"fake"},db,now),null);
assert.equal(parseVerifiedAcquisition({...payload,campaignId:"Winter Tires"},db,now),null);
assert.equal(parseVerifiedAcquisition({...payload,nature:"organic"},db,now),null);
assert.equal(parseVerifiedAcquisition({...payload,channel:"telegram"},db,now),null);
assert.ok(parseVerifiedAcquisition({...payload,campaignId:"",leadId:""},db,now));
const paid = {
  id:"order-1",number:"BESS/2026/TEST1",userId:"user",vehicleId:"vehicle",
  status:"delivered",paymentStatus:"paid",
  createdAt:"2026-11-18T15:00:00.000Z",updatedAt:now,
  services:[{id:"service",name:"Brakes",qty:1,price:300,discount:0}],
  parts:[{id:"part",name:"Oil",qty:1,sellPrice:50,purchasePrice:25,discount:0}],
  orderDiscount:0,verifiedAcquisition:confirmed,
} as WorkOrder;
const unpaid = {
  ...paid,id:"order-2",paymentStatus:"unpaid",
  verifiedAcquisition:{...confirmed!,channel:"facebook_messenger" as const,campaignId:undefined,leadId:undefined},
} as WorkOrder;
const organic = {
  ...paid,id:"order-3",
  verifiedAcquisition:{...confirmed!,channel:"whatsapp" as const,nature:"organic" as const,campaignId:undefined,leadId:undefined},
} as WorkOrder;
const unknown = {...paid,id:"order-4",verifiedAcquisition:undefined} as WorkOrder;
db.workOrders=[paid,unpaid,organic,unknown];
let r=summarizeVerifiedAcquisition(db,"2026-11-01","2026-11-30");
assert.equal(r.metaPaidOrders,1);
assert.equal(r.metaPaidRevenue,350);
assert.equal(r.matchedPaidOrders,2);
assert.equal(r.matchedPaidRevenue,700);
assert.deepEqual(r.byMetaCampaign,[{campaignId:"120252007744340373",paidOrders:1,paidRevenue:350}]);
assert.equal(r.byChannel.find(x=>x.channel==="facebook_messenger")?.paidOrders,0);
assert.equal(r.byChannel.find(x=>x.channel==="whatsapp")?.nature,"organic");
assert.equal(r.missingCampaignPaidOrders,0);
assert.equal(summarizeVerifiedAcquisition(db,"2026-10-01","2026-10-31").metaPaidOrders,0);
paid.verifiedAcquisition={...confirmed!,campaignId:undefined};
r=summarizeVerifiedAcquisition(db,"2026-11-01","2026-11-30");
assert.equal(r.metaPaidOrders,1);
assert.equal(r.byMetaCampaign.length,0);
assert.equal(r.missingCampaignPaidOrders,1);
db.workOrders.push({...paid});
assert.equal(summarizeVerifiedAcquisition(db,"2026-11-01","2026-11-30").metaPaidOrders,1);
lead.createdAt="2026-10-15T08:00:00.000Z";
assert.equal(summarizeVerifiedAcquisition(db,"2026-11-01","2026-11-30").metaPaidOrders,0,
  "Old enquiries cannot be credited to new ad-period spend");
const api = readFileSync("src/app/api/crm/verified-acquisition/route.ts","utf8");
assert.match(api,/session\.role !== "admin"/);
assert.match(api,/cloudMutateCrmStore/);
assert.match(api,/appointment\.workOrderId !== order\.id/);
assert.match(api,/skipAutomation: true/);
assert.match(api,/manuallyConfirmed/);
const ui=readFileSync("src/components/crm/VerifiedAcquisitionPanel.tsx","utf8");
assert.match(ui,/ACQUISITION_CHANNELS/);
assert.match(ui,/manuallyConfirmed:true/);
assert.match(ui,/staffCrmFetch/);
assert.match(ui,/pullCrmFromCloud/);
assert.match(readFileSync("src/components/crm/CrmExtendedReports.tsx","utf8"),/<VerifiedAcquisitionPanel \/>/);
console.log("Six-channel attribution: explicit verification, campaign ID, paid-only credit and no double counts OK");
