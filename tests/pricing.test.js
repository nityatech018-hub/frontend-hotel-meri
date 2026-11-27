import test from "node:test";
import assert from "node:assert/strict";
import { calculateStayPricing } from "../src/lib/hotel/pricing.js";

test("Client-approved sample bills: 5% GST only above ₹1,000, ₹0 on ₹1,000, ₹300 extra guest", () => {
  // 1. Non-AC (106-110), 2 guests: ₹1,000 + ₹0 GST = ₹1,000
  let bill = calculateStayPricing({ baseRate: 1000, nights: 1, rooms: 1, extraGuests: 0 });
  assert.equal(bill.roomBill, 1000);
  assert.equal(bill.gstAmount, 0);
  assert.equal(bill.total, 1000);

  // 2. Non-AC (106-110), 3 guests (+1 extra guest ₹300): ₹1,300 + ₹65 GST = ₹1,365
  bill = calculateStayPricing({ baseRate: 1000, nights: 1, rooms: 1, extraGuests: 1, extraGuestPrice: 300 });
  assert.equal(bill.roomBill, 1300);
  assert.equal(bill.gstAmount, 65);
  assert.equal(bill.total, 1365);

  // 3. AC Double (101, 102, 104), 2 guests: ₹1,200 + ₹60 GST = ₹1,260
  bill = calculateStayPricing({ baseRate: 1200, nights: 1, rooms: 1, extraGuests: 0 });
  assert.equal(bill.roomBill, 1200);
  assert.equal(bill.gstAmount, 60);
  assert.equal(bill.total, 1260);

  // 4. AC Double (101, 102, 104), 3 guests (+1 extra guest ₹300): ₹1,500 + ₹75 GST = ₹1,575
  bill = calculateStayPricing({ baseRate: 1200, nights: 1, rooms: 1, extraGuests: 1, extraGuestPrice: 300 });
  assert.equal(bill.roomBill, 1500);
  assert.equal(bill.gstAmount, 75);
  assert.equal(bill.total, 1575);

  // 5. AC Triple (103), 3 guests: ₹1,800 + ₹90 GST = ₹1,890
  bill = calculateStayPricing({ baseRate: 1800, nights: 1, rooms: 1, extraGuests: 0 });
  assert.equal(bill.roomBill, 1800);
  assert.equal(bill.gstAmount, 90);
  assert.equal(bill.total, 1890);

  // 6. AC Triple (103), 4 guests (+1 extra guest ₹300): ₹2,100 + ₹105 GST = ₹2,205
  bill = calculateStayPricing({ baseRate: 1800, nights: 1, rooms: 1, extraGuests: 1, extraGuestPrice: 300 });
  assert.equal(bill.roomBill, 2100);
  assert.equal(bill.gstAmount, 105);
  assert.equal(bill.total, 2205);

  // 7. AC Queen (105), 2 guests: ₹1,500 + ₹75 GST = ₹1,575
  bill = calculateStayPricing({ baseRate: 1500, nights: 1, rooms: 1, extraGuests: 0 });
  assert.equal(bill.roomBill, 1500);
  assert.equal(bill.gstAmount, 75);
  assert.equal(bill.total, 1575);

  // 8. AC Queen (105), 3 guests (+1 extra guest ₹300): ₹1,800 + ₹90 GST = ₹1,890
  bill = calculateStayPricing({ baseRate: 1500, nights: 1, rooms: 1, extraGuests: 1, extraGuestPrice: 300 });
  assert.equal(bill.roomBill, 1800);
  assert.equal(bill.gstAmount, 90);
  assert.equal(bill.total, 1890);
});

test("Configurable GST rule 'all' and separate food/water charges", () => {
  // Pending accountant confirmation mode: 5% GST on ₹1,000 as well
  const billAll = calculateStayPricing({
    baseRate: 1000,
    nights: 1,
    rooms: 1,
    gstRule: "all",
    foodCharges: 250,
    waterBottleCharges: 40,
  });
  assert.equal(billAll.gstAmount, 50);
  assert.equal(billAll.foodCharges, 250);
  assert.equal(billAll.waterBottleCharges, 40);
  assert.equal(billAll.total, 1340);
});
