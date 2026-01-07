CREATE INDEX "idx_sessions_token" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_tenant_id" ON "sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_is_revoked" ON "sessions" USING btree ("is_revoked");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_tenant_id" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_users_super_admin" ON "users" USING btree ("is_super_admin");--> statement-breakpoint
CREATE INDEX "idx_users_created_at" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invoices_created_at_idx" ON "invoices" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invoices_billing_period_idx" ON "invoices" USING btree ("billing_period_start","billing_period_end");--> statement-breakpoint
CREATE INDEX "payments_payment_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tenants_created_at_idx" ON "tenants" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tenants_end_date_idx" ON "tenants" USING btree ("subscription_end_date");