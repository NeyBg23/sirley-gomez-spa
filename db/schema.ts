import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const siteContent = sqliteTable("site_content", {
  key: text("key").primaryKey(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});
export const admins = sqliteTable("admins", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull(),
});
export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  customer: text("customer").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  serviceId: text("service_id").notNull(),
  serviceName: text("service_name").notNull(),
  price: real("price").notNull(),
  date: text("date").notNull(),
  start: integer("start").notNull(),
  end: integer("end").notNull(),
  status: text("status").notNull().default("pending"),
  locale: text("locale").notNull(),
  createdAt: text("created_at").notNull(),
  requesterHash: text("requester_hash").notNull(),
}, t => [index("appointment_schedule").on(t.date, t.status), index("appointment_rate").on(t.requesterHash, t.createdAt)]);
export const giftOrders = sqliteTable("gift_orders", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  packageId: text("package_id").notNull(),
  packageName: text("package_name").notNull(),
  price: real("price").notNull(),
  recipient: text("recipient").notNull(),
  giver: text("giver").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  occasion: text("occasion").notNull(),
  locale: text("locale").notNull(),
  status: text("status").notNull().default("requested"),
  code: text("code"),
  token: text("token").unique(),
  createdAt: text("created_at").notNull(),
  issuedAt: text("issued_at"),
  redeemedAt: text("redeemed_at"),
  requesterHash: text("requester_hash").notNull(),
}, t => [index("gift_rate").on(t.requesterHash, t.createdAt)]);
